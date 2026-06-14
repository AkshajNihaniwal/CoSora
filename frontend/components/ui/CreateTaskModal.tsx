'use client';

import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { toast } from 'sonner';
import { formatDomain } from '@/lib/utils';

const DOMAINS = [
  'CONTRACT_MANAGEMENT',
  'LEGAL_COMPLIANCE',
  'LITIGATION',
  'IP_MANAGEMENT',
  'EMPLOYMENT_LABOUR',
  'CORPORATE_GOVERNANCE',
  'MERGERS_ACQUISITIONS',
  'DATA_PRIVACY',
  'RISK_MANAGEMENT',
  'REGULATOR_LIAISON',
  'POLICY_DRAFTING',
  'PROPERTY_LEASING',
] as const;

const schema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().min(10, 'Description required (min 10 chars)'),
  domain: z.enum(DOMAINS),
  priority: z.enum(['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL']).default('NORMAL'),
});

type FormData = z.infer<typeof schema>;

interface CreateTaskModalProps {
  open: boolean;
  onClose: () => void;
  onCreated?: () => void;
}

export function CreateTaskModal({ open, onClose, onCreated }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const user = useAuthStore((s) => s.user);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { domain: 'CONTRACT_MANAGEMENT', priority: 'NORMAL' },
  });

  if (!open || user?.role === 'REVIEWER') return null;

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      const res = await api.post('/tasks', { ...data, manualEntry: true });
      toast.success(`Task "${data.title}" created — AI orchestrator started`);
      reset();
      onCreated?.();
      onClose();
      if (res.data?.task?.id) {
        window.location.href = `/tasks/${res.data.task.id}`;
      }
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to create task';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="cosora-card w-full max-w-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-cosora-light font-semibold flex items-center gap-2">
            <Plus size={20} className="text-cosora-orange" /> Create New Task
          </h2>
          <button onClick={onClose} className="text-cosora-mid hover:text-cosora-light">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-cosora-mid text-sm block mb-1">Title</label>
            <input {...register('title')} placeholder="e.g. Vendor MSA Review" className="cosora-input" />
            {errors.title && <p className="text-cosora-danger text-xs mt-1">{errors.title.message}</p>}
          </div>

          <div>
            <label className="text-cosora-mid text-sm block mb-1">Description</label>
            <textarea
              {...register('description')}
              placeholder="Describe the legal matter, parties involved, and key requirements..."
              className="cosora-input min-h-[100px]"
            />
            {errors.description && <p className="text-cosora-danger text-xs mt-1">{errors.description.message}</p>}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-cosora-mid text-sm block mb-1">Legal Domain</label>
              <select {...register('domain')} className="cosora-input">
                {DOMAINS.map((d) => (
                  <option key={d} value={d}>{formatDomain(d)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-cosora-mid text-sm block mb-1">Priority</label>
              <select {...register('priority')} className="cosora-input">
                {['LOW', 'NORMAL', 'HIGH', 'URGENT', 'CRITICAL'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={loading} className="cosora-btn-primary flex-1 disabled:opacity-50">
              {loading ? 'Creating...' : 'Create Task'}
            </button>
            <button type="button" onClick={onClose} className="px-4 py-2 text-cosora-mid border border-cosora-smoke rounded-md">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function CreateTaskButton({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  if (user?.role === 'REVIEWER') return null;

  return (
    <>
      <button onClick={() => setOpen(true)} className="cosora-btn-primary flex items-center gap-2 text-sm">
        <Plus size={16} /> New Task
      </button>
      <CreateTaskModal open={open} onClose={() => setOpen(false)} onCreated={onCreated} />
    </>
  );
}
