import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { calculateMonthlyStockFromTransactions } from '../../business/stockBusiness';
import {
  CropCategory,
  PurchaseTransactionData,
  Transaction,
} from '../../models';

export type CropRecord = Partial<Record<CropCategory, PurchaseTransactionData>>;

/**
 * StockState maps 'YYYY-MM' period keys (e.g. '2026-08', '2026-09')
 * directly to that month's closing stock CropRecord.
 */
export type StockState = Record<string, CropRecord>;

const initialState: StockState = {};

export const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setClosingStock: (
      state,
      action: PayloadAction<{
        period: string; // 'YYYY-MM'
        crop: CropRecord;
      }>,
    ) => {
      state[action.payload.period] = action.payload.crop;
    },
    setStockState: (state, action: PayloadAction<StockState>) => {
      return {
        ...state,
        ...action.payload,
      };
    },
    updateStockFromTransactions: (
      state,
      action: PayloadAction<Transaction[]>,
    ) => {
      const calculated = calculateMonthlyStockFromTransactions(action.payload);
      return {
        ...state,
        ...calculated,
      };
    },
    resetStock: () => {
      return initialState;
    },
  },
});

export const {
  setClosingStock,
  setStockState,
  updateStockFromTransactions,
  resetStock,
} = stockSlice.actions;

export default stockSlice.reducer;
