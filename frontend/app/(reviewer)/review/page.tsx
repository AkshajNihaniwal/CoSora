'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { CalloutBox } from '@/components/ui';
import { formatDomain } from '@/lib/utils';

const queryClient = new QueryClient();

function ReviewContent() {
  const { data: tasks = [] } = useQuery({
    queryKey: ['review-tasks'],
    queryFn: async () => (await api.get('/tasks')).data,
  });

  return (
    <div className="space-y-6">
      <div className="cosora-section-header flex items-center gap-2">
        <Eye size={18} className="text-cosora-gold" />
        Review Queue — Read Only
      </div>

      <CalloutBox label="Reviewer Access">
        Browse tasks and documents in your assigned domains. You cannot create, edit, approve, or modify any records.
      </CalloutBox>

      <div className="space-y-3">
        {tasks.length === 0 ? (
          <div className="cosora-card p-8 text-center text-cosora-mid">No tasks in your review scope</div>
        ) : (
          tasks.map((task: {
            id: string; title: string; domain: string; dueAt?: string; currentStage: number;
            assignedTo?: { name: string };
          }) => (
            <Link key={task.id} href={`/review/${task.id}`}>
              <div className="cosora-card p-4 hover:border-cosora-gold/50 transition-colors">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-cosora-light font-medium">{task.title}</h3>
                    <p className="text-cosora-mid text-sm">{formatDomain(task.domain)}</p>
                    <p className="text-cosora-mid text-xs mt-2">
                      Editor: {task.assignedTo?.name || 'Unassigned'}
                      {task.dueAt && ` · Due: ${new Date(task.dueAt).toLocaleDateString()}`}
                    </p>
                  </div>
                  <span className="text-xs bg-cosora-orange/20 text-cosora-orange px-2 py-0.5 rounded">
                    L{task.currentStage}
                  </span>
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}

export default function ReviewQueuePage() {
  return (
    <QueryClientProvider client={queryClient}>
      <ReviewContent />
    </QueryClientProvider>
  );
}
