'use client';

import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { api } from '@/lib/api';
import { PipelineVisualiser } from '@/components/ui/PipelineVisualiser';
import { RiskScoreBadge } from '@/components/ui/RiskScoreBadge';
import { DocumentPanel } from '@/components/ui/DocumentPanel';
import { CalloutBox } from '@/components/ui';
import { formatDomain } from '@/lib/utils';

const queryClient = new QueryClient();

function DocumentReviewContent() {
  const params = useParams();
  const taskId = params.taskId as string;

  const { data: task } = useQuery({
    queryKey: ['review-task', taskId],
    queryFn: async () => (await api.get(`/tasks/${taskId}`)).data,
  });

  if (!task) return <div className="text-cosora-mid animate-pulse">Loading...</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Eye size={20} className="text-cosora-gold" />
        <h1 className="text-cosora-light text-xl font-semibold">{task.title}</h1>
        <span className="text-xs bg-cosora-gold/20 text-cosora-gold px-2 py-0.5 rounded">Read-only</span>
      </div>

      <CalloutBox label="Reviewer Access">
        You have view-only access. You cannot create tasks, edit documents, add comments, or submit approvals.
        Contact an Editor or Admin to request changes.
      </CalloutBox>

      <PipelineVisualiser currentStage={task.currentStage} />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="cosora-card p-4">
          <p className="text-cosora-mid text-xs">Domain</p>
          <p className="text-cosora-light">{formatDomain(task.domain)}</p>
        </div>
        <div className="cosora-card p-4">
          <p className="text-cosora-mid text-xs">Status</p>
          <p className="text-cosora-light">{task.status.replace(/_/g, ' ')}</p>
        </div>
        <div className="cosora-card p-4">
          <p className="text-cosora-mid text-xs">Risk</p>
          <RiskScoreBadge score={task.riskScore} />
        </div>
      </div>

      <DocumentPanel taskId={taskId} documents={task.documents} readOnly />

      {task.comments?.length > 0 && (
        <div className="cosora-card p-4">
          <h3 className="text-cosora-light font-medium mb-3">Existing Comments (read-only)</h3>
          {task.comments.map((c: { id: string; text: string; clauseRef?: string; authorRole?: string }) => (
            <div key={c.id} className="border-b border-cosora-smoke py-2 last:border-0">
              {c.clauseRef && <span className="text-cosora-gold text-xs">{c.clauseRef}</span>}
              <p className="text-cosora-mid text-sm">{c.text}</p>
              {c.authorRole && <span className="text-cosora-mid text-xs">{c.authorRole}</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function DocumentReviewPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DocumentReviewContent />
    </QueryClientProvider>
  );
}
