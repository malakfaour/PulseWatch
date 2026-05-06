import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Modal, Input, Select, Button, useToast } from '@/components/ui';
import { useCreateEndpoint, useUpdateEndpoint } from '@/hooks';
import { extractErrorMessage } from '@/api/client';
import type { Endpoint } from '@/types';

const schema = z.object({
  name:                z.string().min(1, 'Name is required'),
  url:                 z.string().url('Must be a valid URL'),
  method:              z.enum(['GET', 'POST']),
  intervalSeconds:     z.coerce.number().min(10).max(86400),
  timeoutMs:           z.coerce.number().min(500).max(30000),
  expectedStatusCode:  z.coerce.number().min(100).max(599),
});
type FormData = z.infer<typeof schema>;

const METHOD_OPTIONS: { value: FormData['method']; label: string }[] = [
  { value: 'GET',    label: 'GET' },
  { value: 'POST',   label: 'POST' },
];

const INTERVAL_OPTIONS = [
  { value: '30',   label: 'Every 30 seconds' },
  { value: '60',   label: 'Every 1 minute' },
  { value: '120',  label: 'Every 2 minutes' },
  { value: '300',  label: 'Every 5 minutes' },
  { value: '600',  label: 'Every 10 minutes' },
  { value: '1800', label: 'Every 30 minutes' },
  { value: '3600', label: 'Every hour' },
];

interface Props {
  isOpen: boolean;
  onClose: () => void;
  endpoint?: Endpoint;
}

export function EndpointFormModal({ isOpen, onClose, endpoint }: Props) {
  const { addToast } = useToast();
  const createMutation = useCreateEndpoint();
  const updateMutation = useUpdateEndpoint(endpoint?.id ?? '');
  const isEditing = !!endpoint;

  const defaultValues: FormData = endpoint ? {
    name: endpoint.name,
    url: endpoint.url,
    method: endpoint.method === 'POST' ? 'POST' : 'GET',
    intervalSeconds: endpoint.intervalSeconds,
    timeoutMs: endpoint.timeoutMs,
    expectedStatusCode: endpoint.expectedStatusCode,
  } : {
    name: '',
    url: '',
    method: 'GET',
    intervalSeconds: 60,
    timeoutMs: 5000,
    expectedStatusCode: 200,
  };

  const { register, handleSubmit, formState: { errors, isSubmitting }, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues,
  });

  const onSubmit = async (data: FormData) => {
    try {
      if (isEditing) {
        await updateMutation.mutateAsync(data);
        addToast('success', `"${data.name}" updated successfully`);
      } else {
        await createMutation.mutateAsync(data);
        addToast('success', `"${data.name}" added to monitoring`);
      }
      reset();
      onClose();
    } catch (err) {
      addToast('error', extractErrorMessage(err));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? 'Edit Endpoint' : 'Add New Endpoint'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input label="Name" placeholder="Payment API" error={errors.name?.message} {...register('name')} />
        <Input label="URL" placeholder="https://api.example.com/health" error={errors.url?.message} {...register('url')} />

        <div className="grid grid-cols-2 gap-4">
          <Select
            label="Method"
            options={METHOD_OPTIONS}
            error={errors.method?.message}
            {...register('method')}
          />
          <Select
            label="Check Interval"
            options={INTERVAL_OPTIONS}
            error={errors.intervalSeconds?.message}
            {...register('intervalSeconds')}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input label="Timeout (ms)" type="number" placeholder="5000" error={errors.timeoutMs?.message} {...register('timeoutMs')} />
          <Input label="Expected Status" type="number" placeholder="200" error={errors.expectedStatusCode?.message} {...register('expectedStatusCode')} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={isSubmitting}>{isEditing ? 'Save Changes' : 'Add Endpoint'}</Button>
        </div>
      </form>
    </Modal>
  );
}
