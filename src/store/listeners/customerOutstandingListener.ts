import { isAnyOf } from '@reduxjs/toolkit';
import { calculateMonthlyCustomerOutstandings } from '../../business/customerOutstandingBusiness';
import { AppStartListening } from '../listenerMiddleware';
import { setCustomerOutstandingState } from '../slices/customerOutstandingSlice';
import { customersApi } from '../slices/customersApi';

/**
 * Separate RTK Listener for maintaining continuous monthly customer outstandings
 * whenever customers or customer transactions change.
 */
export function setupCustomerOutstandingListener(
  startListening: AppStartListening,
) {
  startListening({
    matcher: isAnyOf(
      customersApi.endpoints.getCustomers.matchFulfilled,
      customersApi.endpoints.getCustomerTransactions.matchFulfilled,
      customersApi.endpoints.addCustomer.matchFulfilled,
      customersApi.endpoints.updateCustomer.matchFulfilled,
      customersApi.endpoints.deleteCustomer.matchFulfilled,
      customersApi.endpoints.addCustomerTransaction.matchFulfilled,
      customersApi.endpoints.updateCustomerTransaction.matchFulfilled,
      customersApi.endpoints.deleteCustomerTransaction.matchFulfilled,
      customersApi.endpoints.syncDatabase.matchFulfilled,
      customersApi.endpoints.resetDatabase.matchFulfilled,
    ),
    effect: async (_action, listenerApi) => {
      const state = listenerApi.getState();

      const customers =
        customersApi.endpoints.getCustomers.select()(state).data || [];
      const customerTxs =
        customersApi.endpoints.getCustomerTransactions.select(undefined)(state)
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
