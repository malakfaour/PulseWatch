import { clsx, type ClassValue } from 'clsx';
import { formatDistanceToNow, format } from 'date-fns';
import type { EndpointStatus, AlertConditionType } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

export function formatRelativeTime(dateStr: string | null): string {
  if (!dateStr) return 'Never';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return 'Unknown';
  }
}

export function formatDateTime(dateStr: string | null): string {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'MMM d, yyyy HH:mm:ss');
  } catch {
    return '—';
  }
}

export function formatLatency(ms: number | null): string {
  if (ms === null || ms === 0) return '—';
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function formatUptime(percent: number): string {
  return `${percent.toFixed(2)}%`;
}

export function getStatusColor(status: EndpointStatus): string {
  switch (status) {
    case 'UP':       return 'text-up';
    case 'DOWN':     return 'text-down';
    case 'DEGRADED': return 'text-warn';
    case 'PENDING':  return 'text-surface-400';
  }
}

export function getStatusBg(status: EndpointStatus): string {
  switch (status) {
    case 'UP':       return 'bg-up/10 text-up border border-up/20';
    case 'DOWN':     return 'bg-down/10 text-down border border-down/20';
    case 'DEGRADED': return 'bg-warn/10 text-warn border border-warn/20';
    case 'PENDING':  return 'bg-surface-100 text-surface-500 border border-surface-200 dark:bg-surface-800 dark:text-surface-400';
  }
}

export function getConditionLabel(type: AlertConditionType, threshold: number | null): string {
  switch (type) {
    case 'LATENCY_GT':  return `Latency > ${threshold}ms`;
    case 'STATUS_DOWN': return 'Status is DOWN';
    case 'UPTIME_LT':  return `Uptime < ${threshold}%`;
  }
}

export function downloadCsv(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function buildCsvFromChecks(
  checks: Array<{ checkedAt: string; status: string; statusCode: number | null; responseTimeMs: number | null; error: string | null }>,
  endpointName: string
): string {
  const header = 'Endpoint,Timestamp,Status,Status Code,Response Time (ms),Error\n';
  const rows = checks.map(c =>
    [endpointName, c.checkedAt, c.status, c.statusCode ?? '', c.responseTimeMs ?? '', c.error ?? ''].join(',')
  );
  return header + rows.join('\n');
}

export const POLLING_INTERVAL = Number(import.meta.env.VITE_POLLING_INTERVAL_MS ?? 30_000);
