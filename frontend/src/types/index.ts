export interface User {
  id: string;
  email: string;
  name: string;
  createdAt: string;
}

export interface AuthTokens {
  accessToken: string;
  tokenType: 'bearer';
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

export type EndpointStatus = 'UP' | 'DOWN' | 'DEGRADED' | 'PENDING';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD';
export type EndpointFormMethod = 'GET' | 'POST';

export interface Endpoint {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  status: EndpointStatus;
  uptimePercent: number;
  avgLatencyMs: number;
  lastCheckedAt: string | null;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusCode: number;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface EndpointFormPayload {
  name: string;
  url: string;
  method: EndpointFormMethod;
  intervalSeconds: number;
  timeoutMs: number;
  expectedStatusCode: number;
  tags?: string[];
}

export interface Check {
  id: string;
  endpointId: string;
  status: EndpointStatus;
  statusCode: number | null;
  responseTimeMs: number | null;
  error: string | null;
  checkedAt: string;
}

export interface MetricRecord {
  id: string;
  endpointId: string;
  endpointName?: string;
  endpointUrl?: string;
  status: EndpointStatus;
  statusCode: number | null;
  responseTimeMs: number | null;
  error: string | null;
  checkedAt: string;
}

export interface UptimeDataPoint {
  timestamp: string;
  uptimePercent: number;
}

export interface LatencyDataPoint {
  timestamp: string;
  latencyMs: number | null;
}

export type AlertConditionType = 'LATENCY_GT' | 'STATUS_DOWN' | 'UPTIME_LT';
export type AlertStatus = 'ACTIVE' | 'RESOLVED' | 'SILENCED';

export interface AlertRule {
  id: string;
  endpointId: string;
  endpointName: string;
  conditionType: AlertConditionType;
  threshold: number | null;
  isEnabled: boolean;
  createdAt: string;
}

export interface AlertEvent {
  id: string;
  ruleId: string;
  endpointId: string;
  endpointName: string;
  conditionType: AlertConditionType;
  threshold: number | null;
  status: AlertStatus;
  message: string;
  triggeredAt: string;
  resolvedAt: string | null;
}

export interface AlertRuleFormPayload {
  endpointId: string;
  conditionType: AlertConditionType;
  threshold?: number;
}

export interface DashboardStats {
  totalEndpoints: number;
  upCount: number;
  downCount: number;
  degradedCount: number;
  activeAlerts: number;
  avgUptimePercent: number;
  avgLatencyMs: number;
}

export interface HealthStatus {
  status: string;
  database: string;
  timestamp: string;
  ready?: boolean;
}

export interface ReportParams {
  endpointId: string;
  from: string;
  to: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  detail: string;
  status: number;
}
