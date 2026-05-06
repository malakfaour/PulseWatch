import { apiClient } from './client';
import type {
  User, AuthTokens, LoginPayload, RegisterPayload,
  Endpoint, EndpointFormPayload, Check, AlertRule, AlertEvent,
  AlertRuleFormPayload, DashboardStats, LatencyDataPoint, UptimeDataPoint, MetricRecord, HealthStatus,
  PaginatedResponse, ReportParams,
} from '@/types';
import {
  MOCK_ENDPOINTS, MOCK_DASHBOARD_STATS, MOCK_ALERT_RULES,
  MOCK_ALERT_EVENTS, generateLatencyData, generateUptimeData, generateChecks,
} from '@/utils/mockData';

const USE_MOCKS = false;

type BackendUser = {
  id: string;
  email: string;
};

type BackendDashboardSummary = {
  totalEndpoints: number;
  healthyEndpoints: number;
  unhealthyEndpoints: number;
  activeAlerts: number;
  avgResponseTime: number | null;
};

type BackendEndpoint = {
  id: string;
  name: string;
  url: string;
  method: 'GET' | 'POST';
  checkInterval: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

type BackendMetric = {
  id: string;
  endpointId: string;
  responseTimeMs: number | null;
  statusCode: number | null;
  isSuccess: boolean | null;
  errorMessage: string | null;
  checkedAt: string;
};

type BackendAlert = {
  id: string;
  endpointId: string;
  type: 'RESPONSE_TIME' | 'STATUS_CODE' | 'DOWNTIME';
  comparison: '>' | '<' | '==';
  threshold: number;
  message: string | null;
  isActive: boolean;
  triggeredAt: string;
  resolvedAt: string | null;
  createdAt: string;
};

function delay(ms = 400): Promise<void> {
  return new Promise(res => setTimeout(res, ms));
}

function displayNameFromEmail(email: string): string {
  const localPart = email.split('@')[0] ?? 'user';
  return localPart
    .split(/[._-]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function toBackendEndpointPayload(payload: EndpointFormPayload) {
  return {
    name: payload.name,
    url: payload.url,
    method: payload.method,
    checkInterval: payload.intervalSeconds,
    isActive: true,
  };
}

function deriveStatus(metrics: BackendMetric[]): Endpoint['status'] {
  const latest = metrics[0];
  if (!latest) return 'PENDING';
  if (latest.isSuccess === true) return 'UP';
  return 'DOWN';
}

function averageLatency(metrics: BackendMetric[]): number {
  const values = metrics
    .map(metric => metric.responseTimeMs)
    .filter((value): value is number => value !== null);
  if (values.length === 0) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function uptimePercent(metrics: BackendMetric[]): number {
  const settled = metrics.filter(metric => metric.isSuccess !== null);
  if (settled.length === 0) return 0;
  const successes = settled.filter(metric => metric.isSuccess === true).length;
  return (successes / settled.length) * 100;
}

function fromBackendEndpoint(endpoint: BackendEndpoint, metrics: BackendMetric[] = []): Endpoint {
  const sortedMetrics = [...metrics].sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
  return {
    id: endpoint.id,
    name: endpoint.name,
    url: endpoint.url,
    method: endpoint.method,
    status: endpoint.isActive ? deriveStatus(sortedMetrics) : 'DOWN',
    uptimePercent: uptimePercent(sortedMetrics),
    avgLatencyMs: averageLatency(sortedMetrics),
    lastCheckedAt: sortedMetrics[0]?.checkedAt ?? null,
    intervalSeconds: endpoint.checkInterval,
    timeoutMs: 5000,
    expectedStatusCode: 200,
    tags: [],
    createdAt: endpoint.createdAt,
    updatedAt: endpoint.updatedAt,
  };
}

function toCheck(metric: BackendMetric): Check {
  return {
    id: metric.id,
    endpointId: metric.endpointId,
    status: metric.isSuccess === null ? 'PENDING' : metric.isSuccess ? 'UP' : 'DOWN',
    statusCode: metric.statusCode,
    responseTimeMs: metric.responseTimeMs,
    error: metric.errorMessage,
    checkedAt: metric.checkedAt,
  };
}

function toMetricRecord(metric: BackendMetric, endpoint?: Endpoint): MetricRecord {
  return {
    ...toCheck(metric),
    endpointName: endpoint?.name,
    endpointUrl: endpoint?.url,
  };
}

function metricsToLatencyTrend(metrics: BackendMetric[]): LatencyDataPoint[] {
  return [...metrics]
    .sort((a, b) => new Date(a.checkedAt).getTime() - new Date(b.checkedAt).getTime())
    .map(metric => ({
      timestamp: metric.checkedAt,
      latencyMs: metric.responseTimeMs,
    }));
}

function metricsToUptimeTrend(metrics: BackendMetric[]): UptimeDataPoint[] {
  const grouped = new Map<string, BackendMetric[]>();
  for (const metric of metrics) {
    const dayKey = metric.checkedAt.slice(0, 10);
    const group = grouped.get(dayKey) ?? [];
    group.push(metric);
    grouped.set(dayKey, group);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([day, dayMetrics]) => ({
      timestamp: `${day}T00:00:00Z`,
      uptimePercent: uptimePercent(dayMetrics),
    }));
}

function aggregateLatencyByHour(metrics: BackendMetric[]): LatencyDataPoint[] {
  const grouped = new Map<string, number[]>();
  for (const metric of metrics) {
    if (metric.responseTimeMs === null) continue;
    const date = new Date(metric.checkedAt);
    date.setMinutes(0, 0, 0);
    const key = date.toISOString();
    const values = grouped.get(key) ?? [];
    values.push(metric.responseTimeMs);
    grouped.set(key, values);
  }

  return [...grouped.entries()]
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([timestamp, values]) => ({
      timestamp,
      latencyMs: Math.round(values.reduce((sum, value) => sum + value, 0) / values.length),
    }));
}

function mapAlertCondition(type: AlertRuleFormPayload['conditionType'], threshold?: number) {
  if (type === 'LATENCY_GT') {
    return {
      type: 'RESPONSE_TIME' as const,
      comparison: '>' as const,
      threshold: threshold ?? 0,
      message: `Latency exceeded ${threshold ?? 0}ms`,
    };
  }

  return {
    type: 'DOWNTIME' as const,
    comparison: '==' as const,
    threshold: 1,
    message: 'Endpoint is down',
  };
}

function backendAlertToRule(alert: BackendAlert, endpointName: string): AlertRule {
  const conditionType = alert.type === 'RESPONSE_TIME' ? 'LATENCY_GT' : 'STATUS_DOWN';
  return {
    id: alert.id,
    endpointId: alert.endpointId,
    endpointName,
    conditionType,
    threshold: conditionType === 'STATUS_DOWN' ? null : alert.threshold,
    isEnabled: alert.isActive,
    createdAt: alert.createdAt,
  };
}

function backendAlertToEvent(alert: BackendAlert, endpointName: string): AlertEvent {
  const conditionType = alert.type === 'RESPONSE_TIME' ? 'LATENCY_GT' : 'STATUS_DOWN';
  return {
    id: alert.id,
    ruleId: alert.id,
    endpointId: alert.endpointId,
    endpointName,
    conditionType,
    threshold: conditionType === 'STATUS_DOWN' ? null : alert.threshold,
    status: alert.resolvedAt === null ? 'ACTIVE' : 'RESOLVED',
    message: alert.message ?? (conditionType === 'LATENCY_GT' ? `Latency exceeded ${alert.threshold}ms` : 'Endpoint is down'),
    triggeredAt: alert.triggeredAt,
    resolvedAt: alert.resolvedAt,
  };
}

async function fetchAllMetrics(params?: { endpointId?: string; limit?: number }) {
  const { data } = await apiClient.get<BackendMetric[]>(
    params?.endpointId ? `/metrics/${params.endpointId}` : '/metrics',
    { params: { limit: params?.limit ?? 500 } }
  );
  return data;
}

async function fetchAllMetricsSafe(params?: { endpointId?: string; limit?: number }) {
  try {
    return await fetchAllMetrics(params);
  } catch {
    return [] as BackendMetric[];
  }
}

async function fetchEndpointMetricsMap(endpointIds?: string[]) {
  const metrics = await fetchAllMetricsSafe();
  const grouped = new Map<string, BackendMetric[]>();

  for (const metric of metrics) {
    if (endpointIds && !endpointIds.includes(metric.endpointId)) continue;
    const group = grouped.get(metric.endpointId) ?? [];
    group.push(metric);
    grouped.set(metric.endpointId, group);
  }

  for (const group of grouped.values()) {
    group.sort((a, b) => new Date(b.checkedAt).getTime() - new Date(a.checkedAt).getTime());
  }

  return grouped;
}

async function fetchEnrichedEndpoints() {
  const { data } = await apiClient.get<PaginatedResponse<BackendEndpoint>>('/endpoints', {
    params: { page: 1, pageSize: 100 },
  });
  const metricsMap = await fetchEndpointMetricsMap(data.items.map(endpoint => endpoint.id));
  return data.items.map(endpoint => fromBackendEndpoint(endpoint, metricsMap.get(endpoint.id) ?? []));
}

let mockEndpoints = [...MOCK_ENDPOINTS];
let mockRules = [...MOCK_ALERT_RULES];

export const authApi = {
  async login(payload: LoginPayload): Promise<AuthTokens> {
    if (USE_MOCKS) {
      await delay(600);
      if (payload.email && payload.password) {
        return { accessToken: 'mock_jwt_token_xyz', tokenType: 'bearer' };
      }
      throw new Error('Invalid credentials');
    }
    const { data } = await apiClient.post<AuthTokens>('/auth/login', payload);
    return data;
  },

  async register(payload: RegisterPayload): Promise<User> {
    if (USE_MOCKS) {
      await delay(800);
      return { id: 'usr_1', email: payload.email, name: payload.name, createdAt: new Date().toISOString() };
    }
    const { data } = await apiClient.post<BackendUser>('/auth/register', payload);
    return {
      id: data.id,
      email: data.email,
      name: payload.name,
      createdAt: new Date().toISOString(),
    };
  },

  async me(): Promise<User> {
    if (USE_MOCKS) {
      await delay(200);
      return { id: 'usr_1', email: 'alex@acme.io', name: 'Alex Chen', createdAt: '2024-01-01T00:00:00Z' };
    }
    const { data } = await apiClient.get<BackendUser>('/auth/me');
    return {
      id: data.id,
      email: data.email,
      name: displayNameFromEmail(data.email),
      createdAt: new Date().toISOString(),
    };
  },
};

export const dashboardApi = {
  async getStats(): Promise<DashboardStats> {
    if (USE_MOCKS) {
      await delay(300);
      return MOCK_DASHBOARD_STATS;
    }
    const [{ data }, endpoints] = await Promise.all([
      apiClient.get<BackendDashboardSummary>('/dashboard'),
      fetchEnrichedEndpoints(),
    ]);
    const upCount = endpoints.filter(endpoint => endpoint.status === 'UP').length;
    const downCount = endpoints.filter(endpoint => endpoint.status === 'DOWN').length;
    const degradedCount = endpoints.filter(endpoint => endpoint.status === 'DEGRADED').length;
    const avgUptimePercent =
      endpoints.length === 0
        ? 0
        : endpoints.reduce((sum, endpoint) => sum + endpoint.uptimePercent, 0) / endpoints.length;

    return {
      totalEndpoints: data.totalEndpoints,
      upCount,
      downCount,
      degradedCount,
      activeAlerts: data.activeAlerts,
      avgUptimePercent,
      avgLatencyMs: data.avgResponseTime ?? 0,
    };
  },

  async getLatencyTrend(): Promise<LatencyDataPoint[]> {
    if (USE_MOCKS) {
      await delay(400);
      return generateLatencyData(24, 200, 'ep_1');
    }
    const metrics = await fetchAllMetrics();
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return aggregateLatencyByHour(metrics.filter(metric => new Date(metric.checkedAt).getTime() >= since));
  },
};

export const endpointsApi = {
  async list(params?: { status?: string; search?: string; page?: number; pageSize?: number }): Promise<PaginatedResponse<Endpoint>> {
    if (USE_MOCKS) {
      await delay(350);
      let items = mockEndpoints;
      if (params?.status) items = items.filter(endpoint => endpoint.status === params.status);
      if (params?.search) items = items.filter(endpoint => endpoint.url.includes(params.search!) || endpoint.name.toLowerCase().includes(params.search!.toLowerCase()));
      const page = params?.page ?? 1;
      const pageSize = params?.pageSize ?? 10;
      const start = (page - 1) * pageSize;
      return { items: items.slice(start, start + pageSize), total: items.length, page, pageSize, totalPages: Math.ceil(items.length / pageSize) };
    }

    const page = params?.page ?? 1;
    const pageSize = params?.pageSize ?? 10;
    let items = await fetchEnrichedEndpoints();

    if (params?.status) {
      items = items.filter(endpoint => endpoint.status === params.status);
    }
    if (params?.search) {
      const query = params.search.toLowerCase();
      items = items.filter(endpoint =>
        endpoint.name.toLowerCase().includes(query) ||
        endpoint.url.toLowerCase().includes(query)
      );
    }

    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize) || 1,
    };
  },

  async get(id: string): Promise<Endpoint> {
    if (USE_MOCKS) {
      await delay(200);
      const endpoint = mockEndpoints.find(item => item.id === id);
      if (!endpoint) throw new Error('Endpoint not found');
      return endpoint;
    }
    const [endpointResponse, metrics] = await Promise.all([
      apiClient.get<BackendEndpoint>(`/endpoints/${id}`),
      fetchAllMetricsSafe({ endpointId: id }),
    ]);
    return fromBackendEndpoint(endpointResponse.data, metrics);
  },

  async create(payload: EndpointFormPayload): Promise<Endpoint> {
    if (USE_MOCKS) {
      await delay(500);
      const endpoint: Endpoint = {
        ...payload,
        id: `ep_${Date.now()}`,
        status: 'PENDING',
        uptimePercent: 0,
        avgLatencyMs: 0,
        lastCheckedAt: null,
        tags: payload.tags ?? [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      mockEndpoints = [endpoint, ...mockEndpoints];
      return endpoint;
    }
    const { data } = await apiClient.post<BackendEndpoint>('/endpoints', toBackendEndpointPayload(payload));
    return fromBackendEndpoint(data);
  },

  async update(id: string, payload: Partial<EndpointFormPayload>): Promise<Endpoint> {
    if (USE_MOCKS) {
      await delay(400);
      mockEndpoints = mockEndpoints.map(endpoint => endpoint.id === id ? { ...endpoint, ...payload, updatedAt: new Date().toISOString() } : endpoint);
      return mockEndpoints.find(endpoint => endpoint.id === id)!;
    }

    const existing = await endpointsApi.get(id);
    const { data } = await apiClient.put<BackendEndpoint>(`/endpoints/${id}`, toBackendEndpointPayload({
      name: payload.name ?? existing.name,
      url: payload.url ?? existing.url,
      method: payload.method ?? (existing.method === 'POST' ? 'POST' : 'GET'),
      intervalSeconds: payload.intervalSeconds ?? existing.intervalSeconds,
      timeoutMs: payload.timeoutMs ?? existing.timeoutMs,
      expectedStatusCode: payload.expectedStatusCode ?? existing.expectedStatusCode,
      tags: payload.tags ?? existing.tags,
    }));
    const metrics = await fetchAllMetricsSafe({ endpointId: id });
    return fromBackendEndpoint(data, metrics);
  },

  async delete(id: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(300);
      mockEndpoints = mockEndpoints.filter(endpoint => endpoint.id !== id);
      return;
    }
    await apiClient.delete(`/endpoints/${id}`);
  },

  async getChecks(id: string, page = 1, pageSize = 20): Promise<PaginatedResponse<Check>> {
    if (USE_MOCKS) {
      await delay(300);
      const checks = generateChecks(id, 50);
      const start = (page - 1) * pageSize;
      return { items: checks.slice(start, start + pageSize), total: checks.length, page, pageSize, totalPages: Math.ceil(checks.length / pageSize) };
    }
    const metrics = await fetchAllMetricsSafe({ endpointId: id });
    const items = metrics.map(toCheck);
    const start = (page - 1) * pageSize;
    return {
      items: items.slice(start, start + pageSize),
      total: items.length,
      page,
      pageSize,
      totalPages: Math.ceil(items.length / pageSize) || 1,
    };
  },

  async getLatency(id: string): Promise<LatencyDataPoint[]> {
    if (USE_MOCKS) {
      await delay(250);
      return generateLatencyData(24, 150, id);
    }
    const metrics = await fetchAllMetricsSafe({ endpointId: id });
    const since = Date.now() - 24 * 60 * 60 * 1000;
    return metricsToLatencyTrend(metrics.filter(metric => new Date(metric.checkedAt).getTime() >= since));
  },

  async getUptime(id: string): Promise<UptimeDataPoint[]> {
    if (USE_MOCKS) {
      await delay(250);
      return generateUptimeData(30, id);
    }
    const metrics = await fetchAllMetricsSafe({ endpointId: id });
    const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return metricsToUptimeTrend(metrics.filter(metric => new Date(metric.checkedAt).getTime() >= since));
  },
};

export const alertsApi = {
  async listRules(): Promise<AlertRule[]> {
    if (USE_MOCKS) {
      await delay(300);
      return mockRules;
    }
    const [alertsResponse, endpoints] = await Promise.all([
      apiClient.get<BackendAlert[]>('/alerts'),
      fetchEnrichedEndpoints(),
    ]);
    const endpointNames = new Map(endpoints.map(endpoint => [endpoint.id, endpoint.name]));
    return alertsResponse.data.map(alert => backendAlertToRule(alert, endpointNames.get(alert.endpointId) ?? alert.endpointId));
  },

  async createRule(payload: AlertRuleFormPayload): Promise<AlertRule> {
    if (USE_MOCKS) {
      await delay(500);
      const endpoint = mockEndpoints.find(item => item.id === payload.endpointId);
      const rule: AlertRule = {
        id: `ar_${Date.now()}`,
        endpointName: endpoint?.name ?? payload.endpointId,
        threshold: payload.threshold ?? null,
        isEnabled: true,
        createdAt: new Date().toISOString(),
        ...payload,
      };
      mockRules = [rule, ...mockRules];
      return rule;
    }

    const backendPayload = mapAlertCondition(payload.conditionType, payload.threshold);
    const { data } = await apiClient.post<BackendAlert>('/alerts', {
      endpointId: payload.endpointId,
      ...backendPayload,
      isActive: true,
    });
    const endpoints = await fetchEnrichedEndpoints();
    const endpointName = endpoints.find(endpoint => endpoint.id === payload.endpointId)?.name ?? payload.endpointId;
    return backendAlertToRule(data, endpointName);
  },

  async toggleRule(id: string, isEnabled: boolean): Promise<AlertRule> {
    if (USE_MOCKS) {
      await delay(300);
      mockRules = mockRules.map(rule => rule.id === id ? { ...rule, isEnabled } : rule);
      return mockRules.find(rule => rule.id === id)!;
    }
    const { data } = await apiClient.patch<BackendAlert>(`/alerts/${id}`, { isActive: isEnabled });
    const endpoints = await fetchEnrichedEndpoints();
    const endpointName = endpoints.find(endpoint => endpoint.id === data.endpointId)?.name ?? data.endpointId;
    return backendAlertToRule(data, endpointName);
  },

  async deleteRule(id: string): Promise<void> {
    if (USE_MOCKS) {
      await delay(300);
      mockRules = mockRules.filter(rule => rule.id !== id);
      return;
    }
    await apiClient.delete(`/alerts/${id}`);
  },

  async listEvents(): Promise<AlertEvent[]> {
    if (USE_MOCKS) {
      await delay(300);
      return MOCK_ALERT_EVENTS;
    }
    const [alertsResponse, endpoints] = await Promise.all([
      apiClient.get<BackendAlert[]>('/alerts'),
      fetchEnrichedEndpoints(),
    ]);
    const endpointNames = new Map(endpoints.map(endpoint => [endpoint.id, endpoint.name]));
    return alertsResponse.data.map(alert => backendAlertToEvent(alert, endpointNames.get(alert.endpointId) ?? alert.endpointId));
  },

  async resolveEvent(id: string): Promise<AlertEvent> {
    const { data } = await apiClient.patch<BackendAlert>(`/alerts/${id}/resolve`);
    const endpoints = await fetchEnrichedEndpoints();
    const endpointName = endpoints.find(endpoint => endpoint.id === data.endpointId)?.name ?? data.endpointId;
    return backendAlertToEvent(data, endpointName);
  },
};

export const metricsApi = {
  async list(params?: {
    endpointId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
    sort?: 'asc' | 'desc';
  }): Promise<MetricRecord[]> {
    const [metrics, endpoints] = await Promise.all([
      fetchAllMetrics({
        endpointId: params?.endpointId,
        limit: params?.limit ?? 200,
      }),
      fetchEnrichedEndpoints(),
    ]);

    const endpointMap = new Map(endpoints.map(endpoint => [endpoint.id, endpoint]));

    let filtered = metrics;
    if (params?.startDate) {
      const start = new Date(params.startDate).getTime();
      filtered = filtered.filter(metric => new Date(metric.checkedAt).getTime() >= start);
    }
    if (params?.endDate) {
      const end = new Date(params.endDate).getTime();
      filtered = filtered.filter(metric => new Date(metric.checkedAt).getTime() <= end);
    }
    if (params?.sort) {
      filtered = [...filtered].sort((a, b) => {
        const aValue = a.responseTimeMs ?? -1;
        const bValue = b.responseTimeMs ?? -1;
        return params.sort === 'asc' ? aValue - bValue : bValue - aValue;
      });
    }

    return filtered.map(metric => toMetricRecord(metric, endpointMap.get(metric.endpointId)));
  },
};

export const healthApi = {
  async getSystemHealth(): Promise<HealthStatus> {
    const [{ data: health }, { data: ready }] = await Promise.all([
      apiClient.get<HealthStatus>('/health'),
      apiClient.get<{ ready: boolean }>('/health/ready'),
    ]);
    return {
      ...health,
      ready: ready.ready,
    };
  },
};

export const reportsApi = {
  async exportCsv(params: ReportParams): Promise<string> {
    if (USE_MOCKS) {
      await delay(800);
      const checks = generateChecks(params.endpointId, 100);
      const endpoint = mockEndpoints.find(item => item.id === params.endpointId);
      const header = 'Endpoint,Timestamp,Status,Status Code,Response Time (ms),Error\n';
      const rows = checks.map(check =>
        [endpoint?.name ?? params.endpointId, check.checkedAt, check.status, check.statusCode ?? '', check.responseTimeMs ?? '', check.error ?? ''].join(',')
      );
      return header + rows.join('\n');
    }
    const { data } = await apiClient.get<string>('/reports/metrics.csv', {
      params: { endpoint_id: params.endpointId },
      responseType: 'text',
    });
    return data;
  },

  async exportEndpointsCsv(): Promise<string> {
    const { data } = await apiClient.get<string>('/reports/endpoints.csv', {
      responseType: 'text',
    });
    return data;
  },

  async exportAlertsCsv(resolvedOnly = false): Promise<string> {
    const { data } = await apiClient.get<string>('/reports/alerts.csv', {
      params: { resolved_only: resolvedOnly },
      responseType: 'text',
    });
    return data;
  },
};
