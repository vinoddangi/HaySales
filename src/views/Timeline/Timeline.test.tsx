import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import timelineReducer from '../../store/slices/timelineSlice';
import { Timeline } from './Timeline';

describe('Timeline Component', () => {
  it('renders correctly with default store values', () => {
    const store = configureStore({
      reducer: {
        timeline: timelineReducer,
      },
    });

    render(
      <Provider store={store}>
        <Timeline />
      </Provider>,
    );

    expect(screen.getByText(/YTD 2026/i)).toBeDefined();
  });
});
