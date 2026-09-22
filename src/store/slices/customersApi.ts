import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  addCustomerTransactionApi,
  AddCustomerTransactionParams,
  addPurchaseApi,
  AddPurchaseParams,
  deleteCustomerTransactionApi,
  deletePurchaseApi,
  fetchAllTransactionsApi,
  fetchCustomersApi,
  fetchCustomerTransactionsApi,
  fetchMonthlyRolloutStatusApi,
  fetchPurchasesApi,
  rolloutMonthApi,
  updateCustomerTransactionApi,
  updatePurchaseApi,
} from '../../api';
import {
  Customer,
  MonthlyRolloutStatus,
  MonthlyTradingSummary,
  Transaction,
} from '../../types';

export type {
  Customer,
  MonthlyRolloutStatus,
  MonthlyTradingSummary,
  Transaction,
} from '../../types';

export const customersApi = createApi({
  reducerPath: 'customersApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: ['Customers', 'Transactions', 'Purchases', 'MonthlyRolloutStatus'],
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

    // 0.2 Query: Fetch monthly rollout status metadata
    getMonthlyRolloutStatus: builder.query<MonthlyRolloutStatus, void>({
      async queryFn() {
        try {
          const status = await fetchMonthlyRolloutStatusApi();
          return { data: status };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to fetch monthly rollout status',
          };
        }
      },
      providesTags: ['MonthlyRolloutStatus'],
    }),

    // 10. Mutation: Rollout month and update metadata
    rolloutMonth: builder.mutation<
      MonthlyRolloutStatus,
      { month: string; summary?: MonthlyTradingSummary }
    >({
      async queryFn({ month, summary }) {
        try {
          const result = await rolloutMonthApi(month, summary);
          return { data: result };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to rollout month',
          };
        }
      },
      invalidatesTags: ['MonthlyRolloutStatus'],
    }),
  }),
});

// EXPORT HOOKS HERE:
export const {
  useGetAllTransactionsQuery,
  useGetMonthlyRolloutStatusQuery,
  useGetCustomersQuery,
  useGetTransactionsQuery,
  useGetPurchasesQuery,
  useAddTransactionMutation,
  useUpdateTransactionMutation,
  useDeleteTransactionMutation,
  useAddPurchaseTransactionMutation,
  useUpdatePurchaseTransactionMutation,
  useDeletePurchaseTransactionMutation,
  useRolloutMonthMutation,
} = customersApi;
