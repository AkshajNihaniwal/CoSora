'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import { Sidebar } from '@/components/layout/Sidebar';
import { TopBar } from '@/components/layout/TopBar';
import { MobileNav } from '@/components/layout/MobileNav';
import { PipelineVisualiser } from '@/components/ui/PipelineVisualiser';
import { RiskScoreBadge } from '@/components/ui/RiskScoreBadge';
import { DocumentPanel } from '@/components/ui/DocumentPanel';
import { TaskAnalysisPanel } from '@/components/ui/TaskAnalysisPanel';
import { TaskAssistantChat } from '@/components/ui/TaskAssistantChat';
import { AuditLogRow, CalloutBox, AgentStatusCard } from '@/components/ui';
import { TaskAnalysisSummary } from '@/lib/legalAnalysis';
import { formatDomain } from '@/lib/utils';

const queryClient = new QueryClient();

function TaskDetailInner() {
  const params = useParams();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const taskId = params.taskId as string;

  useEffect(() => {
    if (user?.role === 'REVIEWER') {
      router.replace(`/review/${taskId}`);
    }
  }, [user, taskId, router]);

  const { data: task } = useQuery({
    queryKey: ['task-detail', taskId],
    queryFn: async () => (await api.get(`/tasks/${taskId}`)).data,
  });

  if (!task) return <div className="text-cosora-mid animate-pulse p-6">Loading task...</div>;

  const isEditor = user?.role === 'EDITOR';
  const isAdmin = user?.role === 'ADMIN';
  const analysis = task.analysisSummary as TaskAnalysisSummary | null;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="text-cosora-mid hover:text-cosora-light text-sm">
          ← Back
        </button>
        <h1 className="text-cosora-light text-xl font-semibold">{task.title}</h1>
      </div>

      <PipelineVisualiser currentStage={task.currentStage} />

      <div className="grid md:grid-cols-3 gap-4">
        <div className="cosora-card p-4">
          <p className="text-cosora-mid text-xs">Domain</p>
          <p className="text-cosora-light">{formatDomain(task.domain)}</p>
        </div>
        <div className="cosora-card p-4">
          <p className="text-cosora-mid text-xs">Status</p>
          <p className="text-cosora-light">{task.status}</p>
        </div>
        <div className="cosora-card p-4">
          <p className="text-cosora-mid text-xs">Risk (India)</p>
          <RiskScoreBadge
            score={task.riskScore}
            preciseScore={task.riskScorePrecise}
            rating={analysis?.riskBreakdown?.rating}
            showBreakdown
          />
        </div>
      </div>

      {analysis && <TaskAnalysisPanel analysis={analysis} />}

      <DocumentPanel taskId={taskId} documents={task.documents} />

      {task.status === 'AWAITING_HITL' && user?.role === 'ADMIN' && (
        <CalloutBox label="HITL Gate">
          Visit the HITL Queue to approve or reject this task at L{task.currentStage}.
        </CalloutBox>
      )}

      {isEditor && (
        <button
          onClick={() => router.push(`/editor/tasks/${taskId}`)}
          className="cosora-btn-primary text-sm"
        >
          Open Work View
        </button>
      )}

      {task.agentLogs?.slice(0, 5).map((log: {
        id: string; agentName: string; action: string; stage: number; confidenceScore?: number;
      }) => (
        <AgentStatusCard
          key={log.id}
          agentName={log.agentName}
          action={log.action}
          stage={log.stage}
          confidenceScore={log.confidenceScore}
        />
      ))}

      {task.auditLogs?.length > 0 && (
        <div className="cosora-card overflow-x-auto">
          <table className="w-full">
            <tbody>
              {task.auditLogs.map((entry: {
                id: string; createdAt: string; eventType: string; description: string;
                actor?: { name: string; role: string };
              }) => (
                <AuditLogRow
                  key={entry.id}
                  timestamp={entry.createdAt}
                  eventType={entry.eventType}
                  actorName={entry.actor?.name}
                  actorRole={entry.actor?.role}
                  description={entry.description}
                />
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(isEditor || isAdmin) && <TaskAssistantChat taskId={taskId} />}
    </div>
  );
}

export default function TaskDetailPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <div className="flex min-h-screen bg-cosora-black">
      <Sidebar />
      <div className="flex-1 flex flex-col pb-16 md:pb-0">
        <TopBar title="Task Detail" />
        <main className="flex-1 p-6">
          <QueryClientProvider client={queryClient}>
            <TaskDetailInner />
          </QueryClientProvider>
        </main>
      </div>
      {user?.role === 'ADMIN' && <MobileNav />}
    </div>
  );
}
