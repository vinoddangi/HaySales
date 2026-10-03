import { isAnyOf } from '@reduxjs/toolkit';
import { calculateMonthlyCustomerOutstandings } from '../../business/customerOutstandingBusiness';
import {
  customersApiSlice,
  customerTransactionsApiSlice,
  syncApiSlice,
} from '../api';
import { AppStartListening } from '../listenerMiddleware';
import { setCustomerOutstandingState } from '../slices/customerOutstandingSlice';

/**
 * Separate RTK Listener for maintaining continuous monthly customer outstandings
 * whenever customers or customer transactions change.
 */
export function setupCustomerOutstandingListener(
  startListening: AppStartListening,
) {
  startListening({
    matcher: isAnyOf(
      customersApiSlice.endpoints.getCustomers.matchFulfilled,
      customerTransactionsApiSlice.endpoints.getCustomerTransactions.matchFulfilled,
      customersApiSlice.endpoints.addCustomer.matchFulfilled,
      customersApiSlice.endpoints.updateCustomer.matchFulfilled,
      customersApiSlice.endpoints.deleteCustomer.matchFulfilled,
      customerTransactionsApiSlice.endpoints.addCustomerTransaction.matchFulfilled,
      customerTransactionsApiSlice.endpoints.updateCustomerTransaction.matchFulfilled,
      customerTransactionsApiSlice.endpoints.deleteCustomerTransaction.matchFulfilled,
      syncApiSlice.endpoints.syncDatabase.matchFulfilled,
      syncApiSlice.endpoints.resetDatabase.matchFulfilled,
    ),
    effect: async (_action, listenerApi) => {
      const state = listenerApi.getState();

      const customers =
        customersApiSlice.endpoints.getCustomers.select()(state).data || [];
      const customerTxs =
        customerTransactionsApiSlice.endpoints.getCustomerTransactions.select(undefined)(state)
          .data || [];

      if (customers.length === 0 && customerTxs.length === 0) return;

      const calculatedMonthlyOutstandings =
        calculateMonthlyCustomerOutstandings(customers, customerTxs);

      listenerApi.dispatch(
        setCustomerOutstandingState(calculatedMonthlyOutstandings),
      );
    },
  });
}
