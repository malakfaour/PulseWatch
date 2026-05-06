import { Globe, Bell, TrendingUp, Zap, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { TopBar } from '@/components/layout/AppLayout';
import { Card, CardHeader, CardTitle, StatusBadge, Skeleton } from '@/components/ui';
import { LatencyChart, StatusPieChart } from '@/components/charts';
import { useDashboardStats, useDashboardLatency, useAlertEvents, useEndpoints } from '@/hooks';
import { formatLatency, formatUptime } from '@/utils';

function StatCard({ label, value, sub, icon: Icon, trend }: { label: string; value: string; sub?: string; icon: React.ElementType; trend?: 'up' | 'down' | 'neutral' }) {
  const trendColor = trend === 'up' ? 'text-up' : trend === 'down' ? 'text-down' : 'text-surface-400';
  const TrendIcon = trend === 'up' ? ArrowUpRight : ArrowDownRight;
  return (
    <Card className="relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-500 uppercase tracking-widest text-surface-400">{label}</p>
          <p className="mt-2 font-display text-3xl font-700 text-surface-900 dark:text-white">{value}</p>
          {sub && (
            <p className={`mt-1 flex items-center gap-1 text-xs font-500 ${trendColor}`}>
              {trend && trend !== 'neutral' && <TrendIcon className="h-3 w-3" />}
              {sub}
            </p>
          )}
        </div>
        <div className="rounded-xl bg-pulse-50 p-3 dark:bg-pulse-500/10">
          <Icon className="h-5 w-5 text-pulse-500" />
        </div>
      </div>
    </Card>
  );
}

function StatCardSkeleton() {
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <Skeleton className="h-3 w-20 mb-2" />
          <Skeleton className="h-8 w-28 mb-1" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-11 w-11 rounded-xl" />
      </div>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: latency, isLoading: latencyLoading } = useDashboardLatency();
  const { data: alertEvents } = useAlertEvents();
  const { data: endpointsPage } = useEndpoints({ pageSize: 5 });

  const recentAlerts = alertEvents?.filter(a => a.status === 'ACTIVE').slice(0, 5) ?? [];
  const recentEndpoints = endpointsPage?.items?.slice(0, 5) ?? [];

  return (
    <>
      <TopBar title="Dashboard" subtitle="System health overview" />
      <div className="flex-1 p-8 space-y-8 animate-fade-in">

        {/* Stat Cards */}
        <div className="grid grid-cols-2 gap-5 xl:grid-cols-4">
          {statsLoading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : stats ? (
            <>
              <StatCard label="Total Endpoints" value={String(stats.totalEndpoints)} icon={Globe} sub={`${stats.upCount} healthy`} trend="neutral" />
              <StatCard label="Active Alerts" value={String(stats.activeAlerts)} icon={Bell} sub={stats.activeAlerts > 0 ? 'Needs attention' : 'All clear'} trend={stats.activeAlerts > 0 ? 'down' : 'neutral'} />
              <StatCard label="Avg Uptime" value={formatUptime(stats.avgUptimePercent)} icon={TrendingUp} sub="Last 30 days" trend="up" />
              <StatCard label="Avg Latency" value={formatLatency(stats.avgLatencyMs)} icon={Zap} sub="Across all endpoints" trend="neutral" />
            </>
          ) : null}
        </div>

        {/* Charts row */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {/* Latency trend */}
          <Card className="xl:col-span-2 !p-0 overflow-hidden">
            <div className="p-6 pb-2">
              <CardTitle>Latency Trend — Last 24h</CardTitle>
              <p className="text-xs text-surface-400 mt-0.5">Avg response time across all endpoints</p>
            </div>
            {latencyLoading ? (
              <Skeleton className="mx-6 mb-6 h-48 rounded-lg" />
            ) : latency ? (
              <div className="px-2 pb-4">
                <LatencyChart data={latency} height={220} />
              </div>
            ) : null}
          </Card>

          {/* Status distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status Distribution</CardTitle>
            </CardHeader>
            {statsLoading ? (
              <div className="flex items-center justify-center h-40"><Skeleton className="h-36 w-36 rounded-full" /></div>
            ) : stats ? (
              <>
                <div className="flex justify-center">
                  <StatusPieChart up={stats.upCount} down={stats.downCount} degraded={stats.degradedCount} />
                </div>
                <div className="mt-4 space-y-2">
                  {[
                    { label: 'Healthy', count: stats.upCount, color: 'bg-up' },
                    { label: 'Down', count: stats.downCount, color: 'bg-down' },
                    { label: 'Degraded', count: stats.degradedCount, color: 'bg-warn' },
                  ].map(item => (
                    <div key={item.label} className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${item.color}`} />
                      <span className="flex-1 text-surface-500 dark:text-surface-400">{item.label}</span>
                      <span className="font-600 text-surface-700 dark:text-surface-200">{item.count}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </Card>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
          {/* Recent Alerts */}
          <Card className="!p-0 overflow-hidden">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800">
              <CardTitle>Active Alerts</CardTitle>
            </div>
            {recentAlerts.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-sm text-surface-400">No active alerts — all systems clear ✓</p>
              </div>
            ) : (
              <ul className="divide-y divide-surface-50 dark:divide-surface-800">
                {recentAlerts.map(alert => (
                  <li key={alert.id} className="flex items-start gap-3 px-5 py-3.5">
                    <span className="mt-1 h-2 w-2 rounded-full bg-down flex-shrink-0 animate-pulse" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-500 text-surface-800 dark:text-surface-200 truncate">{alert.endpointName}</p>
                      <p className="text-xs text-surface-400 truncate">{alert.message}</p>
                    </div>
                    <span className="text-xs text-surface-400 flex-shrink-0">
                      {formatDistanceToNow(new Date(alert.triggeredAt), { addSuffix: true })}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>

          {/* Recent Endpoints */}
          <Card className="!p-0 overflow-hidden">
            <div className="p-5 border-b border-surface-100 dark:border-surface-800">
              <CardTitle>Endpoint Status</CardTitle>
            </div>
            <ul className="divide-y divide-surface-50 dark:divide-surface-800">
              {recentEndpoints.map(ep => (
                <li key={ep.id} className="flex items-center gap-3 px-5 py-3">
                  <StatusBadge status={ep.status} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-500 text-surface-800 dark:text-surface-200 truncate">{ep.name}</p>
                    <p className="text-xs text-surface-400 font-mono truncate">{ep.url}</p>
                  </div>
                  <span className="text-xs font-mono text-surface-400 flex-shrink-0">{formatLatency(ep.avgLatencyMs)}</span>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
}
