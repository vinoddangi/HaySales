import { useCallback } from 'react';
import { useAppDispatch } from '../hooks';
import {
  customersApi,
  useGetAllTransactionsQuery,
  useGetCustomersQuery,
  useGetPurchasesQuery,
} from '../slices/customersApi';
import { showSnackbar } from '../slices/uiSlice';

/**
 * Hook to initialize all essential app documents into the Redux store on launch
 * and provide a global refresh function.
 */
export function useAppInit() {
  const dispatch = useAppDispatch();

  // Initially fetch all core documents into Redux store
  const {
    data: allTransactions = [],
    isLoading: isLoadingTx,
    isFetching: isFetchingTx,
    refetch: refetchTx,
  } = useGetAllTransactionsQuery();

  const {
    data: customers = [],
    isLoading: isLoadingCust,
    isFetching: isFetchingCust,
    refetch: refetchCust,
  } = useGetCustomersQuery();

  const {
    data: purchases = [],
    isLoading: isLoadingPurch,
    isFetching: isFetchingPurch,
    refetch: refetchPurch,
  } = useGetPurchasesQuery();

  const isInitialLoading = isLoadingTx || isLoadingCust || isLoadingPurch;
  const isRefreshing = isFetchingTx || isFetchingCust || isFetchingPurch;

  /**
   * Refetches all documents from Firestore and invalidates relevant tags in Redux
   */
  const refreshAllData = useCallback(async () => {
    try {
      dispatch(
        customersApi.util.invalidateTags([
          'Customers',
          'Transactions',
          'Purchases',
        ]),
      );
      await Promise.allSettled([refetchTx(), refetchCust(), refetchPurch()]);
      dispatch(showSnackbar({ message: 'All data refreshed successfully' }));
    } catch {
      dispatch(showSnackbar({ message: 'Failed to refresh some data' }));
    }
  }, [dispatch, refetchTx, refetchCust, refetchPurch]);

  return {
    allTransactions,
    customers,
    purchases,
    isInitialLoading,
    isRefreshing,
    refreshAllData,
  };
}
