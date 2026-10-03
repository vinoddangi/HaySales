import { createApi, fakeBaseQuery } from '@reduxjs/toolkit/query/react';

export const baseApi = createApi({
  reducerPath: 'api',
  baseQuery: fakeBaseQuery(),
  tagTypes: [
    'Customers',
    'CustomerTransactions',
    'OperationTransactions',
    'SyncStatus',
  ],
  endpoints: () => ({}),
});
