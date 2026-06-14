'use client';

import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Link from 'next/link';
import { useEffect, useState } from 'react';
import { MessageSquarePlus } from 'lucide-react';
import { api } from '@/lib/api';
import { TaskCard, AuditLogRow } from '@/components/ui';
import { getSocket } from '@/lib/socket';

const queryClient = new QueryClient();

function DashboardContent() {
  const [liveTasks, setLiveTasks] = useState<unknown[]>([]);

  const { data, refetch } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: async () => {
      const [dashboard, tasks] = await Promise.all([
        api.get('/admin/dashboard'),
        api.get('/admin/workflow-overview'),
      ]);
      return { dashboard: dashboard.data, tasks: tasks.data };
    },
    refetchInterval: 30000,
  });

  useEffect(() => {
    const socket = getSocket();
    socket.on('task:update', () => refetch());
    socket.on('audit:new', () => refetch());
    return () => {
      socket.off('task:update');
      socket.off('audit:new');
    };
  }, [refetch]);

  useEffect(() => {
    if (data?.tasks) setLiveTasks(data.tasks);
  }, [data?.tasks]);

  const stats = data?.dashboard?.stats;
  const recentAudit = data?.dashboard?.recentAudit || [];

  const domains = [
    'CONTRACT_MANAGEMENT', 'LEGAL_COMPLIANCE', 'LITIGATION', 'IP_MANAGEMENT',
    'EMPLOYMENT_LABOUR', 'CORPORATE_GOVERNANCE', 'MERGERS_ACQUISITIONS', 'DATA_PRIVACY',
    'RISK_MANAGEMENT', 'REGULATOR_LIAISON', 'POLICY_DRAFTING', 'PROPERTY_LEASING',
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div className="cosora-section-header flex-1">Admin Dashboard</div>
        <Link
          href="/new-task"
          className="cosora-btn-primary flex items-center gap-2 text-sm ml-4 shrink-0"
        >
          <MessageSquarePlus size={16} /> New Task
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Active Tasks', value: stats?.activeTasks ?? '—', color: 'text-cosora-orange' },
          { label: 'Pending HITL', value: stats?.hitlPending ?? '—', color: 'text-cosora-orange' },
          { label: 'Overdue SLA', value: stats?.overdueSla ?? '—', color: 'text-cosora-danger' },
          { label: 'Completed Today', value: stats?.completedToday ?? '—', color: 'text-cosora-success' },
        ].map((s) => (
          <div key={s.label} className="cosora-card p-4">
            <p className="text-cosora-mid text-sm">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      <div>
        <h2 className="text-cosora-light font-semibold mb-4">Workflow Overview</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {domains.map((domain) => {
            const domainTasks = (liveTasks as Array<{
              id: string; title: string; domain: string; currentStage: number;
              riskScore: number; status: string; slaDeadline?: string;
              assignedTo?: { name: string };
            }>).filter((t) => t.domain === domain);

            return (
              <div key={domain} className="cosora-card p-3">
                <p className="text-cosora-gold text-xs font-medium mb-2 truncate">
                  {domain.replace(/_/g, ' ')}
                </p>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {domainTasks.length === 0 ? (
                    <p className="text-cosora-mid text-xs">No active tasks</p>
                  ) : (
                    domainTasks.map((task) => (
                      <Link key={task.id} href={`/tasks/${task.id}`}>
                        <TaskCard
                          title={task.title}
                          domain={task.domain}
                          stage={task.currentStage}
                          riskScore={task.riskScore}
                          editorName={task.assignedTo?.name}
                          slaDeadline={task.slaDeadline}
                          status={task.status}
                        />
                      </Link>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-cosora-light font-semibold mb-4">Recent Audit Log</h2>
        <div className="cosora-card overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-cosora-orange/10 text-cosora-orange text-xs">
                <th className="px-3 py-2">Timestamp</th>
                <th className="px-3 py-2">Event</th>
                <th className="px-3 py-2">Actor</th>
                <th className="px-3 py-2">Task</th>
                <th className="px-3 py-2">Description</th>
              </tr>
            </thead>
            <tbody>
              {recentAudit.map((entry: {
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
    </div>
  );
}

export default function DashboardPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <DashboardContent />
    </QueryClientProvider>
  );
}
