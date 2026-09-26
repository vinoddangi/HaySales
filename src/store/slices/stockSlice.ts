import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  BASELINE_2025_CLOSING_STOCK,
  calculateMonthlyStockFromTransactions,
} from '../../business/stockBusiness';
import {
  CropCategory,
  PurchaseTransactionData,
  Transaction,
} from '../../models';

export type CropRecord = Partial<Record<CropCategory, PurchaseTransactionData>>;

/**
 * StockState maps 'YYYY-MM' period keys (e.g. '2025-12', '2026-01', '2026-02')
 * directly to that month's closing stock CropRecord.
 */
export type StockState = Record<string, CropRecord>;

export { BASELINE_2025_CLOSING_STOCK };

const initialState: StockState = {
  '2025-12': BASELINE_2025_CLOSING_STOCK,
};

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
