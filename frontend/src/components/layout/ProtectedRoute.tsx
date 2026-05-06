import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store';
import { AppLayout } from '@/components/layout/AppLayout';
import { useEffect } from 'react';

export function ProtectedRoute() {
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    const handler = () => { logout(); };
    window.addEventListener('pw:unauthorized', handler);
    return () => window.removeEventListener('pw:unauthorized', handler);
  }, [logout]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return (
    <AppLayout>
      <Outlet />
    </AppLayout>
  );
}
