import {
  getPendingChangesCount,
  resetLocalDatabase,
  syncDatabaseWithCloud,
} from './helpers';
import { baseApi } from './baseApi';

export const syncApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
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
  overrideExisting: false,
});

export const {
  useGetPendingSyncCountQuery,
  useSyncDatabaseMutation,
  useResetDatabaseMutation,
} = syncApiSlice;
