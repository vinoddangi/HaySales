import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  addDoc,
  collection,
  collectionGroup,
  deleteDoc,
  doc,
  FirestoreError,
  getDocs,
  increment,
  updateDoc,
  writeBatch,
} from 'firebase/firestore';
import { Customer, Transaction } from '../../types';
import { db } from '../firebaseConfig';

export type { Customer, Transaction } from '../../types';

export const customersApi = createApi({
  reducerPath: 'customersApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Customers', 'Transactions', 'Purchases'],
  endpoints: (builder) => ({
    // 0. Query: Fetch all transactions across all customers & purchases for dashboard metrics & activity
    getAllTransactions: builder.query<Transaction[], void>({
      async queryFn() {
        try {
          const transactions: Transaction[] = [];

          // 1. Fetch customers map for associating customer names
          const customerMap = new Map<string, string>();
          try {
            const custSnap = await getDocs(collection(db, 'customers'));
            custSnap.forEach((cDoc) => {
              const cData = cDoc.data();
              const cName = ((cData.name || cData.Name || '') as string).trim();
              if (cName) customerMap.set(cDoc.id, cName);
            });
          } catch (e) {
            console.warn('Error fetching customers map:', e);
          }

          // 2. Fetch customer transactions
          try {
            const colGroupRef = collectionGroup(db, 'transactions');
            const querySnapshot = await getDocs(colGroupRef);
            querySnapshot.forEach((docSnap) => {
              const data = docSnap.data();
              const customerId = docSnap.ref.parent.parent?.id;
              const customerName =
                (customerId ? customerMap.get(customerId) : '') ||
                data.customerName ||
                '';
              transactions.push({
                id: docSnap.id,
                customerId,
                customerName,
                ...data,
              } as Transaction);
            });
          } catch (e) {
            console.warn('Error fetching customer transactions:', e);
          }

          // 3. Fetch purchases & expenses from root 'purchases' collection
          try {
            const purchasesSnap = await getDocs(collection(db, 'purchases'));
            purchasesSnap.forEach((docSnap) => {
              const data = docSnap.data();
              transactions.push({
                id: docSnap.id,
                type: (data.type || 'PURCHASE') as Transaction['type'],
                ...data,
              } as Transaction);
            });
          } catch (pErr) {
            console.warn('Error fetching purchases:', pErr);
          }

          // Sort descending by date
          transactions.sort((a, b) => {
            const getTime = (d: any) => {
              if (!d) return 0;
              if (typeof d === 'object' && 'seconds' in d && d.seconds) {
                return d.seconds * 1000;
              }
              const parsed = new Date(d).getTime();
              return isNaN(parsed) ? 0 : parsed;
            };
            return getTime(b.date) - getTime(a.date);
          });

          return { data: transactions };
        } catch (error) {
          const err = error as FirestoreError;
          return {
            error: err.message || 'Failed to fetch dashboard transactions',
          };
        }
      },
      providesTags: ['Transactions', 'Purchases'],
    }),

    // 1. Query: Fetch all customers with their running outstandingAmount
    getCustomers: builder.query<Customer[], void>({
      async queryFn() {
        try {
          const querySnapshot = await getDocs(collection(db, 'customers'));
          const customers: Customer[] = [];

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            customers.push({
              id: docSnap.id,
              name: ((data.name || data.Name || '') as string).trim(),
              mobile: (data.mobile || data.Mobile) as string | undefined,
              creditLimit: (data.creditLimit as number) || 35000,
              outstandingAmount: (data.outstandingAmount as number) || 0,
            });
          });

          return { data: customers };
        } catch (error) {
          const err = error as FirestoreError;
          return { error: err.message || 'Failed to fetch customers' };
        }
      },
      providesTags: ['Customers'],
    }),

    // 2. Query: Fetch transactions for a specific customer (on-demand / drawer)
    getTransactions: builder.query<
      Transaction[],
      { customerId: string; limitCount?: number }
    >({
      async queryFn({ customerId, limitCount }) {
        try {
          if (!customerId) return { data: [] };

          const colRef = collection(
            db,
            'customers',
            customerId,
            'transactions',
          );
          const querySnapshot = await getDocs(colRef);
          const transactions: Transaction[] = [];

          querySnapshot.forEach((docSnap) => {
            transactions.push({
              id: docSnap.id,
              ...docSnap.data(),
            } as Transaction);
          });

          // Safe sorting: Handles Timestamp objects, ISO strings, Dates, and missing dates
          transactions.sort((a, b) => {
            const getTime = (d: any) => {
              if (!d) return 0;
              if (typeof d === 'object' && 'seconds' in d && d.seconds) {
                return d.seconds * 1000;
              }
              const parsed = new Date(d).getTime();
              return isNaN(parsed) ? 0 : parsed;
            };
            return getTime(b.date) - getTime(a.date);
          });

          const result =
            limitCount && limitCount > 0
              ? transactions.slice(0, limitCount)
              : transactions;

          return { data: result };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to fetch transactions',
          };
        }
      },
      providesTags: (_result, _error, arg) => [
        { type: 'Transactions', id: arg.customerId },
      ],
    }),

    // 3. Mutation: Record sale/service/payment and atomically update customer's outstandingAmount
    addTransaction: builder.mutation<
      void,
      {
        customerId: string;
        type: 'SALE' | 'SERVICE' | 'PAYMENT';
        item?: string;
        weightKg?: number;
        amount?: number;
        discount?: number;
        cashPaid?: number;
        paymentAmount?: number;
        date?: Date | string;
        note?: string;
      }
    >({
      async queryFn(data) {
        try {
          const batch = writeBatch(db);
          const customerRef = doc(db, 'customers', data.customerId);
          const transactionColRef = collection(
            db,
            'customers',
            data.customerId,
            'transactions',
          );
          const newTxRef = doc(transactionColRef);

          let balanceChange = 0;
          const txData: any = {
            type: data.type,
            date: data.date ? new Date(data.date) : new Date(),
          };

          if (data.note) {
            txData.note = data.note;
          }

          if (data.type === 'SALE' || data.type === 'SERVICE') {
            const finalPrice = Math.max(
              0,
              (data.amount || 0) - (data.discount || 0),
            );
            balanceChange = Math.max(0, finalPrice - (data.cashPaid || 0));

            txData.item = data.item;
            if (data.type === 'SALE') {
              txData.weightKg = data.weightKg;
            }
            txData.amount = data.amount;
            txData.discount = data.discount;
            txData.cashPaid = data.cashPaid;
            txData.remainingDue = balanceChange;
          } else if (data.type === 'PAYMENT') {
            balanceChange = -(data.paymentAmount || 0);
            txData.paymentAmount = data.paymentAmount;
          }

          // 1. Create transaction entry
          batch.set(newTxRef, txData);

          // 2. Atomically update outstandingAmount on customer document
          if (balanceChange !== 0) {
            batch.set(
              customerRef,
              { outstandingAmount: increment(balanceChange) },
              { merge: true },
            );
          }

          await batch.commit();
          return { data: undefined };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to save transaction',
          };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        'Customers',
        'Transactions',
        { type: 'Transactions', id: arg.customerId },
      ],
    }),

    // 4. Query: Fetch all purchases and expenses
    getPurchases: builder.query<Transaction[], void>({
      async queryFn() {
        try {
          const querySnapshot = await getDocs(collection(db, 'purchases'));
          const purchases: Transaction[] = [];

          querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            purchases.push({
              id: docSnap.id,
              type: (data.type || 'PURCHASE') as Transaction['type'],
              ...data,
            } as Transaction);
          });

          // Sort descending by date
          purchases.sort((a, b) => {
            const getTime = (d: any) => {
              if (!d) return 0;
              if (typeof d === 'object' && 'seconds' in d && d.seconds) {
                return d.seconds * 1000;
              }
              const parsed = new Date(d).getTime();
              return isNaN(parsed) ? 0 : parsed;
            };
            return getTime(b.date) - getTime(a.date);
          });

          return { data: purchases };
        } catch (error) {
          const err = error as FirestoreError;
          return { error: err.message || 'Failed to fetch purchases' };
        }
      },
      providesTags: ['Purchases'],
    }),

    // 5. Mutation: Add a new Purchase or Expense entry
    addPurchaseTransaction: builder.mutation<
      void,
      {
        type: 'PURCHASE' | 'EXPENSE';
        category: 'Purchase' | 'Expense';
        item?: string;
        expenseCategory?: string;
        weightKg?: number;
        amount: number;
        cashPaid?: number;
        vendorName?: string;
        note?: string;
        date?: Date | string;
      }
    >({
      async queryFn(data) {
        try {
          const purchasesCol = collection(db, 'purchases');
          const txData: any = {
            type: data.type,
            category: data.category,
            amount: Number(data.amount) || 0,
            date: data.date ? new Date(data.date) : new Date(),
          };

          if (data.type === 'PURCHASE') {
            txData.item = data.item;
            txData.weightKg = Number(data.weightKg) || 0;
            txData.cashPaid =
              data.cashPaid !== undefined
                ? Number(data.cashPaid)
                : Number(data.amount);
            if (txData.weightKg > 0) {
              txData.purchaseRate = txData.amount / txData.weightKg;
            }
          } else if (data.type === 'EXPENSE') {
            txData.expenseCategory = data.expenseCategory || 'Others';
          }

          if (data.vendorName) txData.vendorName = data.vendorName;
          if (data.note) txData.note = data.note;

          await addDoc(purchasesCol, txData);
          return { data: undefined };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to record purchase/expense transaction',
          };
        }
      },
      invalidatesTags: ['Purchases', 'Transactions'],
    }),

    // 6. Mutation: Update an existing customer sale/payment transaction
    updateTransaction: builder.mutation<
      void,
      {
        customerId: string;
        transactionId: string;
        data: Partial<Transaction>;
      }
    >({
      async queryFn({ customerId, transactionId, data }) {
        try {
          const txRef = doc(
            db,
            'customers',
            customerId,
            'transactions',
            transactionId,
          );
          const updateData: any = {};
          if (data.item !== undefined) updateData.item = data.item;
          if (data.weightKg !== undefined)
            updateData.weightKg = Number(data.weightKg) || 0;
          if (data.amount !== undefined)
            updateData.amount = Number(data.amount) || 0;
          if (data.discount !== undefined)
            updateData.discount = Number(data.discount) || 0;
          if (data.cashPaid !== undefined)
            updateData.cashPaid = Number(data.cashPaid) || 0;
          if (data.paymentAmount !== undefined)
            updateData.paymentAmount = Number(data.paymentAmount) || 0;
          if (data.date !== undefined)
            updateData.date = new Date(data.date as any);
          if (data.note !== undefined) updateData.note = data.note;

          if (data.type === 'SALE' || data.type === 'SERVICE') {
            const finalPrice = Math.max(
              0,
              (updateData.amount ?? 0) - (updateData.discount ?? 0),
            );
            updateData.remainingDue = Math.max(
              0,
              finalPrice - (updateData.cashPaid ?? 0),
            );
          }

          await updateDoc(txRef, updateData);

          // Re-aggregate and update customer running balance
          const txSnap = await getDocs(
            collection(db, 'customers', customerId, 'transactions'),
          );
          let balance = 0;
          txSnap.forEach((d) => {
            const t = d.data();
            if (t.type === 'PAYMENT') {
              balance -= Number(t.paymentAmount) || 0;
            } else {
              const credit =
                t.remainingDue !== undefined
                  ? Number(t.remainingDue) || 0
                  : (Number(t.amount) || 0) - (Number(t.cashPaid) || 0);
              balance += credit;
            }
          });
          const customerRef = doc(db, 'customers', customerId);
          await updateDoc(customerRef, {
            outstandingAmount: Math.max(0, balance),
          });

          return { data: undefined };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to update transaction',
          };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        'Customers',
        'Transactions',
        { type: 'Transactions', id: arg.customerId },
      ],
    }),

    // 7. Mutation: Delete a customer transaction
    deleteTransaction: builder.mutation<
      void,
      { customerId: string; transactionId: string }
    >({
      async queryFn({ customerId, transactionId }) {
        try {
          const txRef = doc(
            db,
            'customers',
            customerId,
            'transactions',
            transactionId,
          );
          await deleteDoc(txRef);

          // Re-aggregate customer balance
          const txSnap = await getDocs(
            collection(db, 'customers', customerId, 'transactions'),
          );
          let balance = 0;
          txSnap.forEach((d) => {
            const t = d.data();
            if (t.type === 'PAYMENT') {
              balance -= Number(t.paymentAmount) || 0;
            } else {
              const credit =
                t.remainingDue !== undefined
                  ? Number(t.remainingDue) || 0
                  : (Number(t.amount) || 0) - (Number(t.cashPaid) || 0);
              balance += credit;
            }
          });
          const customerRef = doc(db, 'customers', customerId);
          await updateDoc(customerRef, {
            outstandingAmount: Math.max(0, balance),
          });

          return { data: undefined };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to delete transaction',
          };
        }
      },
      invalidatesTags: (_result, _error, arg) => [
        'Customers',
        'Transactions',
        { type: 'Transactions', id: arg.customerId },
      ],
    }),

    // 8. Mutation: Update an existing Purchase / Expense
    updatePurchaseTransaction: builder.mutation<
      void,
      { id: string; data: Partial<Transaction> }
    >({
      async queryFn({ id, data }) {
        try {
          const pRef = doc(db, 'purchases', id);
          const updateData: any = {};
          if (data.item !== undefined) updateData.item = data.item;
          if (data.expenseCategory !== undefined)
            updateData.expenseCategory = data.expenseCategory;
          if (data.weightKg !== undefined)
            updateData.weightKg = Number(data.weightKg) || 0;
          if (data.amount !== undefined)
            updateData.amount = Number(data.amount) || 0;
          if (data.cashPaid !== undefined)
            updateData.cashPaid = Number(data.cashPaid) || 0;
          if (data.vendorName !== undefined)
            updateData.vendorName = data.vendorName;
          if (data.note !== undefined) updateData.note = data.note;
          if (data.date !== undefined)
            updateData.date = new Date(data.date as any);

          if (
            data.type === 'PURCHASE' &&
            updateData.weightKg > 0 &&
            updateData.amount > 0
          ) {
            updateData.purchaseRate = updateData.amount / updateData.weightKg;
          }

          await updateDoc(pRef, updateData);
          return { data: undefined };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to update purchase transaction',
          };
        }
      },
      invalidatesTags: ['Purchases', 'Transactions'],
    }),

    // 9. Mutation: Delete a purchase / expense
    deletePurchaseTransaction: builder.mutation<void, { id: string }>({
      async queryFn({ id }) {
        try {
          const pRef = doc(db, 'purchases', id);
          await deleteDoc(pRef);
          return { data: undefined };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to delete purchase transaction',
          };
        }
      },
      invalidatesTags: ['Purchases', 'Transactions'],
    }),

    // 4. Mutation: Backup/Rollout transactions by year to Transactions-(YYYY), aggregate balance, and create opening balance
    backupYearlyTransactions: builder.mutation<
      { backedUpCount: number; customersProcessed: number; targetYear: number },
      { year?: number }
    >({
      async queryFn(arg) {
        try {
          const targetYear = arg?.year || new Date().getFullYear();
          const backupColName = `Transactions-${targetYear}`;
          const customersSnap = await getDocs(collection(db, 'customers'));

          let backedUpCount = 0;
          let customersProcessed = 0;

          for (const custDoc of customersSnap.docs) {
            const custId = custDoc.id;
            const currentTxCol = collection(
              db,
              'customers',
              custId,
              'transactions',
            );
            const txSnap = await getDocs(currentTxCol);

            // If no active transactions exist, skip this customer
            if (txSnap.empty) continue;

            const batch = writeBatch(db);
            const backupColRef = collection(
              db,
              'customers',
              custId,
              backupColName,
            );

            // Active transactions already reflect the logged outstanding balance from previous backups (via OPENING_BALANCE / running balance).
            // Do NOT add existing backup subcollection documents into cumulativeDue, which would double-count historical balance.
            let cumulativeDue = 0;

            // Process and merge active transactions into the target backup subcollection
            txSnap.forEach((tDoc) => {
              const data = tDoc.data();
              // 1. Copy/Update record in Transactions-(YYYY) with merge
              const backupDocRef = doc(backupColRef, tDoc.id);
              batch.set(backupDocRef, data, { merge: true });

              // 2. Aggregate active balance accurately
              if (data.type === 'PAYMENT') {
                cumulativeDue -= Number(data.paymentAmount) || 0;
              } else {
                const credit =
                  data.remainingDue !== undefined
                    ? Number(data.remainingDue) || 0
                    : (Number(data.amount) || 0) - (Number(data.cashPaid) || 0);
                cumulativeDue += credit;
              }

              // 3. Delete from active transactions
              batch.delete(tDoc.ref);
              backedUpCount++;
            });

            const finalOpeningDue = Math.max(0, cumulativeDue);

            // 4. Create single aggregated previous outstanding opening balance entry
            if (finalOpeningDue > 0) {
              const newOpeningRef = doc(currentTxCol, 'opening_balance');
              batch.set(newOpeningRef, {
                type: 'OPENING_BALANCE',
                item: 'Previous Outstanding',
                amount: finalOpeningDue,
                cashPaid: 0,
                remainingDue: finalOpeningDue,
                date: new Date(),
                note: `Cumulative balance rolled over into ${backupColName}`,
              });
            }

            // 5. Update customer doc outstandingAmount
            batch.set(
              custDoc.ref,
              { outstandingAmount: finalOpeningDue },
              { merge: true },
            );

            await batch.commit();
            customersProcessed++;
          }

          return { data: { backedUpCount, customersProcessed, targetYear } };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to backup transactions',
          };
        }
      },
      invalidatesTags: ['Customers', 'Transactions'],
    }),
  }),
});

// EXPORT HOOKS HERE:
export const {
  useGetAllTransactionsQuery,
  useGetCustomersQuery,
  useGetTransactionsQuery,
  useGetPurchasesQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useAddPurchaseTransactionMutation,
  useUpdatePurchaseTransactionMutation,
  useDeletePurchaseTransactionMutation,
  useBackupYearlyTransactionsMutation,
} = customersApi;
