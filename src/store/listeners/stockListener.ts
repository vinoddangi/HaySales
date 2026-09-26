import { isAnyOf } from '@reduxjs/toolkit';
import { calculateMonthlyStockFromTransactions } from '../../business/stockBusiness';
import { AppStartListening } from '../listenerMiddleware';
import { customersApi } from '../slices/customersApi';
import { setStockState } from '../slices/stockSlice';

/**
 * RTK Listener for automatically maintaining and calculating continuous monthly stock
 * from all recorded customer and operation transactions whenever transactions change.
 */
export function setupStockListener(startListening: AppStartListening) {
  startListening({
    matcher: isAnyOf(
      customersApi.endpoints.getCustomerTransactions.matchFulfilled,
      customersApi.endpoints.getOperationTransactions.matchFulfilled,
      customersApi.endpoints.addCustomerTransaction.matchFulfilled,
      customersApi.endpoints.updateCustomerTransaction.matchFulfilled,
      customersApi.endpoints.deleteCustomerTransaction.matchFulfilled,
      customersApi.endpoints.addOperationTransaction.matchFulfilled,
      customersApi.endpoints.updateOperationTransaction.matchFulfilled,
      customersApi.endpoints.deleteOperationTransaction.matchFulfilled,
      customersApi.endpoints.syncDatabase.matchFulfilled,
      customersApi.endpoints.resetDatabase.matchFulfilled,
    ),
    effect: async (_action, listenerApi) => {
      const state = listenerApi.getState();

      const customerTxs =
        customersApi.endpoints.getCustomerTransactions.select(undefined)(state)
          .data || [];
      const operationTxs =
        customersApi.endpoints.getOperationTransactions.select()(state).data ||
        [];

      const allTransactions = [...customerTxs, ...operationTxs];
      if (allTransactions.length === 0) return;

      const calculatedMonthlyStock =
        calculateMonthlyStockFromTransactions(allTransactions);

      listenerApi.dispatch(setStockState(calculatedMonthlyStock));
    },
  });
}
