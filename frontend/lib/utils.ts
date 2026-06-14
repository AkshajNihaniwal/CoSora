import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDomain(domain: string): string {
  return domain.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export function formatStage(stage: number): string {
  return `L${stage}`;
}

export const HITL_STAGES = [3, 6, 7, 8];

export function isHitlStage(stage: number): boolean {
  return HITL_STAGES.includes(stage);
}

export function useIsMobile(): boolean {
  if (typeof window === 'undefined') return false;
  return window.innerWidth < 768;
}
