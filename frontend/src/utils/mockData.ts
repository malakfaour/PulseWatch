import { subHours, subDays, subMinutes, format } from 'date-fns';
import type {
  Endpoint, Check, AlertRule, AlertEvent,
  DashboardStats, LatencyDataPoint, UptimeDataPoint,
} from '@/types';

const now = new Date();

export const MOCK_ENDPOINTS: Endpoint[] = [
  {
    id: 'ep_1', name: 'Payment API', url: 'https://api.acme.io/payments/health',
    method: 'GET', status: 'UP', uptimePercent: 99.97, avgLatencyMs: 142,
    lastCheckedAt: subMinutes(now, 1).toISOString(), intervalSeconds: 60,
    timeoutMs: 5000, expectedStatusCode: 200, tags: ['critical', 'payments'],
    createdAt: subDays(now, 30).toISOString(), updatedAt: subMinutes(now, 1).toISOString(),
  },
  {
    id: 'ep_2', name: 'Auth Service', url: 'https://auth.acme.io/health',
    method: 'GET', status: 'UP', uptimePercent: 99.99, avgLatencyMs: 67,
    lastCheckedAt: subMinutes(now, 2).toISOString(), intervalSeconds: 30,
    timeoutMs: 3000, expectedStatusCode: 200, tags: ['critical', 'auth'],
    createdAt: subDays(now, 45).toISOString(), updatedAt: subMinutes(now, 2).toISOString(),
  },
  {
    id: 'ep_3', name: 'User Profile API', url: 'https://api.acme.io/users/profile',
    method: 'GET', status: 'DOWN', uptimePercent: 94.20, avgLatencyMs: 0,
    lastCheckedAt: subMinutes(now, 3).toISOString(), intervalSeconds: 60,
    timeoutMs: 5000, expectedStatusCode: 200, tags: ['users'],
    createdAt: subDays(now, 20).toISOString(), updatedAt: subMinutes(now, 3).toISOString(),
  },
  {
    id: 'ep_4', name: 'Notification Service', url: 'https://notify.acme.io/ping',
    method: 'GET', status: 'DEGRADED', uptimePercent: 97.80, avgLatencyMs: 890,
    lastCheckedAt: subMinutes(now, 1).toISOString(), intervalSeconds: 120,
    timeoutMs: 10000, expectedStatusCode: 200, tags: ['notifications'],
    createdAt: subDays(now, 15).toISOString(), updatedAt: subMinutes(now, 1).toISOString(),
  },
  {
    id: 'ep_5', name: 'CDN Status', url: 'https://cdn.acme.io/health',
    method: 'HEAD', status: 'UP', uptimePercent: 99.95, avgLatencyMs: 31,
    lastCheckedAt: subMinutes(now, 4).toISOString(), intervalSeconds: 300,
    timeoutMs: 3000, expectedStatusCode: 200, tags: ['infrastructure'],
    createdAt: subDays(now, 60).toISOString(), updatedAt: subMinutes(now, 4).toISOString(),
  },
  {
    id: 'ep_6', name: 'Analytics Ingest', url: 'https://analytics.acme.io/ingest',
    method: 'POST', status: 'UP', uptimePercent: 98.50, avgLatencyMs: 221,
    lastCheckedAt: subMinutes(now, 2).toISOString(), intervalSeconds: 60,
    timeoutMs: 8000, expectedStatusCode: 202, tags: ['analytics'],
    createdAt: subDays(now, 10).toISOString(), updatedAt: subMinutes(now, 2).toISOString(),
  },
];

export const MOCK_DASHBOARD_STATS: DashboardStats = {
  totalEndpoints: 6,
  upCount: 4,
  downCount: 1,
  degradedCount: 1,
  activeAlerts: 3,
  avgUptimePercent: 98.40,
  avgLatencyMs: 225,
};

