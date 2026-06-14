'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { AuditLogRow } from '@/components/ui';
import { Download, ShieldCheck, ShieldAlert } from 'lucide-react';
import { toast } from 'sonner';

const queryClient = new QueryClient();

function AuditContent() {
  const [eventType, setEventType] = useState('');

  const { data: chain } = useQuery({
    queryKey: ['audit-chain'],
    queryFn: async () => {
      const res = await api.get('/audit/verify');
      return res.data as { valid: boolean; brokenAt?: string };
    },
  });

  const { data: auditData } = useQuery({
    queryKey: ['audit-log', eventType],
    queryFn: async () => {
      const params = eventType ? { eventType } : {};
      const res = await api.get('/audit', { params });
      return res.data;
    },
  });

  const exportLog = async () => {
    try {
      const res = await api.get('/audit/export', { responseType: 'blob' });
      const url = URL.createObjectURL(new Blob([JSON.stringify(res.data, null, 2)]));
      const a = document.createElement('a');
      a.href = url;
      a.download = `cosora-audit-${Date.now()}.json`;
      a.click();
      toast.success('Audit log exported');
    } catch {
      toast.error('Export failed');
    }
  };

  const entries = auditData?.entries || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="cosora-section-header flex-1">Audit Log</div>
        <button onClick={exportLog} className="cosora-btn-primary flex items-center gap-2 ml-4 text-sm">
          <Download size={16} /> Export
        </button>
      </div>

      <div
        className={`cosora-card p-4 flex items-center gap-3 ${
          chain?.valid ? 'border-cosora-success' : 'border-cosora-danger'
        }`}
      >
        {chain?.valid ? (
          <>
            <ShieldCheck className="text-cosora-success" size={24} />
            <span className="text-cosora-success">Chain integrity verified — all entries valid</span>
          </>
        ) : (
          <>
            <ShieldAlert className="text-cosora-danger" size={24} />
            <span className="text-cosora-danger">
              Integrity breach detected{chain?.brokenAt ? ` at entry ${chain.brokenAt}` : ''}
            </span>
          </>
        )}
      </div>

      <div className="flex gap-4">
        <select
          value={eventType}
          onChange={(e) => setEventType(e.target.value)}
          className="cosora-input max-w-xs"
        >
          <option value="">All event types</option>
          {['TASK_CREATED', 'HITL_APPROVAL', 'HITL_REJECTION', 'USER_LOGIN', 'SLA_ESCALATION', 'AI_DRAFT_GENERATED'].map(
            (t) => (
              <option key={t} value={t}>
                {t.replace(/_/g, ' ')}
              </option>
            )
          )}
        </select>
      </div>

      <div className="cosora-card overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-cosora-orange/10 text-cosora-orange text-xs">
              <th className="px-3 py-2 text-left">Timestamp</th>
              <th className="px-3 py-2 text-left">Event</th>
              <th className="px-3 py-2 text-left">Actor</th>
              <th className="px-3 py-2 text-left">Task</th>
              <th className="px-3 py-2 text-left">Description</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry: {
              id: string; createdAt: string; eventType: string; description: string;
              actor?: { name: string; role: string }; task?: { title: string };
            }) => (
              <AuditLogRow
                key={entry.id}
                timestamp={entry.createdAt}
                eventType={entry.eventType}
                actorName={entry.actor?.name}
                actorRole={entry.actor?.role}
                taskTitle={entry.task?.title}
                description={entry.description}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function AuditPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuditContent />
    </QueryClientProvider>
  );
}
