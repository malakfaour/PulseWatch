import { useState } from 'react';
import { Bell, CheckCheck, Plus, Power, Trash2 } from 'lucide-react';
import { TopBar } from '@/components/layout/AppLayout';
import { Button, Card, CardTitle, EmptyState, Skeleton, Table, Td, Th, useToast } from '@/components/ui';
import { AlertRuleFormModal } from '@/features/alerts/AlertRuleFormModal';
import { useAlertEvents, useAlertRules, useDeleteAlertRule, useResolveAlertEvent, useToggleAlertRule } from '@/hooks';
import { cn, formatRelativeTime, getConditionLabel } from '@/utils';

export default function AlertsPage() {
  const { addToast } = useToast();
  const [isModalOpen, setModalOpen] = useState(false);
  const { data: rules, isLoading: rulesLoading } = useAlertRules();
  const { data: events, isLoading: eventsLoading } = useAlertEvents();
  const toggleMutation = useToggleAlertRule();
  const deleteMutation = useDeleteAlertRule();
  const resolveMutation = useResolveAlertEvent();

  const activeEvents = events?.filter(event => event.status === 'ACTIVE') ?? [];

  const handleToggle = async (id: string, current: boolean) => {
    try {
      await toggleMutation.mutateAsync({ id, isEnabled: !current });
      addToast('success', `Alert rule ${!current ? 'enabled' : 'disabled'}`);
    } catch {
      addToast('error', 'Failed to update rule');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Delete this alert rule for "${name}"?`)) return;
    try {
      await deleteMutation.mutateAsync(id);
      addToast('success', 'Alert rule deleted');
    } catch {
      addToast('error', 'Failed to delete rule');
    }
  };

  const handleResolve = async (id: string) => {
    try {
      await resolveMutation.mutateAsync(id);
      addToast('success', 'Alert resolved');
    } catch {
      addToast('error', 'Failed to resolve alert');
    }
  };

  return (
    <>
      <TopBar
        title="Alerts"
        subtitle="Monitor rules and operational incidents"
        actions={<Button icon={Plus} onClick={() => setModalOpen(true)}>New Alert Rule</Button>}
      />

      <div className="flex-1 p-8 space-y-6 animate-fade-in">
        {activeEvents.length > 0 && (
          <div className="space-y-3">
            {activeEvents.map(event => (
              <div key={event.id} className="flex items-center gap-4 rounded-xl border border-down/20 bg-down/5 px-5 py-4">
                <span className="h-2.5 w-2.5 rounded-full bg-down animate-pulse flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-600 text-down">{event.endpointName}</p>
                  <p className="text-sm text-surface-600 dark:text-surface-300">{event.message}</p>
                </div>
                <span className="text-xs text-surface-400">{formatRelativeTime(event.triggeredAt)}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  icon={CheckCheck}
                  onClick={() => handleResolve(event.id)}
                  loading={resolveMutation.isPending && resolveMutation.variables === event.id}
                >
                  Resolve
                </Button>
              </div>
            ))}
          </div>
        )}

        <Card className="!p-0 overflow-hidden">
          <div className="p-5 border-b border-surface-100 dark:border-surface-800 flex items-center justify-between">
            <CardTitle>Alert Rules</CardTitle>
            <span className="text-xs text-surface-400">{rules?.length ?? 0} rules configured</span>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Endpoint</Th>
                <Th>Condition</Th>
                <Th>Status</Th>
                <Th>Created</Th>
                <Th />
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
              {rulesLoading ? (
                Array.from({ length: 3 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 5 }).map((__, cellIndex) => (
                      <Td key={cellIndex}><Skeleton className="h-4" /></Td>
                    ))}
                  </tr>
                ))
              ) : rules && rules.length > 0 ? (
                rules.map(rule => (
                  <tr key={rule.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors group">
                    <Td className="font-600 text-surface-800 dark:text-surface-100">{rule.endpointName}</Td>
                    <Td className="font-mono text-xs text-surface-500">{getConditionLabel(rule.conditionType, rule.threshold)}</Td>
                    <Td>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-500 border',
                        rule.isEnabled
                          ? 'bg-up/10 text-up border-up/20'
                          : 'bg-surface-100 text-surface-400 border-surface-200 dark:bg-surface-800 dark:border-surface-600'
                      )}>
                        <span className={cn('h-1.5 w-1.5 rounded-full', rule.isEnabled ? 'bg-up' : 'bg-surface-400')} />
                        {rule.isEnabled ? 'Active' : 'Disabled'}
                      </span>
                    </Td>
                    <Td className="text-surface-400 text-xs">{formatRelativeTime(rule.createdAt)}</Td>
                    <Td>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="sm"
                          icon={Power}
                          onClick={() => handleToggle(rule.id, rule.isEnabled)}
                          loading={toggleMutation.isPending && toggleMutation.variables?.id === rule.id}
                          title={rule.isEnabled ? 'Disable' : 'Enable'}
                        />
                        <Button
                          variant="danger"
                          size="sm"
                          icon={Trash2}
                          onClick={() => handleDelete(rule.id, rule.endpointName)}
                          loading={deleteMutation.isPending && deleteMutation.variables === rule.id}
                          title="Delete"
                        />
                      </div>
                    </Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Bell}
                      title="No alert rules"
                      description="Create your first alert to get notified of endpoint issues."
                      action={<Button icon={Plus} onClick={() => setModalOpen(true)}>Create Alert Rule</Button>}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>

        <Card className="!p-0 overflow-hidden">
          <div className="p-5 border-b border-surface-100 dark:border-surface-800">
            <CardTitle>Incident History</CardTitle>
          </div>
          <Table>
            <thead>
              <tr>
                <Th>Endpoint</Th>
                <Th>Message</Th>
                <Th>Status</Th>
                <Th>Triggered</Th>
                <Th>Resolved</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-50 dark:divide-surface-800">
              {eventsLoading ? (
                Array.from({ length: 4 }).map((_, index) => (
                  <tr key={index}>
                    {Array.from({ length: 5 }).map((__, cellIndex) => (
                      <Td key={cellIndex}><Skeleton className="h-4" /></Td>
                    ))}
                  </tr>
                ))
              ) : events && events.length > 0 ? (
                events.map(event => (
                  <tr key={event.id} className="hover:bg-surface-50 dark:hover:bg-surface-800/50 transition-colors">
                    <Td className="font-600 text-surface-800 dark:text-surface-100">{event.endpointName}</Td>
                    <Td className="text-xs text-surface-500 max-w-xs truncate">{event.message}</Td>
                    <Td>
                      <span className={cn(
                        'inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-500 border',
                        event.status === 'ACTIVE'
                          ? 'bg-down/10 text-down border-down/20'
                          : 'bg-up/10 text-up border-up/20'
                      )}>
                        {event.status}
                      </span>
                    </Td>
                    <Td className="text-surface-400 text-xs">{formatRelativeTime(event.triggeredAt)}</Td>
                    <Td className="text-surface-400 text-xs">{event.resolvedAt ? formatRelativeTime(event.resolvedAt) : '—'}</Td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <EmptyState
                      icon={Bell}
                      title="No incidents yet"
                      description="Triggered and resolved alerts will appear here once your rules begin evaluating checks."
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </Card>
      </div>

      <AlertRuleFormModal isOpen={isModalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
