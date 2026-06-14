'use client';

import { Lock, Check } from 'lucide-react';
import { cn, isHitlStage } from '@/lib/utils';

interface Stage {
  label: string;
  isHITL?: boolean;
  status?: 'completed' | 'current' | 'pending';
}

interface PipelineVisualiserProps {
  currentStage: number;
  stages?: Stage[];
}

const DEFAULT_STAGES = Array.from({ length: 10 }, (_, i) => ({
  label: `L${i}`,
  isHITL: isHitlStage(i),
  status: 'pending' as const,
}));

export function PipelineVisualiser({ currentStage, stages }: PipelineVisualiserProps) {
  const stageList =
    stages ||
    DEFAULT_STAGES.map((s, i) => ({
      ...s,
      status: i < currentStage ? 'completed' : i === currentStage ? 'current' : 'pending',
    }));

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-2">
      {stageList.map((stage, i) => (
        <div key={i} className="flex items-center">
          <div
            className={cn(
              'flex flex-col items-center min-w-[48px]',
              stage.status === 'current' && 'animate-pulseOrange'
            )}
          >
            <div
              className={cn(
                'w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold border-2',
                stage.status === 'completed' && 'bg-cosora-gold/20 border-cosora-gold text-cosora-gold',
                stage.status === 'current' && 'bg-cosora-orange/20 border-cosora-orange text-cosora-orange',
                stage.status === 'pending' && 'bg-cosora-smoke border-cosora-smoke text-cosora-mid'
              )}
            >
              {stage.status === 'completed' ? <Check size={14} /> : stage.isHITL ? <Lock size={14} /> : stage.label}
            </div>
            <span className="text-[10px] text-cosora-mid mt-1">{stage.label}</span>
          </div>
          {i < stageList.length - 1 && (
            <div
              className={cn(
                'w-6 h-0.5 mx-0.5',
                i < currentStage ? 'bg-cosora-gold' : 'bg-cosora-smoke'
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}
