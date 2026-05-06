import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ToastProvider } from '@/components/ui';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import LoginPage from '@/pages/LoginPage';
import RegisterPage from '@/pages/RegisterPage';
import DashboardPage from '@/pages/DashboardPage';
import EndpointsPage from '@/pages/EndpointsPage';
import EndpointDetailPage from '@/pages/EndpointDetailPage';
import MetricsPage from '@/pages/MetricsPage';
import AlertsPage from '@/pages/AlertsPage';
import ReportsPage from '@/pages/ReportsPage';
import HealthPage from '@/pages/HealthPage';
import { useThemeStore } from '@/store';
import { useEffect } from 'react';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 10_000,
      retry: 1,
      refetchOnWindowFocus: true,
    },
  },
});

function ThemeInitializer() {
  const { isDark } = useThemeStore();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);
  return null;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <ThemeInitializer />
        <BrowserRouter>
          <Routes>
            <Route path="/login"    element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/"               element={<DashboardPage />} />
              <Route path="/endpoints"      element={<EndpointsPage />} />
              <Route path="/endpoints/:id"  element={<EndpointDetailPage />} />
              <Route path="/metrics"        element={<MetricsPage />} />
              <Route path="/alerts"         element={<AlertsPage />} />
              <Route path="/reports"        element={<ReportsPage />} />
              <Route path="/health"         element={<HealthPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </QueryClientProvider>
  );
}
