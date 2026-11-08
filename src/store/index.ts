import { configureStore } from '@reduxjs/toolkit';
import appShellReducer from './slices/appShellSlice';

export const store = configureStore({
  reducer: {
    appShell: appShellReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
