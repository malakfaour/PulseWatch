import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Select, Input, Button, useToast } from '@/components/ui';
import { useCreateAlertRule, useEndpoints } from '@/hooks';
import { extractErrorMessage } from '@/api/client';
import type { AlertConditionType } from '@/types';

const CONDITION_OPTIONS: { value: AlertConditionType; label: string }[] = [
  { value: 'STATUS_DOWN',  label: 'Status is DOWN' },
  { value: 'LATENCY_GT',   label: 'Latency greater than (ms)' },
];

const schema = z.object({
  endpointId:    z.string().min(1, 'Select an endpoint'),
  conditionType: z.enum(['STATUS_DOWN', 'LATENCY_GT']),
  threshold:     z.coerce.number().optional(),
}).refine(d => {
  if (d.conditionType !== 'STATUS_DOWN' && !d.threshold) return false;
  return true;
}, { message: 'Threshold is required for this condition', path: ['threshold'] });

type FormData = z.infer<typeof schema>;

interface Props { isOpen: boolean; onClose: () => void; }

export function AlertRuleFormModal({ isOpen, onClose }: Props) {
  const { addToast } = useToast();
  const createMutation = useCreateAlertRule();
  const { data: endpointsPage } = useEndpoints({ pageSize: 100 });

  const { register, handleSubmit, watch, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { conditionType: 'STATUS_DOWN' },
  });

  const conditionType = watch('conditionType');
  const needsThreshold = conditionType !== 'STATUS_DOWN';

  const endpointOptions = [
    { value: '', label: 'Select endpoint...' },
    ...(endpointsPage?.items.map(ep => ({ value: ep.id, label: ep.name })) ?? []),
  ];

  const onSubmit = async (data: FormData) => {
    try {
      await createMutation.mutateAsync({
        endpointId: data.endpointId,
        conditionType: data.conditionType,
        threshold: needsThreshold ? data.threshold : undefined,
      });
      addToast('success', 'Alert rule created');
      reset();
      onClose();
    } catch (err) {
      addToast('error', extractErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Alert Rule">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Select label="Endpoint" options={endpointOptions} error={errors.endpointId?.message} {...register('endpointId')} />
        <Select label="Condition" options={CONDITION_OPTIONS} error={errors.conditionType?.message} {...register('conditionType')} />
        {needsThreshold && (
          <Input
            label="Latency threshold (ms)"
            type="number"
            placeholder="e.g. 500"
            error={errors.threshold?.message}
            {...register('threshold')}
          />
        )}
        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>Create Rule</Button>
        </div>
      </form>
    </Modal>
  );
}
