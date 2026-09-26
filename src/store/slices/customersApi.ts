import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';
import {
  addCustomer,
  addOperationTransaction,
  deleteCustomer,
  deleteOperationTransaction,
  fetchCustomers,
  fetchCustomerTransactions,
  fetchOperationTransactions,
  getPendingChangesCount,
  resetLocalDatabase,
  syncDatabaseWithCloud,
  updateCustomer,
  updateOperationTransaction,
} from '../../api';
import {
  createCustomerTransaction,
  deleteCustomerTransactionWithDoubleEntry,
  updateCustomerTransactionWithDoubleEntry,
} from '../../business';
import {
  CustomerModel,
  CustomerTransactionData,
  OperationsTransactionData,
} from '../../models';

export const customersApi = createApi({
  reducerPath: 'customersApi',
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    'Customers',
    'CustomerTransactions',
    'OperationTransactions',
    'SyncStatus',
  ],
  endpoints: (builder) => ({
    // ── Customers ──
    getCustomers: builder.query<CustomerModel[], void>({
      async queryFn() {
        try {
          const data = await fetchCustomers();
          return { data };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to fetch customers',
          };
        }
      },
      providesTags: ['Customers'],
    }),

    addCustomer: builder.mutation<
      CustomerModel,
      Partial<CustomerModel> & { name: string }
    >({
      async queryFn(customer) {
        try {
          const data = await addCustomer(customer);
          return { data };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to add customer',
          };
        }
      },
      invalidatesTags: ['Customers', 'SyncStatus'],
    }),

    updateCustomer: builder.mutation<
      void,
      { id: string; data: Partial<CustomerModel> }
    >({
      async queryFn({ id, data }) {
        try {
          await updateCustomer(id, data);
          return { data: undefined };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to update customer',
          };
        }
      },
      invalidatesTags: ['Customers', 'SyncStatus'],
    }),

    deleteCustomer: builder.mutation<void, string>({
      async queryFn(id) {
        try {
          await deleteCustomer(id);
          return { data: undefined };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to delete customer',
          };
        }
      },
      invalidatesTags: ['Customers', 'SyncStatus'],
    }),

    // ── Customer Transactions ──
    getCustomerTransactions: builder.query<
      CustomerTransactionData[],
      string | undefined
    >({
      async queryFn(customerId) {
        try {
          const data = await fetchCustomerTransactions(customerId);
          return { data };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to fetch customer transactions',
          };
        }
      },
      providesTags: ['CustomerTransactions'],
    }),

    addCustomerTransaction: builder.mutation<
      CustomerTransactionData,
      CustomerTransactionData
    >({
      async queryFn(tx) {
        try {
          const data = await createCustomerTransaction(tx);
          return { data };
        } catch (error) {
          return {
            error:
              (error as Error).message || 'Failed to add customer transaction',
          };
        }
      },
      invalidatesTags: [
        'CustomerTransactions',
        'OperationTransactions',
        'Customers',
        'SyncStatus',
      ],
    }),

    updateCustomerTransaction: builder.mutation<
      void,
      { id: string; data: Partial<CustomerTransactionData> }
    >({
      async queryFn({ id, data }) {
        try {
          await updateCustomerTransactionWithDoubleEntry(id, data);
          return { data: undefined };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to update customer transaction',
          };
        }
      },
      invalidatesTags: [
        'CustomerTransactions',
        'OperationTransactions',
        'Customers',
        'SyncStatus',
      ],
    }),

    deleteCustomerTransaction: builder.mutation<void, string>({
      async queryFn(id) {
        try {
          await deleteCustomerTransactionWithDoubleEntry(id);
          return { data: undefined };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to delete customer transaction',
          };
        }
      },
      invalidatesTags: [
        'CustomerTransactions',
        'OperationTransactions',
        'Customers',
        'SyncStatus',
      ],
    }),

    // ── Operation Transactions ──
    getOperationTransactions: builder.query<OperationsTransactionData[], void>({
      async queryFn() {
        try {
          const data = await fetchOperationTransactions();
          return { data };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to fetch operation transactions',
          };
        }
      },
      providesTags: ['OperationTransactions'],
    }),

    addOperationTransaction: builder.mutation<
      OperationsTransactionData,
      OperationsTransactionData
    >({
      async queryFn(tx) {
        try {
          const data = await addOperationTransaction(tx);
          return { data };
        } catch (error) {
          return {
            error:
              (error as Error).message || 'Failed to add operation transaction',
          };
        }
      },
      invalidatesTags: ['OperationTransactions', 'SyncStatus'],
    }),

    updateOperationTransaction: builder.mutation<
      void,
      { id: string; data: Partial<OperationsTransactionData> }
    >({
      async queryFn({ id, data }) {
        try {
          await updateOperationTransaction(id, data);
          return { data: undefined };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to update operation transaction',
          };
        }
      },
      invalidatesTags: ['OperationTransactions', 'SyncStatus'],
    }),

    deleteOperationTransaction: builder.mutation<void, string>({
      async queryFn(id) {
        try {
          await deleteOperationTransaction(id);
          return { data: undefined };
        } catch (error) {
          return {
            error:
              (error as Error).message ||
              'Failed to delete operation transaction',
          };
        }
      },
      invalidatesTags: ['OperationTransactions', 'SyncStatus'],
    }),

    // ── Sync & Offline Status ──
    getPendingSyncCount: builder.query<number, void>({
      async queryFn() {
        try {
          const count = await getPendingChangesCount();
          return { data: count };
        } catch {
          return { data: 0 };
        }
      },
      providesTags: ['SyncStatus'],
    }),

    syncDatabase: builder.mutation<
      {
        publishedCount: number;
        customersCount: number;
        customerTransactionsCount: number;
        operationTransactionsCount: number;
      },
      void
    >({
      async queryFn() {
        try {
          const result = await syncDatabaseWithCloud();
          return { data: result };
        } catch (error) {
          return {
            error:
              (error as Error).message || 'Failed to sync with cloud database',
          };
        }
      },
      invalidatesTags: [
        'Customers',
        'CustomerTransactions',
        'OperationTransactions',
        'SyncStatus',
      ],
    }),

    resetDatabase: builder.mutation<void, void>({
      async queryFn() {
        try {
          await resetLocalDatabase();
          return { data: undefined };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to reset local database',
          };
        }
      },
      invalidatesTags: [
        'Customers',
        'CustomerTransactions',
        'OperationTransactions',
        'SyncStatus',
      ],
    }),
  }),
});

export const {
  useGetCustomersQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
  useGetCustomerTransactionsQuery,
  useAddCustomerTransactionMutation,
  useUpdateCustomerTransactionMutation,
  useDeleteCustomerTransactionMutation,
  useGetOperationTransactionsQuery,
  useAddOperationTransactionMutation,
  useUpdateOperationTransactionMutation,
  useDeleteOperationTransactionMutation,
  useGetPendingSyncCountQuery,
  useSyncDatabaseMutation,
  useResetDatabaseMutation,
} = customersApi;
