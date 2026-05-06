import { useMemo, useState } from 'react';
import { Activity, Filter, Gauge, TimerReset } from 'lucide-react';
import { TopBar } from '@/components/layout/AppLayout';
import { Button, Card, CardHeader, CardTitle, EmptyState, Input, Select, Skeleton, StatusBadge, Table, Td, Th } from '@/components/ui';
import { LatencyChart } from '@/components/charts';
import { useEndpoints, useMetrics } from '@/hooks';
import { formatDateTime, formatLatency } from '@/utils';

const LIMIT_OPTIONS = [
  { value: '50', label: '50 rows' },
  { value: '100', label: '100 rows' },
  { value: '200', label: '200 rows' },
];

const SORT_OPTIONS = [
  { value: '', label: 'Newest first' },
  { value: 'desc', label: 'Slowest first' },
  { value: 'asc', label: 'Fastest first' },
];

export default function MetricsPage() {
  const [endpointId, setEndpointId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [limit, setLimit] = useState('100');
  const [sort, setSort] = useState('');

  const { data: endpointsPage } = useEndpoints({ pageSize: 100 });
  const { data: metrics, isLoading, refetch } = useMetrics({
    endpointId: endpointId || undefined,
    startDate: startDate || undefined,
    endDate: endDate || undefined,
    limit: Number(limit),
    sort: sort ? (sort as 'asc' | 'desc') : undefined,
  });

  const endpointOptions = [
    { value: '', label: 'All endpoints' },
    ...(endpointsPage?.items.map(endpoint => ({ value: endpoint.id, label: endpoint.name })) ?? []),
  ];

  const summary = useMemo(() => {
    const rows = metrics ?? [];
    const successful = rows.filter(row => row.status === 'UP').length;
    const avgLatency =
      rows.length === 0
        ? 0
        : rows.reduce((sum, row) => sum + (row.responseTimeMs ?? 0), 0) / rows.length;
    return {
      total: rows.length,
      successRate: rows.length === 0 ? 0 : (successful / rows.length) * 100,
      avgLatency,
    };
  }, [metrics]);

  const latencySeries = useMemo(
    () => (metrics ?? []).slice().reverse().map(row => ({ timestamp: row.checkedAt, latencyMs: row.responseTimeMs })),
    [metrics]
  );

  return (
    <>
      <TopBar
        title="Metrics"
        subtitle="Explore raw monitoring checks across all endpoints"
        actions={<Button variant="secondary" icon={TimerReset} onClick={() => refetch()}>Refresh</Button>}
      />

      <div className="flex-1 p-8 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 gap-4 xl:grid-cols-4">
          <Card>
            <CardHeader><CardTitle>Total Checks</CardTitle></CardHeader>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="font-display text-3xl font-700">{summary.total}</p>}
          </Card>
          <Card>
            <CardHeader><CardTitle>Success Rate</CardTitle></CardHeader>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="font-display text-3xl font-700">{summary.successRate.toFixed(1)}%</p>}
          </Card>
          <Card>
            <CardHeader><CardTitle>Avg Latency</CardTitle></CardHeader>
            {isLoading ? <Skeleton className="h-8 w-24" /> : <p className="font-display text-3xl font-700">{formatLatency(summary.avgLatency)}</p>}
          </Card>
          <Card>
            <CardHeader><CardTitle>Endpoint Filter</CardTitle></CardHeader>
            <p className="text-sm text-surface-500">{endpointOptions.find(option => option.value === endpointId)?.label ?? 'All endpoints'}</p>
          </Card>
        </div>

        <Card>
          <div className="grid grid-cols-1 gap-4 xl:grid-cols-5">
            <Select label="Endpoint" options={endpointOptions} value={endpointId} onChange={event => setEndpointId(event.target.value)} />
            <Input label="From" type="date" value={startDate} onChange={event => setStartDate(event.target.value)} />
            <Input label="To" type="date" value={endDate} onChange={event => setEndDate(event.target.value)} />
            <Select label="Sort" options={SORT_OPTIONS} value={sort} onChange={event => setSort(event.target.value)} />
            <Select label="Window" options={LIMIT_OPTIONS} value={limit} onChange={event => setLimit(event.target.value)} />
          </div>
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="p-5">
            <CardTitle>Latency Timeline</CardTitle>
            <p className="text-xs text-surface-400 mt-1">Recent check durations for the selected query</p>
          </div>
          {isLoading ? (
            <Skeleton className="mx-5 mb-5 h-52 rounded-lg" />
          ) : latencySeries.length === 0 ? (
            <div className="px-5 pb-5">
              <EmptyState icon={Gauge} title="No latency data yet" description="Run checks or loosen your filters to populate this chart." />
            </div>
          ) : (
            <div className="px-2 pb-4">
              <LatencyChart data={latencySeries} height={220} />
            </div>
          )}
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
            <CardTitle>Metric Stream</CardTitle>
            <div className="flex items-center gap-2 text-xs text-surface-400">
              <Filter className="h-3.5 w-3.5" />
              <span>Live backend data</span>
            </div>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Endpoint</Th>
                <Th>Status</Th>
                <Th>HTTP</Th>
                <Th>Latency</Th>
                <Th>Checked At</Th>
                <Th>Error</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 6 }).map((__, cellIndex) => (
                      <Td key={cellIndex}><Skeleton className="h-4 w-full" /></Td>
                    ))}
                  </tr>
                ))
              ) : metrics && metrics.length > 0 ? (
                metrics.map(metric => (
                  <tr key={metric.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <Td>
                      <div>
                        <p className="font-600 text-surface-800 dark:text-surface-100">{metric.endpointName ?? metric.endpointId}</p>
                        <p className="text-xs font-mono text-surface-400">{metric.endpointUrl ?? metric.endpointId}</p>
                      </div>
                    </Td>
                    <Td><StatusBadge status={metric.status} size="sm" /></Td>
                    <Td className="font-mono">{metric.statusCode ?? '—'}</Td>
                    <Td className="font-mono">{formatLatency(metric.responseTimeMs)}</Td>
                    <Td className="font-mono text-xs">{formatDateTime(metric.checkedAt)}</Td>
                    <Td className="text-xs text-down">{metric.error ?? '—'}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6}>
                    <EmptyState
                      icon={Activity}
                      title="No metrics yet"
                      description="Add endpoints and wait for the scheduler to record a few checks."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </div>
    </>
  );
}
