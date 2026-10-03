import { configureStore } from '@reduxjs/toolkit';
import { baseApi } from './api';
import { listenerMiddleware, startAppListening } from './listenerMiddleware';
import { setupListeners } from './listeners';
import stockReducer from './slices/stockSlice';
import themeReducer from './slices/themeSlice';
import timelineReducer from './slices/timelineSlice';
import uiReducer from './slices/uiSlice';

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    stock: stockReducer,
    theme: themeReducer,
    timeline: timelineReducer,
    ui: uiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    })
      .concat(baseApi.middleware)
      .prepend(listenerMiddleware.middleware),
});

// Initialize RTK listeners (stock calculation listener)
setupListeners(startAppListening);

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

export * from './slices/timelineSlice';
export type {
  FilterPeriodMode,
  TimelineState,
} from './slices/timelineSlice';

export * from './slices/uiSlice';
export type {
  BottomSheetState,
  SnackbarState,
  UiState,
} from './slices/uiSlice';

export * from './api';
export * from './hooks';
export * from './listenerMiddleware';
export * from './listeners';
export * from './selectors';
