'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MessageSquarePlus } from 'lucide-react';
import { api } from '@/lib/api';
import { RiskScoreBadge } from '@/components/ui/RiskScoreBadge';
import { formatDomain } from '@/lib/utils';

const queryClient = new QueryClient();

const statusColors: Record<string, string> = {
  AWAITING_HITL: 'text-cosora-orange',
  ESCALATED: 'text-cosora-danger',
  IN_PROGRESS: 'text-cosora-gold',
  COMPLETED: 'text-cosora-success',
};

function TasksContent() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['editor-tasks'],
    queryFn: async () => {
      const res = await api.get('/tasks');
      return res.data;
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="cosora-section-header flex-1">My Tasks</div>
        <Link href="/new-task" className="cosora-btn-primary flex items-center gap-2 text-sm">
          <MessageSquarePlus size={16} /> New Task
        </Link>
      </div>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="cosora-card p-8 text-center text-cosora-mid">No tasks assigned</div>
        ) : (
          tasks.map((task: {
            id: string; title: string; domain: string; currentStage: number;
            riskScore: number; status: string; priority: string; slaDeadline?: string;
          }) => (
            <Link key={task.id} href={`/tasks/${task.id}`}>
              <div className="cosora-card p-4 hover:border-cosora-orange/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-cosora-light font-medium">{task.title}</h3>
                    <p className="text-cosora-mid text-sm">{formatDomain(task.domain)}</p>
                  </div>
                  <span className={`text-xs font-medium ${statusColors[task.status] || 'text-cosora-mid'}`}>
                    {task.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex items-center gap-4 mt-3">
                  <span className="text-xs bg-cosora-orange/20 text-cosora-orange px-2 py-0.5 rounded">
                    L{task.currentStage}
                  </span>
                  <RiskScoreBadge score={task.riskScore} />
                  {task.priority !== 'NORMAL' && (
                    <span className="text-xs text-cosora-danger">{task.priority}</span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function EditorTasksPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TasksContent />
    </QueryClientProvider>
  );
}
