import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { User, Mail, Lock, Activity } from 'lucide-react';
import { authApi } from '@/api/services';
import { Button, Input, useToast } from '@/components/ui';
import { extractErrorMessage } from '@/api/client';

const schema = z.object({
  name:     z.string().min(2, 'Name must be at least 2 characters'),
  email:    z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirm:  z.string(),
}).refine(d => d.password === d.confirm, { message: "Passwords don't match", path: ['confirm'] });
type FormData = z.infer<typeof schema>;

export default function RegisterPage() {
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      await authApi.register({ name: data.name, email: data.email, password: data.password });
      addToast('success', 'Account created! Please sign in.');
      navigate('/login');
    } catch (err) {
      addToast('error', extractErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 dark:bg-surface-950 p-8">
      <div className="w-full max-w-md animate-fade-in">
        <div className="flex items-center gap-3 mb-8">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pulse-500">
            <Activity className="h-4 w-4 text-white" />
          </div>
          <span className="font-display text-xl font-700 text-surface-900 dark:text-white">PulseWatch</span>
        </div>

        <h1 className="font-display text-3xl font-700 text-surface-900 dark:text-white mb-2">Create your account</h1>
        <p className="text-surface-500 mb-8">Start monitoring your APIs in minutes</p>

        <div className="rounded-xl border border-surface-200 bg-white dark:border-surface-700 dark:bg-surface-900 p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Full name" icon={User} placeholder="Alex Chen" error={errors.name?.message} {...register('name')} />
            <Input label="Email address" type="email" icon={Mail} placeholder="you@company.io" error={errors.email?.message} {...register('email')} />
            <Input label="Password" type="password" icon={Lock} placeholder="Min. 8 characters" error={errors.password?.message} {...register('password')} />
            <Input label="Confirm password" type="password" icon={Lock} placeholder="Re-enter password" error={errors.confirm?.message} {...register('confirm')} />
            <Button type="submit" loading={isSubmitting} className="w-full" size="lg">
              Create account
            </Button>
          </form>
        </div>

        <p className="mt-6 text-center text-sm text-surface-400">
          Already have an account?{' '}
          <Link to="/login" className="font-600 text-pulse-600 hover:text-pulse-500 dark:text-pulse-400">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
