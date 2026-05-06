import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Pencil, RefreshCw } from 'lucide-react';
import { TopBar } from '@/components/layout/AppLayout';
import { Card, CardTitle, StatusBadge, Button, Table, Th, Td, Skeleton, Pagination } from '@/components/ui';
import { LatencyChart, UptimeChart } from '@/components/charts';
import { EndpointFormModal } from '@/features/endpoints/EndpointFormModal';
import { useEndpoint, useEndpointChecks, useEndpointLatency, useEndpointUptime } from '@/hooks';
import { formatLatency, formatUptime, formatRelativeTime, formatDateTime } from '@/utils';

export default function EndpointDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [isEditOpen, setEditOpen] = useState(false);

  const { data: ep, isLoading: epLoading, refetch } = useEndpoint(id!);
  const { data: checks, isLoading: checksLoading } = useEndpointChecks(id!, page);
  const { data: latency, isLoading: latencyLoading } = useEndpointLatency(id!);
  const { data: uptime, isLoading: uptimeLoading } = useEndpointUptime(id!);

  if (epLoading) {
    return (
      <>
        <TopBar title="Endpoint Details" />
        <div className="flex-1 p-8 space-y-6">
          <Skeleton className="h-32 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-5"><Skeleton className="h-52" /><Skeleton className="h-52" /></div>
        </div>
      </>
    );
  }

  if (!ep) return (
    <div className="flex-1 p-8">
      <p className="text-surface-400">Endpoint not found. <Link to="/endpoints" className="text-pulse-500 underline">Go back</Link></p>
    </div>
  );

  return (
    <>
      <TopBar
        title={ep.name}
        subtitle={ep.url}
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => refetch()} title="Refresh" />
            <Button variant="secondary" size="sm" icon={Pencil} onClick={() => setEditOpen(true)}>Edit</Button>
            <Button variant="secondary" size="sm" icon={ArrowLeft} onClick={() => navigate('/endpoints')}>Back</Button>
          </div>
        }
      />

      <div className="flex-1 p-8 space-y-6 animate-fade-in">
        {/* Overview */}
        <Card>
          <div className="flex flex-wrap items-center gap-6">
            <StatusBadge status={ep.status} />
            <div className="h-8 w-px bg-surface-100 dark:bg-surface-800" />
            <div>
              <p className="text-xs text-surface-400 mb-0.5">Uptime (30d)</p>
              <p className="font-display font-700 text-surface-900 dark:text-white">{formatUptime(ep.uptimePercent)}</p>
            </div>
            <div>
              <p className="text-xs text-surface-400 mb-0.5">Avg Latency</p>
              <p className="font-display font-700 text-surface-900 dark:text-white">{formatLatency(ep.avgLatencyMs)}</p>
            </div>
            <div>
              <p className="text-xs text-surface-400 mb-0.5">Last Checked</p>
              <p className="font-600 text-surface-700 dark:text-surface-200">{formatRelativeTime(ep.lastCheckedAt)}</p>
            </div>
            <div>
              <p className="text-xs text-surface-400 mb-0.5">Interval</p>
              <p className="font-600 text-surface-700 dark:text-surface-200">{ep.intervalSeconds}s</p>
            </div>
            <div>
              <p className="text-xs text-surface-400 mb-0.5">Method</p>
              <span className="font-mono text-sm font-600 text-pulse-600 dark:text-pulse-400 bg-pulse-50 dark:bg-pulse-500/10 px-2 py-0.5 rounded">{ep.method}</span>
            </div>
            {ep.tags.length > 0 && (
              <div className="flex gap-1.5 flex-wrap">
                {ep.tags.map(tag => (
                  <span key={tag} className="text-xs font-500 px-2 py-0.5 rounded-full bg-surface-100 dark:bg-surface-800 text-surface-500 dark:text-surface-400">{tag}</span>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Charts */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          <Card className="!p-0 overflow-hidden">
            <div className="p-5">
              <CardTitle>Response Latency — 24h</CardTitle>
            </div>
            {latencyLoading ? <Skeleton className="mx-5 mb-5 h-44 rounded-lg" /> : latency ? (
              <div className="px-2 pb-4"><LatencyChart data={latency} height={180} /></div>
            ) : null}
          </Card>

          <Card className="!p-0 overflow-hidden">
            <div className="p-5">
              <CardTitle>Uptime History — 30 days</CardTitle>
            </div>
            {uptimeLoading ? <Skeleton className="mx-5 mb-5 h-44 rounded-lg" /> : uptime ? (
              <div className="px-2 pb-4"><UptimeChart data={uptime} height={180} /></div>
            ) : null}
          </Card>
        </div>

        {/* Recent Checks */}
        <Card className="!p-0 overflow-hidden">
          <div className="p-5 border-b border-surface-100 dark:border-surface-800">
            <CardTitle>Recent Checks</CardTitle>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Timestamp</Th>
                <Th>Status</Th>
                <Th>HTTP Code</Th>
                <Th>Response Time</Th>
                <Th>Error</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
              {checksLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>{Array.from({ length: 5 }).map((_, j) => <Td key={j}><Skeleton className="h-4" /></Td>)}</tr>
                ))
              ) : checks?.items.map(check => (
                <tr key={check.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                  <Td className="font-mono text-xs">{formatDateTime(check.checkedAt)}</Td>
                  <Td><StatusBadge status={check.status} size="sm" /></Td>
                  <Td className="font-mono">{check.statusCode ?? '—'}</Td>
                  <Td className="font-mono">{formatLatency(check.responseTimeMs)}</Td>
                  <Td className="text-down text-xs">{check.error ?? '—'}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {checks && <Pagination page={page} totalPages={checks.totalPages} onPageChange={setPage} />}
        </Card>
      </div>

      <EndpointFormModal isOpen={isEditOpen} onClose={() => setEditOpen(false)} endpoint={ep} />
    </>
  );
}
