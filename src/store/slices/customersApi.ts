import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  addCustomerTransactionApi,
  AddCustomerTransactionParams,
  addPurchaseApi,
  AddPurchaseParams,
  BackupResult,
  BackupStatus,
  backupYearlyTransactionsApi,
  deleteCustomerTransactionApi,
  deletePurchaseApi,
  fetchAllTransactionsApi,
  fetchBackupStatusApi,
  fetchCustomersApi,
  fetchCustomerTransactionsApi,
  fetchPurchasesApi,
  updateCustomerTransactionApi,
  updatePurchaseApi,
} from '../../api';
import { Customer, Transaction } from '../../types';

export type { BackupResult, BackupStatus } from '../../api';
export type { Customer, Transaction } from '../../types';

export const customersApi = createApi({
  reducerPath: 'customersApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Customers', 'Transactions', 'Purchases', 'BackupStatus'],
  endpoints: (builder) => ({
    // 0. Query: Fetch all transactions across all customers & purchases for dashboard metrics & activity
    getAllTransactions: builder.query<Transaction[], void>({
      async queryFn() {
        try {
          const transactions = await fetchAllTransactionsApi();
          return { data: transactions };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to fetch dashboard transactions',
          };
        }
      },
      providesTags: ['Transactions'],
    }),

    // 0.1 Query: Fetch backup status metadata
    getBackupStatus: builder.query<BackupStatus, void>({
      async queryFn() {
        try {
          const status = await fetchBackupStatusApi();
          return { data: status };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to fetch backup status',
          };
        }
      },
      providesTags: ['BackupStatus'],
    }),

    // 1. Query: Fetch all customers with their running outstandingAmount
    getCustomers: builder.query<Customer[], void>({
      async queryFn() {
        try {
          const customers = await fetchCustomersApi();
          return { data: customers };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to fetch customers',
          };
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
          const transactions = await fetchCustomerTransactionsApi(
            customerId,
            limitCount,
          );
          return { data: transactions };
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
    addTransaction: builder.mutation<void, AddCustomerTransactionParams>({
      async queryFn(data) {
        try {
          await addCustomerTransactionApi(data);
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
          const purchases = await fetchPurchasesApi();
          return { data: purchases };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to fetch purchases',
          };
        }
      },
      providesTags: ['Purchases'],
    }),

    // 5. Mutation: Add a new Purchase or Expense entry
    addPurchaseTransaction: builder.mutation<void, AddPurchaseParams>({
      async queryFn(data) {
        try {
          await addPurchaseApi(data);
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
          await updateCustomerTransactionApi(customerId, transactionId, data);
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
          await deleteCustomerTransactionApi(customerId, transactionId);
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
          await updatePurchaseApi(id, data);
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
          await deletePurchaseApi(id);
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

    // 10. Mutation: Backup/Rollout transactions by year to Transactions-(YYYY), aggregate balance, and create opening balance
    backupYearlyTransactions: builder.mutation<
      BackupResult,
      { year?: number } | void
    >({
      async queryFn(arg) {
        try {
          const result = await backupYearlyTransactionsApi(arg?.year);
          return { data: result };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to backup transactions',
          };
        }
      },
      invalidatesTags: [
        'Customers',
        'Transactions',
        'Purchases',
        'BackupStatus',
      ],
    }),
  }),
});

// EXPORT HOOKS HERE:
export const {
  useGetAllTransactionsQuery,
  useGetBackupStatusQuery,
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
