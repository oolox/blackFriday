import { Navigate, Route, Routes } from 'react-router-dom';
import { AppShellLayout } from './layouts/AppShellLayout/AppShellLayout';
import { PlayView } from './views/PlayView/PlayView';

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppShellLayout />}>
        <Route path="/" element={<PlayView />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
