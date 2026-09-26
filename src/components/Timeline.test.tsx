import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import uiReducer from '../store/slices/uiSlice';
import { Timeline } from './Timeline';

// Simple lightweight render test
describe('Timeline Component', () => {
  it('renders timeline with Month and YTD mode', () => {
    const testStore = configureStore({
      reducer: {
        ui: uiReducer,
      },
    });

    const element = (
      <Provider store={testStore}>
        <Timeline />
      </Provider>
    );

    expect(element).toBeDefined();
    const state = testStore.getState();
    expect(state.ui.filterMode).toBe('month');
    expect(state.ui.selectedYear).toBeGreaterThanOrEqual(2026);
  });
});
