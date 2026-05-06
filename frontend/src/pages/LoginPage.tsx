import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { Activity, Mail, Lock } from 'lucide-react';
import { authApi } from '@/api/services';
import { useAuthStore } from '@/store';
import { Button, Input, useToast } from '@/components/ui';
import { extractErrorMessage } from '@/api/client';

const schema = z.object({
  email:    z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});
type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();
  const { addToast } = useToast();

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: 'alex@acme.io', password: 'password123' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const tokens = await authApi.login(data);
      localStorage.setItem('pw_access_token', tokens.accessToken);
      const user = await authApi.me();
      setAuth(user, tokens.accessToken);
      navigate('/');
    } catch (err) {
      localStorage.removeItem('pw_access_token');
      addToast('error', extractErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex bg-surface-950">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col items-center justify-center p-12 overflow-hidden">
        {/* Background grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(14,165,233,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(14,165,233,0.03)_1px,transparent_1px)] bg-[size:40px_40px]" />
        {/* Glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[400px] w-[400px] rounded-full bg-pulse-500/10 blur-[80px]" />
        <div className="relative z-10 max-w-md text-center">
          <div className="mx-auto mb-8 flex h-16 w-16 items-center justify-center rounded-2xl bg-pulse-500 shadow-2xl shadow-pulse-500/40">
            <Activity className="h-8 w-8 text-white" />
          </div>
          <h2 className="font-display text-4xl font-800 text-white leading-tight mb-4">
            Monitor everything.<br />Miss nothing.
          </h2>
          <p className="text-surface-400 text-lg leading-relaxed">
            PulseWatch gives your team real-time visibility into API health, uptime, and performance — all in one place.
          </p>
          {/* Stats row */}
          <div className="mt-12 grid grid-cols-3 gap-6">
            {[
              { label: 'Avg uptime', value: '99.97%' },
              { label: 'Endpoints', value: '10K+' },
              { label: 'Alerts fired', value: '< 30s' },
            ].map(stat => (
              <div key={stat.label} className="rounded-xl border border-surface-800 bg-surface-900/60 p-4 backdrop-blur-sm">
                <p className="font-display text-xl font-700 text-pulse-400">{stat.value}</p>
                <p className="mt-0.5 text-xs text-surface-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2 bg-white dark:bg-surface-900">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:hidden flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-pulse-500">
              <Activity className="h-4 w-4 text-white" />
            </div>
            <span className="font-display text-xl font-700 text-surface-900 dark:text-white">PulseWatch</span>
          </div>

          <h1 className="font-display text-3xl font-700 text-surface-900 dark:text-white mb-2">Welcome back</h1>
          <p className="text-surface-500 mb-8">Sign in to your monitoring dashboard</p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              label="Email address"
              type="email"
              icon={Mail}
              placeholder="you@company.io"
              error={errors.email?.message}
              {...register('email')}
            />
            <Input
              label="Password"
              type="password"
              icon={Lock}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <Button type="submit" loading={isSubmitting} className="w-full mt-2" size="lg">
              Sign in
            </Button>
          </form>

          <div className="mt-4 rounded-lg border border-pulse-200/50 bg-pulse-50/50 dark:border-pulse-500/20 dark:bg-pulse-500/5 px-4 py-3">
            <p className="text-xs text-pulse-700 dark:text-pulse-400">
              <span className="font-600">Demo credentials:</span> alex@acme.io / password123
            </p>
          </div>

          <p className="mt-6 text-center text-sm text-surface-400">
            Don't have an account?{' '}
            <Link to="/register" className="font-600 text-pulse-600 hover:text-pulse-500 dark:text-pulse-400">
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
