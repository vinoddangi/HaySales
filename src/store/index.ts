import { configureStore } from '@reduxjs/toolkit';
import { customersApi } from './slices/customersApi';
import stockReducer from './slices/stockSlice';
import themeReducer from './slices/themeSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    [customersApi.reducerPath]: customersApi.reducer,
    stock: stockReducer,
    theme: themeReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }).concat(customersApi.middleware),
});

// ── Root Store Types ──────────────────────────────────────────────────────────

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

// ── Slice State Types Re-exports ─────────────────────────────────────────────

export * from './slices/stockSlice';
export type { StockState } from './slices/stockSlice';

export * from './slices/themeSlice';
export type {
  ColorScheme,
  FontSize,
  ThemeMode,
  ThemeState,
} from './slices/themeSlice';

export * from './slices/uiSlice';
export type {
  BottomSheetState,
  FilterPeriodMode,
  SnackbarState,
  UiState,
} from './slices/uiSlice';

export * from './hooks';
export * from './selectors/inputselectors';
export * from './slices/customersApi';
