import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  calculateMonthlyCustomerOutstandings,
  createBaselineCustomerOutstanding,
  CustomerBalanceRecord,
  CustomerOutstandingState,
  MonthlyCustomerOutstandingState,
} from '../../business/customerOutstandingBusiness';
import { Customer, CustomerTransactionData } from '../../models';

export type {
  CustomerBalanceRecord,
  CustomerOutstandingState,
  MonthlyCustomerOutstandingState,
};

const initialState: CustomerOutstandingState = {
  '2025-12': createBaselineCustomerOutstanding([]),
};

export const customerOutstandingSlice = createSlice({
  name: 'customerOutstanding',
  initialState,
  reducers: {
    setCustomerOutstandingState: (
      state,
      action: PayloadAction<CustomerOutstandingState>,
    ) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    setMonthlyCustomerOutstanding: (
      state,
      action: PayloadAction<{
        period: string; // 'YYYY-MM'
        data: MonthlyCustomerOutstandingState;
      }>,
    ) => {
      state[action.payload.period] = action.payload.data;
    },
    updateCustomerOutstandingFromData: (
      state,
      action: PayloadAction<{
        customers: Customer[];
        transactions: CustomerTransactionData[];
      }>,
    ) => {
      const calculated = calculateMonthlyCustomerOutstandings(
        action.payload.customers,
        action.payload.transactions,
      );
      return {
        ...state,
        ...calculated,
      };
    },
    resetCustomerOutstanding: () => {
      return initialState;
    },
  },
});

export const {
  setCustomerOutstandingState,
  setMonthlyCustomerOutstanding,
  updateCustomerOutstandingFromData,
  resetCustomerOutstanding,
} = customerOutstandingSlice.actions;

export default customerOutstandingSlice.reducer;
