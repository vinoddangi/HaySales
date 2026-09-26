import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { CropCategory, CropTransactionData } from '../../models';

export type CropRecord = Partial<Record<CropCategory, CropTransactionData>>;

export type StockState = Record<string, CropRecord>;

export const INITIAL_STOCK: CropRecord = {
  Others: {
    id: 'opening-others-2026-01-01',
    date: '2026-01-01',
    type: 'PURCHASE',
    category: 'Others',
    weight: 13528,
    amount: 141097.04,
    cashPaid: 141097.04,
    remainingDue: 0,
    note: 'Opening Stock',
    vendorName: 'Opening Inventory',
  },
};

const initialState: StockState = {
  '2026-01-01': INITIAL_STOCK,
};

export const stockSlice = createSlice({
  name: 'stock',
  initialState,
  reducers: {
    setOpeningStock: (
      state,
      action: PayloadAction<{
        date: string;
        crop: CropRecord;
      }>,
    ) => {
      state[action.payload.date] = action.payload.crop;
    },
  },
});

export const { setOpeningStock } = stockSlice.actions;

export default stockSlice.reducer;
