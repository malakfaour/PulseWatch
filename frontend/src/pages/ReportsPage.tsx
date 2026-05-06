import { useState } from 'react';
import { FileBarChart2, Files, TriangleAlert } from 'lucide-react';
import { format, subDays } from 'date-fns';
import { TopBar } from '@/components/layout/AppLayout';
import { Button, Card, CardHeader, CardTitle, Input, Select, useToast } from '@/components/ui';
import { useEndpoints, useExportAlertsReport, useExportEndpointsReport, useExportReport } from '@/hooks';
import { downloadCsv } from '@/utils';

export default function ReportsPage() {
  const { addToast } = useToast();
  const exportMetrics = useExportReport();
  const exportEndpoints = useExportEndpointsReport();
  const exportAlerts = useExportAlertsReport();
  const { data: endpointsPage } = useEndpoints({ pageSize: 100 });

  const [endpointId, setEndpointId] = useState('');
  const [from, setFrom] = useState(format(subDays(new Date(), 7), 'yyyy-MM-dd'));
  const [to, setTo] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [resolvedOnly, setResolvedOnly] = useState(false);

  const endpointOptions = [
    { value: '', label: 'Select endpoint...' },
    ...(endpointsPage?.items.map(endpoint => ({ value: endpoint.id, label: endpoint.name })) ?? []),
  ];

  const handleMetricsExport = async () => {
    if (!endpointId) {
      addToast('warning', 'Select an endpoint first');
      return;
    }
    try {
      const csv = await exportMetrics.mutateAsync({ endpointId, from, to });
      const endpoint = endpointsPage?.items.find(item => item.id === endpointId);
      downloadCsv(csv, `pulsewatch-metrics-${endpoint?.name ?? endpointId}.csv`);
      addToast('success', 'Metrics CSV downloaded');
    } catch {
      addToast('error', 'Failed to export endpoint metrics');
    }
  };

  const handleEndpointsExport = async () => {
    try {
      const csv = await exportEndpoints.mutateAsync();
      downloadCsv(csv, 'pulsewatch-endpoints.csv');
      addToast('success', 'Endpoints CSV downloaded');
    } catch {
      addToast('error', 'Failed to export endpoints');
    }
  };

  const handleAlertsExport = async () => {
    try {
      const csv = await exportAlerts.mutateAsync(resolvedOnly);
      downloadCsv(csv, resolvedOnly ? 'pulsewatch-alerts-resolved.csv' : 'pulsewatch-alerts-all.csv');
      addToast('success', 'Alerts CSV downloaded');
    } catch {
      addToast('error', 'Failed to export alerts');
    }
  };

  return (
    <>
      <TopBar title="Reports" subtitle="Export operational data directly from the backend" />

      <div className="flex-1 p-8 space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle>Endpoint Inventory</CardTitle>
            </CardHeader>
            <p className="text-sm text-surface-500 dark:text-surface-400">Download the current monitored endpoint inventory for operational reviews or handoffs.</p>
            <Button className="mt-6 w-full" icon={Files} onClick={handleEndpointsExport} loading={exportEndpoints.isPending}>
              Export Endpoints CSV
            </Button>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Alert Archive</CardTitle>
            </CardHeader>
            <p className="text-sm text-surface-500 dark:text-surface-400">Export alert history to review incidents, triage trends, or share postmortem evidence.</p>
            <label className="mt-4 flex items-center gap-2 text-sm text-surface-600 dark:text-surface-300">
              <input
                type="checkbox"
                checked={resolvedOnly}
                onChange={event => setResolvedOnly(event.target.checked)}
                className="rounded border-surface-300"
              />
              Export resolved alerts only
            </label>
            <Button className="mt-6 w-full" icon={TriangleAlert} onClick={handleAlertsExport} loading={exportAlerts.isPending}>
              Export Alerts CSV
            </Button>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Metrics Export</CardTitle>
            </CardHeader>
            <div className="space-y-4">
              <Select label="Endpoint" options={endpointOptions} value={endpointId} onChange={event => setEndpointId(event.target.value)} />
              <div className="grid grid-cols-2 gap-3">
                <Input label="From" type="date" value={from} onChange={event => setFrom(event.target.value)} />
                <Input label="To" type="date" value={to} onChange={event => setTo(event.target.value)} />
              </div>
              <Button className="w-full" icon={FileBarChart2} onClick={handleMetricsExport} loading={exportMetrics.isPending}>
                Export Metrics CSV
              </Button>
            </div>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Export Guidance</CardTitle>
          </CardHeader>
          <div className="grid grid-cols-1 gap-3 xl:grid-cols-3 text-sm text-surface-600 dark:text-surface-300">
            <div className="rounded-xl border border-surface-100 p-4 dark:border-surface-800">
              <p className="font-600 text-surface-800 dark:text-surface-100">Metrics CSV</p>
              <p className="mt-1">Best for latency, status code, and error analysis per monitored endpoint.</p>
            </div>
            <div className="rounded-xl border border-surface-100 p-4 dark:border-surface-800">
              <p className="font-600 text-surface-800 dark:text-surface-100">Endpoints CSV</p>
              <p className="mt-1">Best for inventory snapshots, ownership reviews, and environment audits.</p>
            </div>
            <div className="rounded-xl border border-surface-100 p-4 dark:border-surface-800">
              <p className="font-600 text-surface-800 dark:text-surface-100">Alerts CSV</p>
              <p className="mt-1">Best for incident history, escalations, and post-incident follow-up.</p>
            </div>
          </div>
          <div className="mt-5 rounded-xl bg-surface-50 p-4 text-xs text-surface-500 dark:bg-surface-900 dark:text-surface-400">
            The backend currently exports all available metrics for the selected endpoint. The date fields are kept here as report context for the operator, but the backend export route itself does not yet filter by date range.
          </div>
        </Card>
      </div>
    </>
  );
}
