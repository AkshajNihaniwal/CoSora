'use client';

import { useState } from 'react';
import { Fingerprint, X } from 'lucide-react';
import { api } from '@/lib/api';
import { RiskScoreBadge } from './RiskScoreBadge';
import { toast } from 'sonner';

interface HITLModalProps {
  taskId: string;
  stage: number;
  title: string;
  riskScore: number;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  isMobile?: boolean;
}

export function HITLModal({
  taskId,
  stage,
  title,
  riskScore,
  isOpen,
  onClose,
  onSuccess,
  isMobile = false,
}: HITLModalProps) {
  const [tab, setTab] = useState<'approve' | 'reject'>('approve');
  const [password, setPassword] = useState('');
  const [reason, setReason] = useState('');
  const [biometricState, setBiometricState] = useState<'idle' | 'processing' | 'confirmed'>('idle');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const useBiometric = isMobile && [6, 7, 8].includes(stage);

  const runBiometric = async () => {
    setBiometricState('processing');
    await new Promise((r) => setTimeout(r, 1500));
    setBiometricState('confirmed');
    await submitApproval(true);
  };

  const submitApproval = async (biometric = false) => {
    setLoading(true);
    try {
      await api.post(`/approvals/${taskId}/approve`, {
        stage,
        method: biometric || useBiometric ? 'BIOMETRIC' : 'PASSWORD',
        password: biometric ? undefined : password,
        biometricToken: biometric ? 'simulated-biometric-token-' + Date.now() : undefined,
      });
      toast.success('Approval submitted');
      onSuccess();
      onClose();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Approval failed';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const submitRejection = async () => {
    if (!reason.trim()) {
      toast.error('Rejection reason required');
      return;
    }
    setLoading(true);
    try {
      await api.post(`/approvals/${taskId}/reject`, {
        stage,
        method: 'PASSWORD',
        reason,
        password,
      });
      toast.success('Rejection submitted');
      onSuccess();
      onClose();
    } catch {
      toast.error('Rejection failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="cosora-card w-full max-w-md p-6">
        <div className="flex justify-between items-start mb-4">
          <h2 className="text-cosora-light font-semibold">HITL Approval — L{stage}</h2>
          <button onClick={onClose} className="text-cosora-mid hover:text-cosora-light">
            <X size={20} />
          </button>
        </div>

        <p className="text-cosora-mid text-sm mb-2">{title}</p>
        <RiskScoreBadge score={riskScore} />

        <div className="flex gap-2 mt-4 mb-4">
          <button
            onClick={() => setTab('approve')}
            className={`flex-1 py-2 rounded text-sm ${tab === 'approve' ? 'bg-cosora-orange text-white' : 'bg-cosora-smoke text-cosora-mid'}`}
          >
            Approve
          </button>
          <button
            onClick={() => setTab('reject')}
            className={`flex-1 py-2 rounded text-sm ${tab === 'reject' ? 'bg-cosora-danger text-white' : 'bg-cosora-smoke text-cosora-mid'}`}
          >
            Reject
          </button>
        </div>

        {tab === 'approve' ? (
          useBiometric ? (
            <div className="text-center py-6">
              <button
                onClick={runBiometric}
                disabled={biometricState !== 'idle' || loading}
                className="mx-auto flex flex-col items-center gap-3"
              >
                <Fingerprint
                  size={64}
                  className={`${biometricState === 'processing' ? 'animate-pulse text-cosora-orange' : biometricState === 'confirmed' ? 'text-cosora-success' : 'text-cosora-orange'}`}
                />
                <span className="text-cosora-light text-sm">
                  {biometricState === 'idle' && 'Tap to confirm biometric'}
                  {biometricState === 'processing' && 'Processing...'}
                  {biometricState === 'confirmed' && 'Biometric Confirmed'}
                </span>
              </button>
            </div>
          ) : (
            <div>
              <input
                type="password"
                placeholder="Confirm with password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="cosora-input mb-4"
              />
              <button
                onClick={() => submitApproval(false)}
                disabled={loading || !password}
                className="cosora-btn-primary w-full disabled:opacity-50"
              >
                Confirm Approval
              </button>
            </div>
          )
        ) : (
          <div>
            <textarea
              placeholder="Rejection reason (required)"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="cosora-input mb-2 min-h-[80px]"
            />
            <input
              type="password"
              placeholder="Confirm with password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="cosora-input mb-4"
            />
            <button
              onClick={submitRejection}
              disabled={loading || !reason || !password}
              className="cosora-btn-danger w-full disabled:opacity-50"
            >
              Confirm Rejection
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
