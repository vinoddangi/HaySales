import { AppStartListening } from '../listenerMiddleware';
import { setupStockListener } from './stockListener';

export * from './stockListener';

export function setupListeners(startListening: AppStartListening) {
  setupStockListener(startListening);
}
