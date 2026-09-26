import { AppStartListening } from '../listenerMiddleware';
import { setupCustomerOutstandingListener } from './customerOutstandingListener';
import { setupStockListener } from './stockListener';

export * from './customerOutstandingListener';
export * from './stockListener';

export function setupListeners(startListening: AppStartListening) {
  setupStockListener(startListening);
  setupCustomerOutstandingListener(startListening);
}
