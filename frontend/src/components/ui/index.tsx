import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { cn } from '@/utils';
import type { EndpointStatus } from '@/types';
import { CheckCircle, XCircle, AlertTriangle, Clock, X, CheckCircle2, AlertCircle, Info } from 'lucide-react';

// ─── Card ─────────────────────────────────────────────────────────────────────
interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  noPad?: boolean;
}
export function Card({ className, noPad, children, ...props }: CardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-surface-200 bg-white shadow-sm dark:border-surface-700 dark:bg-surface-900',
        !noPad && 'p-6',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('mb-4 flex items-center justify-between', className)} {...props}>{children}</div>;
}

export function CardTitle({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cn('font-display text-base font-600 text-surface-900 dark:text-white', className)} {...props}>{children}</h3>;
}

// ─── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps { status: EndpointStatus; size?: 'sm' | 'md'; }
const statusConfig: Record<EndpointStatus, { label: string; icon: React.ElementType; cls: string }> = {
  UP:       { label: 'UP',      icon: CheckCircle,     cls: 'bg-up/10 text-up border-up/20' },
  DOWN:     { label: 'DOWN',    icon: XCircle,         cls: 'bg-down/10 text-down border-down/20' },
  DEGRADED: { label: 'DEGRADED', icon: AlertTriangle,  cls: 'bg-warn/10 text-warn border-warn/20' },
  PENDING:  { label: 'PENDING',  icon: Clock,          cls: 'bg-surface-100 text-surface-500 border-surface-200 dark:bg-surface-800 dark:border-surface-600 dark:text-surface-400' },
};

export function StatusBadge({ status, size = 'md' }: BadgeProps) {
  const { label, icon: Icon, cls } = statusConfig[status];
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-mono font-500 tracking-wide', size === 'sm' ? 'text-[10px]' : 'text-xs', cls)}>
      <Icon className={size === 'sm' ? 'h-2.5 w-2.5' : 'h-3 w-3'} />
      {label}
    </span>
  );
}

// ─── Pulse dot ────────────────────────────────────────────────────────────────
export function PulseDot({ status }: { status: EndpointStatus }) {
  const colors: Record<EndpointStatus, string> = {
    UP: 'bg-up', DOWN: 'bg-down', DEGRADED: 'bg-warn', PENDING: 'bg-surface-400',
  };
  return (
    <span className="relative flex h-2.5 w-2.5">
      {status === 'UP' && <span className={cn('absolute inline-flex h-full w-full animate-ping rounded-full opacity-50', colors[status])} />}
      <span className={cn('relative inline-flex h-2.5 w-2.5 rounded-full', colors[status])} />
    </span>
  );
}

// ─── Button ───────────────────────────────────────────────────────────────────
type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ElementType;
}
const btnVariants: Record<ButtonVariant, string> = {
  primary:   'bg-pulse-500 text-white hover:bg-pulse-600 active:bg-pulse-700 shadow-sm shadow-pulse-500/30',
  secondary: 'bg-surface-100 text-surface-700 hover:bg-surface-200 border border-surface-200 dark:bg-surface-800 dark:text-surface-300 dark:border-surface-600 dark:hover:bg-surface-700',
  ghost:     'text-surface-600 hover:bg-surface-100 dark:text-surface-400 dark:hover:bg-surface-800',
  danger:    'bg-down/10 text-down hover:bg-down/20 border border-down/20',
};
const btnSizes: Record<string, string> = {
  sm: 'h-8 px-3 text-xs gap-1.5',
  md: 'h-9 px-4 text-sm gap-2',
  lg: 'h-11 px-6 text-base gap-2.5',
};

export function Button({ variant = 'primary', size = 'md', loading, icon: Icon, className, children, disabled, ...props }: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center rounded-lg font-500 transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-pulse-500/40 disabled:cursor-not-allowed disabled:opacity-50',
        btnVariants[variant], btnSizes[size], className
      )}
      {...props}
    >
      {loading ? <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> : Icon && <Icon className="h-4 w-4 flex-shrink-0" />}
      {children}
    </button>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────
export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn(
      'animate-shimmer rounded-lg bg-gradient-to-r from-surface-100 via-surface-50 to-surface-100 bg-[length:200%_100%] dark:from-surface-800 dark:via-surface-700 dark:to-surface-800',
      className
    )} />
  );
}

