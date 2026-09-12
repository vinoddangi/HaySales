import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  collection,
  doc,
  FirestoreError,
  getDocs,
  increment,
  limit,
  orderBy,
  query,
  writeBatch,
} from 'firebase/firestore';
import { Customer } from '../../types';
import { db } from '../firebaseConfig'; // Your Firestore instance

export const customersApi = createApi({
  reducerPath: 'customersApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Customers'],
  endpoints: (builder) => ({
    // 1. Query: Fetch all customers
    getCustomers: builder.query<Customer[], void>({
      async queryFn() {
        try {
          const querySnapshot = await getDocs(collection(db, 'customers'));
          const customers: Customer[] = [];

          querySnapshot.forEach((doc) => {
            const data = doc.data();
            customers.push({
              id: doc.id,
              Id: data.Id as number,
              Name: data.Name as string,
              totalOutstandingDue: (data.totalOutstandingDue as number) || 0, // Make sure to load this
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

    // 2. Query: Fetch last 5 transactions for a customer
    getTransactions: builder.query<
      any[],
      { customerId: string; limitCount: number }
    >({
      async queryFn({ customerId, limitCount }) {
        try {
          const q = query(
            collection(db, 'customers', customerId, 'transactions'),
            orderBy('date', 'desc'),
            limit(limitCount),
          );
          const querySnapshot = await getDocs(q);
          const transactions: any[] = [];
          querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
          });
          return { data: transactions };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to fetch transactions',
          };
        }
      },
    }),

    // 3. Mutation: Process a sale or a payment atomically
    addTransaction: builder.mutation<
      void,
      {
        customerId: string;
        type: 'SALE' | 'PAYMENT';
        item?: string;
        weightKg?: number;
        amount?: number;
        discount?: number;
        cashPaid?: number;
        paymentAmount?: number;
      }
    >({
      async queryFn(data) {
        try {
          const batch = writeBatch(db);
          const transactionColRef = collection(
            db,
            'customers',
            data.customerId,
            'transactions',
          );
          const newTxRef = doc(transactionColRef);

          let amountOwedChange = 0;
          const txData: any = {
            type: data.type,
            date: new Date(),
          };

          if (data.type === 'SALE') {
            const finalPrice = Math.max(
              0,
              (data.amount || 0) - (data.discount || 0),
            );
            amountOwedChange = Math.max(0, finalPrice - (data.cashPaid || 0));

            txData.item = data.item;
            txData.weightKg = data.weightKg;
            txData.amount = data.amount;
            txData.discount = data.discount;
            txData.cashPaid = data.cashPaid;
            txData.remainingDue = amountOwedChange;
          } else if (data.type === 'PAYMENT') {
            amountOwedChange = -(data.paymentAmount || 0);
            txData.paymentAmount = data.paymentAmount;
          }

          batch.set(newTxRef, txData);

          const customerRef = doc(db, 'customers', data.customerId);
          batch.update(customerRef, {
            totalOutstandingDue: increment(amountOwedChange),
          });

          await batch.commit();
          return { data: undefined };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to save transaction',
          };
        }
      },
      invalidatesTags: ['Customers'],
    }),
  }),
});

// EXPORT ALL THREE HOOKS HERE:
export const {
  useGetCustomersQuery,
  useGetTransactionsQuery,
  useAddTransactionMutation,
} = customersApi;
