import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AppView } from '../../types/appView';

interface AppShellState {
  activeView: AppView;
}

const initialState: AppShellState = {
  activeView: 'play',
};

const appShellSlice = createSlice({
  name: 'appShell',
  initialState,
  reducers: {
    setActiveView: (state, action: PayloadAction<AppView>) => {
      state.activeView = action.payload;
    },
  },
});

export const { setActiveView } = appShellSlice.actions;

export type { AppShellState };

export const selectActiveView = (state: { appShell: AppShellState }) => state.appShell.activeView;

export default appShellSlice.reducer;
