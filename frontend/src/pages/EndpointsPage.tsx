import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Search, Pencil, Trash2, Globe, ExternalLink } from 'lucide-react';
import { TopBar } from '@/components/layout/AppLayout';
import { Card, StatusBadge, Button, Input, Select, Table, Th, Td, Skeleton, EmptyState, Pagination, useToast } from '@/components/ui';
import { EndpointFormModal } from '@/features/endpoints/EndpointFormModal';
import { useEndpoints, useDeleteEndpoint } from '@/hooks';
import { formatLatency, formatUptime, formatRelativeTime } from '@/utils';
import type { Endpoint } from '@/types';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'UP', label: 'Up' },
  { value: 'DOWN', label: 'Down' },
  { value: 'DEGRADED', label: 'Degraded' },
  { value: 'PENDING', label: 'Pending' },
];

export default function EndpointsPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [isModalOpen, setModalOpen] = useState(false);
  const [editingEndpoint, setEditingEndpoint] = useState<Endpoint | undefined>();

  const { data, isLoading } = useEndpoints({ status: statusFilter || undefined, search: search || undefined, page });
  const deleteMutation = useDeleteEndpoint();

  const handleDelete = async (ep: Endpoint) => {
    if (!window.confirm(`Delete "${ep.name}"? This cannot be undone.`)) return;
    try {
      await deleteMutation.mutateAsync(ep.id);
      addToast('success', `"${ep.name}" removed from monitoring`);
    } catch {
      addToast('error', 'Failed to delete endpoint');
    }
  };

  const handleEdit = (ep: Endpoint) => {
    setEditingEndpoint(ep);
    setModalOpen(true);
  };

  return (
    <>
      <TopBar
        title="Endpoints"
        subtitle={data ? `${data.total} endpoints monitored` : undefined}
        actions={
          <Button icon={Plus} onClick={() => { setEditingEndpoint(undefined); setModalOpen(true); }}>
            Add Endpoint
          </Button>
        }
      />

      <div className="flex-1 p-8 space-y-6 animate-fade-in">
        {/* Filters */}
        <div className="flex gap-3 flex-wrap">
          <div className="flex-1 min-w-60">
            <Input
              icon={Search}
              placeholder="Search by name or URL..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
            />
          </div>
          <div className="w-48">
            <Select
              options={STATUS_OPTIONS}
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
            />
          </div>
        </div>

        {/* Table */}
        <Card noPad className="overflow-hidden">
          <Table>
            <thead>
              <tr>
                <Th>Endpoint</Th>
                <Th>Status</Th>
                <Th>Uptime (30d)</Th>
                <Th>Avg Latency</Th>
                <Th>Last Checked</Th>
                <Th>Interval</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <Td key={j}><Skeleton className="h-4 w-full" /></Td>
                    ))}
                  </tr>
                ))
              ) : data?.items.length === 0 ? (
                <tr><td colSpan={7}>
                  <EmptyState
                    icon={Globe}
                    title="No endpoints found"
                    description="Add your first endpoint to start monitoring"
                    action={<Button icon={Plus} onClick={() => { setEditingEndpoint(undefined); setModalOpen(true); }}>Add Endpoint</Button>}
                  />
                </td></tr>
              ) : data?.items.map(ep => (
                <tr key={ep.id} className="group hover:bg-surface-50 dark:hover:bg-surface-800/50 cursor-pointer transition-colors" onClick={() => navigate(`/endpoints/${ep.id}`)}>
                  <Td>
                    <div>
                      <p className="font-600 text-surface-800 dark:text-surface-100 group-hover:text-pulse-600 dark:group-hover:text-pulse-400 transition-colors">{ep.name}</p>
                      <p className="text-xs font-mono text-surface-400 mt-0.5 truncate max-w-64">{ep.url}</p>
                    </div>
                  </Td>
                  <Td><StatusBadge status={ep.status} /></Td>
                  <Td>
                    <span className={ep.uptimePercent >= 99 ? 'text-up font-600' : ep.uptimePercent >= 95 ? 'text-warn font-600' : 'text-down font-600'}>
                      {ep.status === 'PENDING' ? '—' : formatUptime(ep.uptimePercent)}
                    </span>
                  </Td>
                  <Td className="font-mono">{formatLatency(ep.avgLatencyMs)}</Td>
                  <Td className="text-surface-400">{formatRelativeTime(ep.lastCheckedAt)}</Td>
                  <Td className="text-surface-400">{ep.intervalSeconds}s</Td>
                  <Td>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity" onClick={e => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" icon={ExternalLink} onClick={() => navigate(`/endpoints/${ep.id}`)} title="View details" />
                      <Button variant="ghost" size="sm" icon={Pencil} onClick={() => handleEdit(ep)} title="Edit" />
                      <Button variant="danger" size="sm" icon={Trash2} onClick={() => handleDelete(ep)} title="Delete" loading={deleteMutation.isPending && deleteMutation.variables === ep.id} />
                    </div>
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          {data && <Pagination page={page} totalPages={data.totalPages} onPageChange={setPage} />}
        </Card>
      </div>

      <EndpointFormModal
        isOpen={isModalOpen}
        onClose={() => { setModalOpen(false); setEditingEndpoint(undefined); }}
        endpoint={editingEndpoint}
      />
    </>
  );
}
