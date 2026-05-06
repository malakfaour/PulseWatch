import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Globe, Bell, FileBarChart2, LogOut, Moon, Sun, ChevronRight, Activity, HeartPulse, ShieldCheck } from 'lucide-react';
import { cn } from '@/utils';
import { useAuthStore, useThemeStore } from '@/store';

const NAV_ITEMS = [
  { to: '/',          icon: LayoutDashboard, label: 'Dashboard',  end: true },
  { to: '/endpoints', icon: Globe,           label: 'Endpoints' },
  { to: '/metrics',   icon: HeartPulse,      label: 'Metrics' },
  { to: '/alerts',    icon: Bell,            label: 'Alerts' },
  { to: '/reports',   icon: FileBarChart2,   label: 'Reports' },
  { to: '/health',    icon: ShieldCheck,     label: 'System Health' },
];

export function Sidebar() {
  const { user, logout } = useAuthStore();
  const { isDark, toggleTheme } = useThemeStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <aside className="fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-950">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 border-b border-surface-100 px-6 dark:border-surface-800">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pulse-500 shadow-lg shadow-pulse-500/30">
          <Activity className="h-4.5 w-4.5 text-white" />
        </div>
        <span className="font-display text-lg font-700 text-surface-900 dark:text-white">PulseWatch</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {NAV_ITEMS.map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => cn(
              'group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-500 transition-all duration-150',
              isActive
                ? 'bg-pulse-50 text-pulse-600 dark:bg-pulse-500/10 dark:text-pulse-400'
                : 'text-surface-500 hover:bg-surface-50 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200'
            )}
          >
            {({ isActive }) => (
              <>
                <Icon className={cn('h-4.5 w-4.5 flex-shrink-0', isActive ? 'text-pulse-500' : 'text-surface-400 group-hover:text-surface-600 dark:group-hover:text-surface-300')} />
                {label}
                {isActive && <ChevronRight className="ml-auto h-3.5 w-3.5 text-pulse-400" />}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-surface-100 p-4 dark:border-surface-800 space-y-2">
        <button
          onClick={toggleTheme}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-500 text-surface-500 hover:bg-surface-50 hover:text-surface-700 dark:text-surface-400 dark:hover:bg-surface-800 dark:hover:text-surface-200 transition-all"
        >
          {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {isDark ? 'Light mode' : 'Dark mode'}
        </button>

        <div className="flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-pulse-100 dark:bg-pulse-900/30">
            <span className="text-xs font-700 text-pulse-600 dark:text-pulse-400">
              {user?.name?.charAt(0).toUpperCase() ?? 'U'}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-xs font-600 text-surface-700 dark:text-surface-200">{user?.name ?? 'User'}</p>
            <p className="truncate text-xs text-surface-400">{user?.email ?? ''}</p>
          </div>
          <button onClick={handleLogout} title="Sign out" className="rounded p-1 text-surface-400 hover:text-down transition-colors">
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
}

interface TopBarProps { title: string; subtitle?: string; actions?: React.ReactNode; }
export function TopBar({ title, subtitle, actions }: TopBarProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-surface-100 bg-white/80 backdrop-blur-md px-8 dark:border-surface-800 dark:bg-surface-950/80">
      <div>
        <h1 className="font-display text-xl font-700 text-surface-900 dark:text-white">{title}</h1>
        {subtitle && <p className="text-xs text-surface-400">{subtitle}</p>}
      </div>
      {actions && <div className="flex items-center gap-3">{actions}</div>}
    </header>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-surface-50 dark:bg-surface-950">
      <Sidebar />
      <main className="ml-64 flex-1 flex flex-col min-h-screen">
        {children}
      </main>
    </div>
  );
}
