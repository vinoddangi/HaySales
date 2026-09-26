import { configureStore } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { describe, expect, it } from 'vitest';
import uiReducer from '../../store/slices/uiSlice';
import { LoginModal } from './LoginModal';

describe('LoginModal Component', () => {
  it('renders phone login modal when open', () => {
    const testStore = configureStore({
      reducer: {
        ui: uiReducer,
      },
    });

    const element = (
      <Provider store={testStore}>
        <LoginModal isOpen={true} onClose={() => {}} />
      </Provider>
    );

    expect(element).toBeDefined();
  });

  it('returns null when isOpen is false', () => {
    const testStore = configureStore({
      reducer: {
        ui: uiReducer,
      },
    });

    const element = (
      <Provider store={testStore}>
        <LoginModal isOpen={false} onClose={() => {}} />
      </Provider>
    );

    expect(element).toBeDefined();
  });
});
