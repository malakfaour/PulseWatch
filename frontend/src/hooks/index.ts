import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { alertsApi, dashboardApi, endpointsApi, healthApi, metricsApi, reportsApi } from '@/api/services';
import { POLLING_INTERVAL } from '@/utils';
import type { AlertRuleFormPayload, EndpointFormPayload, ReportParams } from '@/types';

export const QK = {
  dashStats: ['dashboard', 'stats'] as const,
  dashLatency: ['dashboard', 'latency'] as const,
  endpoints: (params?: object) => ['endpoints', params] as const,
  endpoint: (id: string) => ['endpoints', id] as const,
  checks: (id: string, page: number) => ['endpoints', id, 'checks', page] as const,
  epLatency: (id: string) => ['endpoints', id, 'latency'] as const,
  epUptime: (id: string) => ['endpoints', id, 'uptime'] as const,
  alertRules: ['alerts', 'rules'] as const,
  alertEvents: ['alerts', 'events'] as const,
  metrics: (params?: object) => ['metrics', params] as const,
  health: ['health'] as const,
};

export function useDashboardStats() {
  return useQuery({ queryKey: QK.dashStats, queryFn: dashboardApi.getStats, refetchInterval: POLLING_INTERVAL });
}

export function useDashboardLatency() {
  return useQuery({ queryKey: QK.dashLatency, queryFn: dashboardApi.getLatencyTrend, refetchInterval: POLLING_INTERVAL });
}

export function useEndpoints(params?: { status?: string; search?: string; page?: number; pageSize?: number }) {
  return useQuery({ queryKey: QK.endpoints(params), queryFn: () => endpointsApi.list(params), refetchInterval: POLLING_INTERVAL });
}

export function useEndpoint(id: string) {
  return useQuery({ queryKey: QK.endpoint(id), queryFn: () => endpointsApi.get(id), refetchInterval: POLLING_INTERVAL, enabled: !!id });
}

export function useEndpointChecks(id: string, page = 1) {
  return useQuery({ queryKey: QK.checks(id, page), queryFn: () => endpointsApi.getChecks(id, page), refetchInterval: POLLING_INTERVAL, enabled: !!id });
}

export function useEndpointLatency(id: string) {
  return useQuery({ queryKey: QK.epLatency(id), queryFn: () => endpointsApi.getLatency(id), refetchInterval: POLLING_INTERVAL, enabled: !!id });
}

export function useEndpointUptime(id: string) {
  return useQuery({ queryKey: QK.epUptime(id), queryFn: () => endpointsApi.getUptime(id), refetchInterval: POLLING_INTERVAL, enabled: !!id });
}

export function useCreateEndpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: EndpointFormPayload) => endpointsApi.create(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['endpoints'] }),
  });
}

export function useUpdateEndpoint(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Partial<EndpointFormPayload>) => endpointsApi.update(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['endpoints'] });
      queryClient.invalidateQueries({ queryKey: QK.endpoint(id) });
    },
  });
}

export function useDeleteEndpoint() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => endpointsApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['endpoints'] }),
  });
}

export function useAlertRules() {
  return useQuery({ queryKey: QK.alertRules, queryFn: alertsApi.listRules, refetchInterval: POLLING_INTERVAL });
}

export function useAlertEvents() {
  return useQuery({ queryKey: QK.alertEvents, queryFn: alertsApi.listEvents, refetchInterval: POLLING_INTERVAL });
}

export function useCreateAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: AlertRuleFormPayload) => alertsApi.createRule(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.alertRules });
      queryClient.invalidateQueries({ queryKey: QK.alertEvents });
    },
  });
}

export function useToggleAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, isEnabled }: { id: string; isEnabled: boolean }) => alertsApi.toggleRule(id, isEnabled),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.alertRules });
      queryClient.invalidateQueries({ queryKey: QK.alertEvents });
    },
  });
}

export function useDeleteAlertRule() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.alertRules });
      queryClient.invalidateQueries({ queryKey: QK.alertEvents });
    },
  });
}

export function useResolveAlertEvent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => alertsApi.resolveEvent(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QK.alertRules });
      queryClient.invalidateQueries({ queryKey: QK.alertEvents });
      queryClient.invalidateQueries({ queryKey: QK.dashStats });
    },
  });
}

export function useMetrics(params?: {
  endpointId?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  sort?: 'asc' | 'desc';
}) {
  return useQuery({
    queryKey: QK.metrics(params),
    queryFn: () => metricsApi.list(params),
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useSystemHealth() {
  return useQuery({
    queryKey: QK.health,
    queryFn: healthApi.getSystemHealth,
    refetchInterval: POLLING_INTERVAL,
  });
}

export function useExportReport() {
  return useMutation({ mutationFn: (params: ReportParams) => reportsApi.exportCsv(params) });
}

export function useExportEndpointsReport() {
  return useMutation({ mutationFn: () => reportsApi.exportEndpointsCsv() });
}

export function useExportAlertsReport() {
  return useMutation({ mutationFn: (resolvedOnly?: boolean) => reportsApi.exportAlertsCsv(resolvedOnly) });
}
