'use client';

import { useQuery } from '@tanstack/react-query';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { EmailClassificationBadge } from '@/components/ui';

const queryClient = new QueryClient();

function EmailContent() {
  const { data: emails = [] } = useQuery({
    queryKey: ['emails'],
    queryFn: async () => {
      const res = await api.get('/email');
      return res.data;
    },
    refetchInterval: 30000,
  });

  return (
    <div className="space-y-6">
      <div className="cosora-section-header">Email Monitor</div>
      <p className="text-cosora-mid text-sm">Inbound email log — no outbound reply capability in this view.</p>

      <div className="cosora-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-cosora-orange/10 text-cosora-orange text-xs">
              <th className="px-4 py-2 text-left">Sender</th>
              <th className="px-4 py-2 text-left">Subject</th>
              <th className="px-4 py-2 text-left">Classification</th>
              <th className="px-4 py-2 text-left">Time</th>
              <th className="px-4 py-2 text-left">Task</th>
            </tr>
          </thead>
          <tbody>
            {emails.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center text-cosora-mid">
                  No emails recorded yet
                </td>
              </tr>
            ) : (
              emails.map((email: {
                id: string; senderEmail: string; subject: string;
                classification: string; createdAt: string; adminNotified: boolean;
                task?: { title: string };
              }) => {
                const isUrgent =
                  email.classification === 'REGULATORY_GOVERNMENT' ||
                  email.classification === 'COURT_LITIGATION';
                return (
                  <tr
                    key={email.id}
                    className={`border-b border-cosora-smoke ${isUrgent ? 'bg-cosora-danger/5' : ''}`}
                  >
                    <td className="px-4 py-3 text-cosora-light">{email.senderEmail}</td>
                    <td className="px-4 py-3 text-cosora-light">{email.subject}</td>
                    <td className="px-4 py-3">
                      <EmailClassificationBadge classification={email.classification} />
                      {email.adminNotified && (
                        <span className="ml-2 text-xs text-cosora-danger">Admin Notified</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-cosora-mid text-xs">
                      {new Date(email.createdAt).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-cosora-mid">{email.task?.title || '—'}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function EmailPage() {
  return (
    <QueryClientProvider client={queryClient}>
      <EmailContent />
    </QueryClientProvider>
  );
}
