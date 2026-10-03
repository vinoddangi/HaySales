import { isAnyOf } from '@reduxjs/toolkit';
import { calculateMonthlyStockFromTransactions } from '../../business/stockBusiness';
import {
  customerTransactionsApiSlice,
  operationTransactionsApiSlice,
  syncApiSlice,
} from '../api';
import { AppStartListening } from '../listenerMiddleware';
import { setStockState } from '../slices/stockSlice';

/**
 * RTK Listener for automatically maintaining and calculating continuous monthly stock
 * from all recorded customer and operation transactions whenever transactions change.
 */
export function setupStockListener(startListening: AppStartListening) {
  startListening({
    matcher: isAnyOf(
      customerTransactionsApiSlice.endpoints.getCustomerTransactions.matchFulfilled,
      operationTransactionsApiSlice.endpoints.getOperationTransactions.matchFulfilled,
      customerTransactionsApiSlice.endpoints.addCustomerTransaction.matchFulfilled,
      customerTransactionsApiSlice.endpoints.updateCustomerTransaction.matchFulfilled,
      customerTransactionsApiSlice.endpoints.deleteCustomerTransaction.matchFulfilled,
      operationTransactionsApiSlice.endpoints.addOperationTransaction.matchFulfilled,
      operationTransactionsApiSlice.endpoints.updateOperationTransaction.matchFulfilled,
      operationTransactionsApiSlice.endpoints.deleteOperationTransaction.matchFulfilled,
      syncApiSlice.endpoints.syncDatabase.matchFulfilled,
      syncApiSlice.endpoints.resetDatabase.matchFulfilled,
    ),
    effect: async (_action, listenerApi) => {
      const state = listenerApi.getState();

      const customerTxs =
        customerTransactionsApiSlice.endpoints.getCustomerTransactions.select(undefined)(state)
          .data || [];
      const operationTxs =
        operationTransactionsApiSlice.endpoints.getOperationTransactions.select()(state).data ||
        [];

      const allTransactions = [...customerTxs, ...operationTxs];
      if (allTransactions.length === 0) return;

      const calculatedMonthlyStock =
        calculateMonthlyStockFromTransactions(allTransactions);

      listenerApi.dispatch(setStockState(calculatedMonthlyStock));
    },
  });
}
