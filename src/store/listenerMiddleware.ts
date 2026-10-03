import {
  addListener,
  createListenerMiddleware,
  TypedAddListener,
  TypedStartListening,
} from '@reduxjs/toolkit';
import type { AppDispatch, RootState } from './index';

export const listenerMiddleware = createListenerMiddleware();

export type AppStartListening = TypedStartListening<RootState, AppDispatch>;
export type AppAddListener = TypedAddListener<RootState, AppDispatch>;

export const startAppListening =
  listenerMiddleware.startListening as AppStartListening;
export const addAppListener = addListener as AppAddListener;
