'use client';

import { BarChart3, FileText, Scale, Shield, AlertTriangle, PieChart, Table2 } from 'lucide-react';
import { TaskAnalysisSummary, RISK_RATING_COLORS, DIMENSION_LABELS } from '@/lib/legalAnalysis';
import { cn } from '@/lib/utils';

function VisualIcon({ type }: { type: string }) {
  if (type.includes('pie')) return <PieChart size={16} className="text-cosora-orange" />;
  if (type.includes('bar') || type.includes('line') || type.includes('chart') || type.includes('graph')) {
    return <BarChart3 size={16} className="text-cosora-orange" />;
  }
  if (type.includes('table')) return <Table2 size={16} className="text-cosora-orange" />;
  return <BarChart3 size={16} className="text-cosora-orange" />;
}

export function TaskAnalysisPanel({ analysis, compact }: { analysis: TaskAnalysisSummary; compact?: boolean }) {
  const rb = analysis.riskBreakdown;

  return (
    <div className={cn('space-y-4', compact ? '' : 'cosora-card p-5')}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-cosora-gold text-xs uppercase tracking-wide flex items-center gap-1">
            <Scale size={12} /> Indian Law AI Assessment
          </p>
          <p className="text-cosora-light text-sm mt-2 leading-relaxed">{analysis.executiveSummary}</p>
        </div>
        <div className="text-right shrink-0">
          <p className="text-2xl font-semibold text-cosora-orange">{rb.overallScore}</p>
          <p className="text-cosora-mid text-xs">/ 100</p>
          <p className={cn('text-xs font-medium mt-1', RISK_RATING_COLORS[rb.rating])}>{rb.rating}</p>
        </div>
      </div>

      {!compact && (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {Object.entries(rb.dimensions).map(([key, val]) => (
            <div key={key} className="bg-cosora-smoke/40 rounded p-2">
              <p className="text-cosora-mid text-xs">{DIMENSION_LABELS[key] || key}</p>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-1.5 bg-cosora-smoke rounded overflow-hidden">
                  <div className="h-full bg-cosora-orange rounded" style={{ width: `${Math.min(100, val)}%` }} />
                </div>
                <span className="text-cosora-light text-xs w-6">{val}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {analysis.summaryPointers.length > 0 && (
        <div>
          <p className="text-cosora-mid text-xs uppercase mb-2 flex items-center gap-1">
            <FileText size={12} /> Key Summary Points
          </p>
          <ul className="space-y-1.5">
            {analysis.summaryPointers.map((p, i) => (
              <li key={i} className="text-cosora-light text-sm pl-3 border-l-2 border-cosora-orange/50">
                {p.replace(/^•\s*/, '')}
              </li>
            ))}
          </ul>
        </div>
      )}

      {analysis.clauseHighlights.length > 0 && (
        <div>
          <p className="text-cosora-mid text-xs uppercase mb-2">Main Clauses</p>
          <div className="space-y-2">
            {analysis.clauseHighlights.map((c) => (
              <div key={c.clauseId} className="bg-cosora-charcoal border border-cosora-smoke rounded p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-cosora-light text-sm font-medium">{c.section}: {c.title}</p>
                  <span className={cn('text-xs', RISK_RATING_COLORS[c.riskLevel])}>{c.riskLevel}</span>
                </div>
                <p className="text-cosora-mid text-xs mt-1">{c.summary}</p>
                {c.indianLawRef && (
                  <p className="text-cosora-gold text-xs mt-1">🇮🇳 {c.indianLawRef}{c.pageOrSheet ? ` · ${c.pageOrSheet}` : ''}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.visualElements.length > 0 && (
        <div>
          <p className="text-cosora-mid text-xs uppercase mb-2 flex items-center gap-1">
            <BarChart3 size={12} /> Charts, Graphs & Visuals
          </p>
          <div className="space-y-2">
            {analysis.visualElements.map((v, i) => (
              <div key={i} className="bg-cosora-charcoal border border-cosora-orange/30 rounded p-3">
                <div className="flex items-center gap-2">
                  <VisualIcon type={v.type} />
                  <p className="text-cosora-light text-sm font-medium">{v.title}</p>
                  <span className="text-cosora-mid text-xs ml-auto">{v.type.replace(/_/g, ' ')}</span>
                </div>
                <p className="text-cosora-mid text-xs mt-1">{v.location}</p>
                <p className="text-cosora-light text-sm mt-2">{v.description}</p>
                {v.dataSummary && (
                  <p className="text-cosora-mid text-xs mt-2 bg-cosora-smoke/50 p-2 rounded">
                    <strong>Data:</strong> {v.dataSummary}
                  </p>
                )}
                {v.legalRelevance && (
                  <p className="text-cosora-gold text-xs mt-2">
                    <strong>Legal relevance:</strong> {v.legalRelevance}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {analysis.complianceNotes.length > 0 && (
        <div>
          <p className="text-cosora-mid text-xs flex items-center gap-1 mb-1">
            <Shield size={12} /> Indian Compliance Notes
          </p>
          {analysis.complianceNotes.map((n, i) => (
            <p key={i} className="text-cosora-light text-xs pl-4">• {n}</p>
          ))}
        </div>
      )}

      {analysis.riskFlags.length > 0 && (
        <div>
          <p className="text-cosora-danger text-xs flex items-center gap-1 mb-1">
            <AlertTriangle size={12} /> Risk Flags
          </p>
          {analysis.riskFlags.map((f, i) => (
            <p key={i} className="text-cosora-mid text-xs pl-4">• {f}</p>
          ))}
        </div>
      )}

      {analysis.indianLawReferences.length > 0 && !compact && (
        <p className="text-cosora-mid text-xs">
          Statutes: {analysis.indianLawReferences.join(' · ')}
          {analysis.webResearchUsed && ' · Live web research applied'}
        </p>
      )}
    </div>
  );
}
