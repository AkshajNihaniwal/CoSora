'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { PipelineVisualiser } from '@/components/ui/PipelineVisualiser';
import { AgentStatusCard, CalloutBox } from '@/components/ui';
import { DocumentPanel } from '@/components/ui/DocumentPanel';
import { TaskAnalysisPanel } from '@/components/ui/TaskAnalysisPanel';
import { TaskAssistantChat } from '@/components/ui/TaskAssistantChat';
import { TaskAnalysisSummary } from '@/lib/legalAnalysis';
import { toast } from 'sonner';

const queryClient = new QueryClient();

const AGENT_MAP: Record<string, string> = {
  CONTRACT_MANAGEMENT: 'contractAgent',
  LEGAL_COMPLIANCE: 'complianceAgent',
  LITIGATION: 'litigationAgent',
  IP_MANAGEMENT: 'ipAgent',
  EMPLOYMENT_LABOUR: 'employmentAgent',
  CORPORATE_GOVERNANCE: 'governanceAgent',
  MERGERS_ACQUISITIONS: 'maAgent',
  DATA_PRIVACY: 'privacyAgent',
  RISK_MANAGEMENT: 'riskAgent',
  REGULATOR_LIAISON: 'regulatorAgent',
  POLICY_DRAFTING: 'policyAgent',
  PROPERTY_LEASING: 'propertyAgent',
};

function TaskWorkContent() {
  const params = useParams();
  const taskId = params.taskId as string;
  const qc = useQueryClient();
  const [docContent, setDocContent] = useState('');
  const [agentOutput, setAgentOutput] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const { data: task } = useQuery({
    queryKey: ['editor-task', taskId],
    queryFn: async () => (await api.get(`/tasks/${taskId}`)).data,
  });

  const runAgent = async () => {
    if (!task) return;
    setLoading(true);
    try {
      const agentName = AGENT_MAP[task.domain] || 'contractAgent';
      const res = await api.post(`/agents/run/${agentName}`, { taskId, stage: task.currentStage });
      const jobId = res.data.jobId;
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const status = await api.get(`/agents/status/${jobId}`);
        if (status.data.status === 'completed') {
          clearInterval(poll);
          setAgentOutput(status.data.result);
          setDocContent((status.data.result as { content?: string })?.content || '');
          toast.success('AI draft generated');
          setLoading(false);
          qc.invalidateQueries({ queryKey: ['editor-task', taskId] });
        } else if (status.data.status === 'failed' || attempts > 20) {
          clearInterval(poll);
          toast.error('Agent run failed');
          setLoading(false);
        }
      }, 1000);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Agent failed';
      toast.error(msg);
      setLoading(false);
    }
  };

  const submitForApproval = async () => {
    try {
      await api.post(`/tasks/${taskId}/advance`);
      toast.success('Submitted for HITL approval');
      qc.invalidateQueries({ queryKey: ['editor-task', taskId] });
    } catch {
      toast.error('Submit failed');
    }
  };

  if (!task) return <div className="text-cosora-mid animate-pulse">Loading...</div>;

  const analysis = task.analysisSummary as TaskAnalysisSummary | null;

  return (
    <div className="space-y-6">
      <h1 className="text-cosora-light text-xl font-semibold">{task.title}</h1>
      <PipelineVisualiser currentStage={task.currentStage} />

      {analysis && <TaskAnalysisPanel analysis={analysis} compact />}

      <DocumentPanel taskId={taskId} documents={task.documents} />

      {task.domain === 'CORPORATE_GOVERNANCE' && (
        <CalloutBox label="Manual Input Required">
          Enter board decision data before running the governance agent.
        </CalloutBox>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="cosora-card p-4">
            <textarea
              value={docContent || task.description}
              onChange={(e) => setDocContent(e.target.value)}
              className="cosora-input min-h-[300px] font-mono text-sm resize-y"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {task.currentStage === 2 && (
              <button onClick={runAgent} disabled={loading} className="cosora-btn-primary text-sm disabled:opacity-50">
                {loading ? 'Generating...' : 'Generate AI Draft'}
              </button>
            )}
            {task.currentStage === 3 && (
              <button onClick={submitForApproval} className="cosora-btn-primary text-sm">
                Submit for Approval
              </button>
            )}
          </div>
        </div>
        <div className="space-y-4">
          {agentOutput && (
            <AgentStatusCard
              agentName={AGENT_MAP[task.domain]}
              action="Draft generated"
              stage={task.currentStage}
              confidenceScore={agentOutput.confidenceScore as number}
              ragSources={agentOutput.ragSources as Array<{ title: string; docType: string }>}
            />
          )}
        </div>
      </div>
      <TaskAssistantChat taskId={taskId} />
    </div>
  );
}

export default function EditorTaskWorkPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <TaskWorkContent />
    </QueryClientProvider>
  );
}
