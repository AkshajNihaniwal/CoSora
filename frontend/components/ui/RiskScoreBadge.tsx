'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { RISK_RATING_COLORS } from '@/lib/legalAnalysis';
import type { RiskRating } from '@/lib/legalAnalysis';

export function RiskScoreBadge({
  score,
  preciseScore,
  rating,
  showBreakdown,
}: {
  score: number;
  preciseScore?: number | null;
  rating?: RiskRating;
  showBreakdown?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const display = preciseScore != null ? preciseScore : score * 20;
  const pct = Math.min(100, Math.max(0, display));

  const color =
    pct >= 80 ? 'bg-cosora-danger' :
    pct >= 60 ? 'bg-cosora-orange' :
    pct >= 40 ? 'bg-cosora-gold' : 'bg-cosora-success';

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => showBreakdown && setOpen(!open)}
        className={cn('flex items-center gap-2', showBreakdown && 'cursor-pointer')}
      >
        <div className="w-20 h-2 bg-cosora-smoke rounded overflow-hidden">
          <div className={cn('h-full rounded transition-all', color)} style={{ width: `${pct}%` }} />
        </div>
        <span className="text-cosora-light text-xs font-medium">{Math.round(display)}/100</span>
        {rating && (
          <span className={cn('text-xs', RISK_RATING_COLORS[rating])}>{rating}</span>
        )}
        {!preciseScore && (
          <span className="text-cosora-mid text-xs">(L{score})</span>
        )}
      </button>
      {open && (
        <div className="absolute z-10 top-full mt-1 bg-cosora-charcoal border border-cosora-smoke rounded p-2 text-xs text-cosora-mid w-48">
          Precise Indian-law risk score. Legacy band L{score} used for SLA gates.
        </div>
      )}
    </div>
  );
}
