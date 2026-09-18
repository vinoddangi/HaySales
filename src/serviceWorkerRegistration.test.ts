import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { register, unregister } from './serviceWorkerRegistration';

describe('serviceWorkerRegistration', () => {
  const originalNavigator = window.navigator;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    Object.defineProperty(window, 'navigator', {
      value: originalNavigator,
      writable: true,
      configurable: true,
    });
  });

  it('registers service worker on window load', async () => {
    const mockRegister = vi.fn().mockResolvedValue({
      onupdatefound: null,
      installing: null,
    });

    Object.defineProperty(window, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: {
          register: mockRegister,
          controller: null,
        },
      },
      writable: true,
      configurable: true,
    });

    register();

    // Trigger load event
    window.dispatchEvent(new Event('load'));

    expect(mockRegister).toHaveBeenCalledWith('/sw.js');
  });

  it('unregisters service worker properly', async () => {
    const mockUnregister = vi.fn().mockResolvedValue(true);

    Object.defineProperty(window, 'navigator', {
      value: {
        ...originalNavigator,
        serviceWorker: {
          ready: Promise.resolve({
            unregister: mockUnregister,
          }),
        },
      },
      writable: true,
      configurable: true,
    });

    unregister();

    await Promise.resolve();
    expect(mockUnregister).toHaveBeenCalled();
  });

  it('handles environment without serviceWorker support gracefully', () => {
    Object.defineProperty(window, 'navigator', {
      value: {
        ...originalNavigator,
      },
      writable: true,
      configurable: true,
    });

    // Should not throw
    expect(() => register()).not.toThrow();
    expect(() => unregister()).not.toThrow();
  });
});
