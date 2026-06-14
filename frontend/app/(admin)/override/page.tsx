'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

export default function OverridePage() {
  const [taskId, setTaskId] = useState('');
  const [task, setTask] = useState<Record<string, unknown> | null>(null);
  const [password, setPassword] = useState('');
  const [override, setOverride] = useState({ currentStage: 0, status: 'IN_PROGRESS' });

  const searchTask = async () => {
    try {
      const res = await api.get(`/tasks/${taskId}`);
      setTask(res.data);
      setOverride({
        currentStage: res.data.currentStage,
        status: res.data.status,
      });
    } catch {
      toast.error('Task not found');
      setTask(null);
    }
  };

  const applyOverride = async () => {
    try {
      await api.post(`/tasks/${taskId}/override`, { ...override, password });
      toast.success('Override applied');
      searchTask();
    } catch {
      toast.error('Override failed — check password');
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="cosora-section-header">Workflow Override</div>
      <p className="text-cosora-mid text-sm">Admin-only. All actions require password confirmation and are logged.</p>

      <div className="cosora-card p-4 space-y-3">
        <div className="flex gap-2">
          <input
            placeholder="Task ID (UUID)"
            value={taskId}
            onChange={(e) => setTaskId(e.target.value)}
            className="cosora-input flex-1 font-mono text-sm"
          />
          <button onClick={searchTask} className="cosora-btn-primary text-sm">Search</button>
        </div>
      </div>

      {task && (
        <div className="cosora-card p-4 space-y-4">
          <h3 className="text-cosora-light font-medium">{task.title as string}</h3>
          <p className="text-cosora-mid text-sm">Current: L{task.currentStage as number} — {task.status as string}</p>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-cosora-mid text-xs">Stage</label>
              <input
                type="number"
                min={0}
                max={9}
                value={override.currentStage}
                onChange={(e) => setOverride({ ...override, currentStage: parseInt(e.target.value, 10) })}
                className="cosora-input"
              />
            </div>
            <div>
              <label className="text-cosora-mid text-xs">Status</label>
              <select
                value={override.status}
                onChange={(e) => setOverride({ ...override, status: e.target.value })}
                className="cosora-input"
              >
                {['PENDING', 'IN_PROGRESS', 'AWAITING_HITL', 'ESCALATED', 'COMPLETED'].map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <input
            type="password"
            placeholder="Confirm with Admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="cosora-input"
          />

          <button
            onClick={applyOverride}
            disabled={!password}
            className="cosora-btn-primary disabled:opacity-50"
          >
            Apply Override
          </button>
        </div>
      )}
    </div>
  );
}