// ─── Input ─────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ElementType;
}
export const Input = React.forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, icon: Icon, className, id, ...props },
  ref
) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={inputId} className="text-sm font-500 text-surface-700 dark:text-surface-300">{label}</label>}
      <div className="relative">
        {Icon && <Icon className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-surface-400" />}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'h-9 w-full rounded-lg border border-surface-200 bg-white px-3 text-sm text-surface-900 placeholder:text-surface-400 transition-colors focus:border-pulse-400 focus:outline-none focus:ring-2 focus:ring-pulse-400/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white dark:placeholder:text-surface-500 dark:focus:border-pulse-400',
            Icon && 'pl-9',
            error && 'border-down focus:border-down focus:ring-down/20',
            className
          )}
          {...props}
        />
      </div>
      {error && <p className="text-xs text-down">{error}</p>}
    </div>
  );
});

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { label, error, options, className, id, ...props },
  ref
) {
  const selectId = id ?? label?.toLowerCase().replace(/\s+/g, '-');
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label htmlFor={selectId} className="text-sm font-500 text-surface-700 dark:text-surface-300">{label}</label>}
      <select
        ref={ref}
        id={selectId}
        className={cn(
          'h-9 w-full rounded-lg border border-surface-200 bg-white px-3 text-sm text-surface-900 transition-colors focus:border-pulse-400 focus:outline-none focus:ring-2 focus:ring-pulse-400/20 dark:border-surface-600 dark:bg-surface-800 dark:text-white',
          error && 'border-down',
          className
        )}
        {...props}
      >
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
      {error && <p className="text-xs text-down">{error}</p>}
    </div>
  );
});

// ─── Modal ────────────────────────────────────────────────────────────────────
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}
export function Modal({ isOpen, onClose, title, children, size = 'md' }: ModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    if (isOpen) { document.addEventListener('keydown', onKey); document.body.style.overflow = 'hidden'; }
    return () => { document.removeEventListener('keydown', onKey); document.body.style.overflow = ''; };
  }, [isOpen, onClose]);

  if (!isOpen) return null;
  const widths = { sm: 'max-w-sm', md: 'max-w-lg', lg: 'max-w-2xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-surface-950/60 backdrop-blur-sm" onClick={onClose} />
      <div className={cn('relative w-full rounded-2xl border border-surface-200 bg-white shadow-2xl dark:border-surface-700 dark:bg-surface-900 animate-fade-in', widths[size])}>
        <div className="flex items-center justify-between border-b border-surface-100 p-6 dark:border-surface-800">
          <h2 className="font-display text-lg font-600 text-surface-900 dark:text-white">{title}</h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-surface-400 hover:bg-surface-100 hover:text-surface-700 dark:hover:bg-surface-800 dark:hover:text-surface-200">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}

// ─── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'warning' | 'info';
interface Toast { id: string; type: ToastType; message: string; }
interface ToastCtx { addToast: (type: ToastType, message: string) => void; }

const ToastContext = createContext<ToastCtx>({ addToast: () => {} });
export const useToast = () => useContext(ToastContext);

const toastIcons: Record<ToastType, React.ElementType> = {
  success: CheckCircle2, error: AlertCircle, warning: AlertTriangle, info: Info,
};
const toastColors: Record<ToastType, string> = {
  success: 'border-up/20 bg-up/5 text-up',
  error:   'border-down/20 bg-down/5 text-down',
  warning: 'border-warn/20 bg-warn/5 text-warn',
  info:    'border-pulse-200 bg-pulse-50/50 text-pulse-600 dark:border-pulse-500/20 dark:bg-pulse-500/10 dark:text-pulse-400',
};

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((type: ToastType, message: string) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4000);
  }, []);

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="fixed bottom-6 right-6 z-[100] flex flex-col gap-3 w-96 max-w-[calc(100vw-3rem)]">
        {toasts.map(t => {
          const Icon = toastIcons[t.type];
          return (
            <div key={t.id} className={cn('flex items-start gap-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm animate-slide-in dark:bg-surface-900', toastColors[t.type])}>
              <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
              <p className="text-sm font-500 flex-1 text-surface-800 dark:text-surface-100">{t.message}</p>
              <button onClick={() => setToasts(p => p.filter(x => x.id !== t.id))} className="text-surface-400 hover:text-surface-600 dark:hover:text-surface-300">
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

// ─── Table ─────────────────────────────────────────────────────────────────────
export function Table({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full text-sm">{children}</table>
    </div>
  );
}
export function Th({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <th className={cn('border-b border-surface-100 px-4 py-3 text-left text-xs font-600 uppercase tracking-wider text-surface-400 dark:border-surface-800', className)}>{children}</th>;
}
export function Td({ children, className }: { children?: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3.5 text-surface-700 dark:text-surface-300', className)}>{children}</td>;
}

// ─── Empty State ─────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, description, action }: { icon: React.ElementType; title: string; description?: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="mb-4 rounded-2xl bg-surface-100 p-4 dark:bg-surface-800">
        <Icon className="h-8 w-8 text-surface-400" />
      </div>
      <h3 className="mb-1 font-display text-base font-600 text-surface-700 dark:text-surface-300">{title}</h3>
      {description && <p className="mb-4 text-sm text-surface-400">{description}</p>}
      {action}
    </div>
  );
}

// ─── Pagination ────────────────────────────────────────────────────────────────
interface PaginationProps { page: number; totalPages: number; onPageChange: (p: number) => void; }
export function Pagination({ page, totalPages, onPageChange }: PaginationProps) {
  if (totalPages <= 1) return null;
  return (
    <div className="flex items-center justify-between border-t border-surface-100 px-4 py-3 dark:border-surface-800">
      <span className="text-sm text-surface-400">Page {page} of {totalPages}</span>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</Button>
        <Button variant="secondary" size="sm" disabled={page >= totalPages} onClick={() => onPageChange(page + 1)}>Next</Button>
      </div>
    </div>
  );
}
