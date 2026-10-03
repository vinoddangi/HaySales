import {
  addOperationTransaction,
  deleteOperationTransaction,
  fetchOperationTransactions,
  updateOperationTransaction,
} from './helpers';
import { OperationsTransactionData } from '../../models';
import { baseApi } from './baseApi';

export const operationTransactionsApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  }),
  overrideExisting: false,
});

export const {
  useGetOperationTransactionsQuery,
  useAddOperationTransactionMutation,
  useUpdateOperationTransactionMutation,
  useDeleteOperationTransactionMutation,
} = operationTransactionsApiSlice;
