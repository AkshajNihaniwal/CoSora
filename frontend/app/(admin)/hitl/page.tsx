'use client';

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { HITLModal } from '@/components/ui/HITLModal';
import { RiskScoreBadge } from '@/components/ui/RiskScoreBadge';
import { formatDomain } from '@/lib/utils';

const queryClient = new QueryClient();

interface PendingTask {
  id: string;
  title: string;
  domain: string;
  currentStage: number;
  riskScore: number;
  priority: string;
  slaDeadline?: string;
  assignedTo?: { name: string };
  status: string;
}

function HITLContent() {
  const [selected, setSelected] = useState<PendingTask | null>(null);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const { data: pending = [], refetch } = useQuery({
    queryKey: ['hitl-pending'],
    queryFn: async () => {
      const res = await api.get('/approvals/pending');
      return res.data as PendingTask[];
    },
    refetchInterval: 15000,
  });

  return (
    <div className="space-y-6">
      <div className="cosora-section-header">HITL Approval Queue</div>

      {pending.length === 0 ? (
        <div className="cosora-card p-8 text-center text-cosora-mid">No pending approvals</div>
      ) : (
        <div className="space-y-4">
          {pending.map((task) => (
            <div
              key={task.id}
              className={`cosora-card p-4 hitl-pulse ${task.priority === 'CRITICAL' ? 'border-cosora-danger' : ''}`}
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h3 className="text-cosora-light font-medium">{task.title}</h3>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="text-xs bg-cosora-smoke text-cosora-gold px-2 py-0.5 rounded">
                      {formatDomain(task.domain)}
                    </span>
                    <span className="text-xs bg-cosora-orange/20 text-cosora-orange px-2 py-0.5 rounded">
                      L{task.currentStage}
                    </span>
                    {task.priority === 'CRITICAL' && (
                      <span className="text-xs bg-cosora-danger/20 text-cosora-danger px-2 py-0.5 rounded">
                        CRITICAL
                      </span>
                    )}
                  </div>
                  <p className="text-cosora-mid text-sm mt-2">
                    Editor: {task.assignedTo?.name || 'Unassigned'}
                  </p>
                  <div className="mt-2">
                    <RiskScoreBadge score={task.riskScore} />
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  {[6, 7, 8].includes(task.currentStage) && isMobile && (
                    <p className="text-cosora-gold text-xs">Biometric approval</p>
                  )}
                  <Link
                    href={`/tasks/${task.id}`}
                    className="text-cosora-gold text-xs hover:text-cosora-orange"
                  >
                    View Document →
                  </Link>
                  <button
                    onClick={() => setSelected(task)}
                    className="cosora-btn-primary text-sm"
                  >
                    Review
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {selected && (
        <HITLModal
          taskId={selected.id}
          stage={selected.currentStage}
          title={selected.title}
          riskScore={selected.riskScore}
          isOpen={!!selected}
          onClose={() => setSelected(null)}
          onSuccess={() => refetch()}
          isMobile={isMobile}
        />
      )}
    </div>
  );
}

export default function HITLPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <HITLContent />
    </QueryClientProvider>
  );
}
