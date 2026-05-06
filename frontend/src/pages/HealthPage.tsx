import React from 'react';
import { Database, HeartPulse, ShieldCheck, TimerReset } from 'lucide-react';
import { TopBar } from '@/components/layout/AppLayout';
import { Button, Card, CardHeader, CardTitle, Skeleton } from '@/components/ui';
import { useSystemHealth } from '@/hooks';
import { formatDateTime } from '@/utils';

function StatusCard({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: string;
  icon: React.ElementType;
}) {
  const healthy = value.toLowerCase() === 'ok' || value.toLowerCase() === 'true';
  return (
    <Card>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs uppercase tracking-widest text-surface-400">{title}</p>
          <p className={`mt-2 font-display text-3xl font-700 ${healthy ? 'text-up' : 'text-down'}`}>{value}</p>
        </div>
        <div className={`rounded-xl p-3 ${healthy ? 'bg-up/10 text-up' : 'bg-down/10 text-down'}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}

export default function HealthPage() {
  const { data, isLoading, refetch } = useSystemHealth();

  return (
    <>
      <TopBar
        title="System Health"
        subtitle="Backend availability and database readiness"
        actions={<Button variant="secondary" icon={TimerReset} onClick={() => refetch()}>Refresh</Button>}
      />

      <div className="flex-1 p-8 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 gap-5 xl:grid-cols-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, index) => <Card key={index}><Skeleton className="h-24 w-full" /></Card>)
          ) : (
            <>
              <StatusCard title="API Status" value={data?.status ?? 'unknown'} icon={HeartPulse} />
              <StatusCard title="Database" value={data?.database ?? 'unknown'} icon={Database} />
              <StatusCard title="Readiness" value={String(data?.ready ?? false)} icon={ShieldCheck} />
            </>
          )}
        </div>

        <Card>
          <CardHeader><CardTitle>Operational Notes</CardTitle></CardHeader>
          {isLoading ? (
            <Skeleton className="h-24 w-full" />
          ) : (
            <div className="space-y-3 text-sm text-surface-600 dark:text-surface-300">
              <p>The public health endpoints confirm that FastAPI is responding and the database accepts a simple query.</p>
              <p>Last backend timestamp: <span className="font-mono">{formatDateTime(data?.timestamp ?? null)}</span></p>
              <p>Use this page when diagnosing whether frontend issues are product bugs or a backend availability problem.</p>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader><CardTitle>Quick Checks</CardTitle></CardHeader>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
            <div className="rounded-xl border border-surface-100 p-4 dark:border-surface-800">
              <p className="text-sm font-600 text-surface-800 dark:text-surface-100">Health Probe</p>
              <p className="mt-1 text-xs text-surface-400">GET /health should return status: ok and database: ok.</p>
            </div>
            <div className="rounded-xl border border-surface-100 p-4 dark:border-surface-800">
              <p className="text-sm font-600 text-surface-800 dark:text-surface-100">Readiness Probe</p>
              <p className="mt-1 text-xs text-surface-400">GET /health/ready should return ready: true when the API and DB are ready for traffic.</p>
            </div>
          </div>
        </Card>
      </div>
    </>
  );
}