export const MOCK_ALERT_RULES: AlertRule[] = [
  { id: 'ar_1', endpointId: 'ep_1', endpointName: 'Payment API', conditionType: 'LATENCY_GT', threshold: 500, isEnabled: true, createdAt: subDays(now, 5).toISOString() },
  { id: 'ar_2', endpointId: 'ep_3', endpointName: 'User Profile API', conditionType: 'STATUS_DOWN', threshold: null, isEnabled: true, createdAt: subDays(now, 3).toISOString() },
  { id: 'ar_3', endpointId: 'ep_4', endpointName: 'Notification Service', conditionType: 'LATENCY_GT', threshold: 1000, isEnabled: true, createdAt: subDays(now, 2).toISOString() },
  { id: 'ar_4', endpointId: 'ep_2', endpointName: 'Auth Service', conditionType: 'UPTIME_LT', threshold: 99, isEnabled: false, createdAt: subDays(now, 10).toISOString() },
];

export const MOCK_ALERT_EVENTS: AlertEvent[] = [
  { id: 'ae_1', ruleId: 'ar_2', endpointId: 'ep_3', endpointName: 'User Profile API', conditionType: 'STATUS_DOWN', threshold: null, status: 'ACTIVE', message: 'Endpoint returned 503 Service Unavailable', triggeredAt: subMinutes(now, 18).toISOString(), resolvedAt: null },
  { id: 'ae_2', ruleId: 'ar_3', endpointId: 'ep_4', endpointName: 'Notification Service', conditionType: 'LATENCY_GT', threshold: 1000, status: 'ACTIVE', message: 'Response time 890ms exceeded threshold of 1000ms', triggeredAt: subMinutes(now, 45).toISOString(), resolvedAt: null },
  { id: 'ae_3', ruleId: 'ar_1', endpointId: 'ep_1', endpointName: 'Payment API', conditionType: 'LATENCY_GT', threshold: 500, status: 'RESOLVED', message: 'Response time 612ms exceeded threshold of 500ms', triggeredAt: subHours(now, 3).toISOString(), resolvedAt: subHours(now, 2).toISOString() },
  { id: 'ae_4', ruleId: 'ar_2', endpointId: 'ep_3', endpointName: 'User Profile API', conditionType: 'STATUS_DOWN', threshold: null, status: 'RESOLVED', message: 'Endpoint returned 502 Bad Gateway', triggeredAt: subDays(now, 2).toISOString(), resolvedAt: subDays(now, 2).toISOString() },
];

export function generateLatencyData(hours = 24, baseLatency = 150, epId = 'ep_1'): LatencyDataPoint[] {
  const variance: Record<string, number> = { ep_1: 150, ep_2: 70, ep_3: 0, ep_4: 890, ep_5: 30, ep_6: 220 };
  const base = variance[epId] ?? baseLatency;
  return Array.from({ length: hours * 4 }, (_, i) => {
    const ts = subHours(now, hours - i / 4);
    const isDown = epId === 'ep_3' && i > hours * 3;
    return {
      timestamp: format(ts, "yyyy-MM-dd'T'HH:mm:ss"),
      latencyMs: isDown ? null : Math.max(10, base + Math.round((Math.random() - 0.5) * base * 0.6)),
    };
  });
}

export function generateUptimeData(days = 30, epId = 'ep_1'): UptimeDataPoint[] {
  const baseUptime: Record<string, number> = { ep_1: 99.97, ep_2: 99.99, ep_3: 94.2, ep_4: 97.8, ep_5: 99.95, ep_6: 98.5 };
  const base = baseUptime[epId] ?? 99;
  return Array.from({ length: days }, (_, i) => ({
    timestamp: format(subDays(now, days - i), 'yyyy-MM-dd'),
    uptimePercent: Math.min(100, Math.max(0, base + (Math.random() - 0.5) * 2)),
  }));
}

export function generateChecks(endpointId: string, count = 50): Check[] {
  const ep = MOCK_ENDPOINTS.find(e => e.id === endpointId);
  return Array.from({ length: count }, (_, i) => {
    const isDown = endpointId === 'ep_3' && i < 5;
    const status: Check['status'] = isDown ? 'DOWN' : 'UP';
    return {
      id: `chk_${endpointId}_${i}`,
      endpointId,
      status,
      statusCode: isDown ? 503 : (ep?.expectedStatusCode ?? 200),
      responseTimeMs: isDown ? null : Math.max(10, (ep?.avgLatencyMs ?? 150) + Math.round((Math.random() - 0.5) * 80)),
      error: isDown ? 'Connection refused' : null,
      checkedAt: subMinutes(now, i * (ep?.intervalSeconds ?? 60) / 60).toISOString(),
    };
  });
}
