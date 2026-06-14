import { AlertTriangle } from 'lucide-react';

export function CalloutBox({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="bg-cosora-amber-bg border-l-4 border-cosora-orange p-4 rounded-r-lg">
      <span className="inline-block px-2 py-0.5 text-xs bg-cosora-orange/20 text-cosora-orange rounded mb-2">
        {label}
      </span>
      <div className="text-cosora-light text-sm">{children}</div>
    </div>
  );
}

export function EmailClassificationBadge({ classification }: { classification: string }) {
  const isUrgent = classification === 'REGULATORY_GOVERNMENT' || classification === 'COURT_LITIGATION';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs rounded ${
        isUrgent ? 'bg-cosora-danger/20 text-cosora-danger' : 'bg-cosora-smoke text-cosora-gold'
      }`}
    >
      {isUrgent && <AlertTriangle size={12} />}
      {classification.replace(/_/g, ' ')}
    </span>
  );
}

export function TaskCard({
  title,
  domain,
  stage,
  riskScore,
  editorName,
  slaDeadline,
  status,
  onClick,
}: {
  title: string;
  domain: string;
  stage: number;
  riskScore: number;
  editorName?: string;
  slaDeadline?: string;
  status?: string;
  onClick?: () => void;
}) {
  const hoursLeft = slaDeadline
    ? (new Date(slaDeadline).getTime() - Date.now()) / (1000 * 60 * 60)
    : null;

  return (
    <div
      onClick={onClick}
      className={`cosora-card p-3 cursor-pointer hover:border-cosora-orange/50 transition-colors ${
        status === 'AWAITING_HITL' ? 'hitl-pulse border-cosora-orange' : ''
      }`}
    >
      <p className="text-cosora-light text-sm font-medium truncate">{title}</p>
      <p className="text-cosora-mid text-xs mt-1">{domain.replace(/_/g, ' ')}</p>
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs bg-cosora-orange/20 text-cosora-orange px-1.5 py-0.5 rounded">
          L{stage}
        </span>
        <span className="text-xs text-cosora-mid">{editorName}</span>
      </div>
      {hoursLeft !== null && (
        <p className={`text-xs mt-1 ${hoursLeft < 1 ? 'text-cosora-danger' : 'text-cosora-mid'}`}>
          SLA: {hoursLeft < 0 ? 'Overdue' : `${Math.round(hoursLeft)}h left`}
        </p>
      )}
    </div>
  );
}

export function AuditLogRow({
  timestamp,
  eventType,
  actorName,
  actorRole,
  taskTitle,
  description,
  metadata,
}: {
  timestamp: string;
  eventType: string;
  actorName?: string;
  actorRole?: string;
  taskTitle?: string;
  description: string;
  metadata?: Record<string, unknown>;
}) {
  const categoryColors: Record<string, string> = {
    HITL: 'bg-cosora-orange/20 text-cosora-orange',
    TASK: 'bg-cosora-gold/20 text-cosora-gold',
    USER: 'bg-cosora-smoke text-cosora-light',
    AI: 'bg-cosora-success/20 text-cosora-success',
    EMAIL: 'bg-cosora-danger/20 text-cosora-danger',
  };

  const category = eventType.split('_')[0];
  const color = categoryColors[category] || 'bg-cosora-smoke text-cosora-mid';

  return (
    <tr className="border-b border-cosora-smoke hover:bg-cosora-smoke/30">
      <td className="px-3 py-2 text-cosora-mid text-xs font-mono whitespace-nowrap">
        {new Date(timestamp).toLocaleString()}
      </td>
      <td className="px-3 py-2">
        <span className={`text-xs px-2 py-0.5 rounded ${color}`}>{eventType.replace(/_/g, ' ')}</span>
      </td>
      <td className="px-3 py-2 text-cosora-light text-sm">
        {actorName || 'System'}
        {actorRole && <span className="text-cosora-mid text-xs ml-1">({actorRole})</span>}
      </td>
      <td className="px-3 py-2 text-cosora-mid text-sm truncate max-w-[120px]">{taskTitle || '—'}</td>
      <td className="px-3 py-2 text-cosora-light text-sm">{description}</td>
    </tr>
  );
}

export function AgentStatusCard({
  agentName,
  action,
  stage,
  confidenceScore,
  ragSources,
}: {
  agentName: string;
  action: string;
  stage: number;
  confidenceScore?: number;
  ragSources?: Array<{ title: string; docType: string }>;
}) {
  return (
    <div className="cosora-card p-4">
      <div className="flex justify-between items-start">
        <h3 className="text-cosora-orange font-medium text-sm">{agentName}</h3>
        <span className="text-cosora-gold text-xs">L{stage}</span>
      </div>
      <p className="text-cosora-mid text-sm mt-2">{action}...</p>
      {confidenceScore !== undefined && (
        <p className="text-cosora-mid text-xs mt-2">Confidence: {(confidenceScore * 100).toFixed(0)}%</p>
      )}
      {ragSources && ragSources.length > 0 && (
        <ul className="mt-2 space-y-1">
          {ragSources.map((s, i) => (
            <li key={i} className="text-cosora-mid text-xs">
              [{s.docType}] {s.title}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export function RoleChangeBanner({
  requestedRole,
  requestedBy,
  adminApprovals,
}: {
  requestedRole: string;
  requestedBy: string;
  adminApprovals: Array<{ name: string; approved: boolean }>;
}) {
  return (
    <CalloutBox label="Role Change Pending">
      <p>
        Role change to <strong>{requestedRole}</strong> requested by {requestedBy}.
        Requires approval from ALL active Admins.
      </p>
      <ul className="mt-2 space-y-1">
        {adminApprovals.map((a, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span className={a.approved ? 'text-cosora-success' : 'text-cosora-mid'}>
              {a.approved ? '✓' : '○'}
            </span>
            {a.name}
          </li>
        ))}
      </ul>
    </CalloutBox>
  );
}
