import { fetchCustomerTransactions } from './helpers';
import {
  createCustomerTransaction,
  deleteCustomerTransactionWithDoubleEntry,
  updateCustomerTransactionWithDoubleEntry,
} from '../../business';
import { CustomerTransactionData } from '../../models';
import { baseApi } from './baseApi';

export const customerTransactionsApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
  overrideExisting: false,
});

export const {
  useGetCustomerTransactionsQuery,
  useAddCustomerTransactionMutation,
  useUpdateCustomerTransactionMutation,
  useDeleteCustomerTransactionMutation,
} = customerTransactionsApiSlice;
