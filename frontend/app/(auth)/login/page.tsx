'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { CoSoraLogo } from '@/components/layout/CoSoraLogo';
import { toast } from 'sonner';

const schema = z.object({
  userId: z.string().min(1, 'User ID required'),
  password: z.string().min(1, 'Password required'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/auth/login', {
        userId: data.userId.toUpperCase(),
        password: data.password,
      });
      setUser(res.data.user);
      toast.success(`Welcome, ${res.data.user.name}`);

      if (res.data.user.role === 'ADMIN') router.push('/dashboard');
      else if (res.data.user.role === 'EDITOR') router.push('/tasks');
      else router.push('/review');
    } catch {
      toast.error('Invalid User ID or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cosora-black p-4">
      <div className="cosora-card w-full max-w-md p-8">
        <div className="text-center mb-10 flex flex-col items-center gap-4">
          <CoSoraLogo variant="login" className="items-center" />
          <p className="text-cosora-mid text-base mt-2">Enterprise Legal AI Platform</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-cosora-mid text-sm block mb-1">User ID</label>
            <input
              {...register('userId')}
              placeholder="XXXX-XXXX-XXXX-XXXX"
              className="cosora-input uppercase tracking-wider"
            />
            {errors.userId && <p className="text-cosora-danger text-xs mt-1">{errors.userId.message}</p>}
          </div>
          <div>
            <label className="text-cosora-mid text-sm block mb-1">Password</label>
            <input {...register('password')} type="password" className="cosora-input" />
            {errors.password && <p className="text-cosora-danger text-xs mt-1">{errors.password.message}</p>}
          </div>
          <button type="submit" disabled={loading} className="cosora-btn-primary w-full disabled:opacity-50">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-cosora-mid text-xs text-center mt-6">
          Demo password: CoSora2024!
        </p>
      </div>
    </div>
  );
}
