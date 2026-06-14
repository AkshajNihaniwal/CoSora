'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Send,
  Sparkles,
  Loader2,
  Paperclip,
  X,
  FileText,
  FileSpreadsheet,
} from 'lucide-react';
import axios from 'axios';
import { API_URL } from '@/lib/api';
import { useAuthStore } from '@/lib/store/authStore';
import {
  MAX_UPLOAD_FILE_SIZE_BYTES,
  MAX_UPLOAD_FILE_SIZE_MB,
  MAX_UPLOAD_FILES,
  formatFileSize,
} from '@/lib/upload';
import { TaskAnalysisPanel } from '@/components/ui/TaskAnalysisPanel';
import { IntakeDraft, MissingField, TaskAnalysisSummary } from '@/lib/legalAnalysis';
import { toast } from 'sonner';

type Role = 'assistant' | 'user';

interface Message {
  id: string;
  role: Role;
  content: string;
}

interface TaskDraft extends IntakeDraft {
  instructions: string;
  missingFields?: MissingField[];
}

const SUGGESTIONS = [
  'Review this vendor MSA under Indian Contract Act — upload attached',
  'Draft NDA for Bangalore R&D team — need Indian law compliance',
  'Risk assessment on commercial lease (Maharashtra) with financial charts',
  'DPDP Act 2023 review of data processing agreement',
];

const ACCEPTED_TYPES =
  '.pdf,.doc,.docx,.xls,.xlsx,.csv,.txt,.md,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/plain,text/csv';

function fileIcon(name: string) {
  const ext = name.split('.').pop()?.toLowerCase();
  if (ext === 'xlsx' || ext === 'xls' || ext === 'csv') return FileSpreadsheet;
  return FileText;
}

export function TaskCreatorChat() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content:
        "Namaste! I'm CoSora's Indian legal intake assistant. Tell me about your matter or upload contracts, reports, or filings — I'll ask for any missing details (party names, values, jurisdiction, etc.), run precise risk scoring under Indian law, and highlight key clauses and charts before creating your task.",
    },
  ]);
  const [input, setInput] = useState('');
  const [files, setFiles] = useState<File[]>([]);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [lastInstructions, setLastInstructions] = useState('');
  const [creating, setCreating] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [draft, setDraft] = useState<TaskDraft | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, draft]);

  const addFiles = useCallback((incoming: FileList | File[]) => {
    const list = Array.from(incoming);
    const valid: File[] = [];
    let skippedType = 0;

    for (const f of list) {
      const ext = f.name.split('.').pop()?.toLowerCase();
      if (!['pdf', 'doc', 'docx', 'xls', 'xlsx', 'csv', 'txt', 'md'].includes(ext || '')) {
        skippedType++;
        continue;
      }
      if (f.size > MAX_UPLOAD_FILE_SIZE_BYTES) {
        toast.error(`${f.name} exceeds ${MAX_UPLOAD_FILE_SIZE_MB} MB limit`);
        continue;
      }
      valid.push(f);
    }

    if (skippedType > 0) {
      toast.error('Some files skipped — supported: PDF, Word, Excel, CSV, TXT');
    }

    setFiles((prev) => {
      const remaining = MAX_UPLOAD_FILES - prev.length;
      if (remaining <= 0) {
        toast.error(`Maximum ${MAX_UPLOAD_FILES} files per task`);
        return prev;
      }
      const names = new Set(prev.map((f) => f.name));
      const toAdd = valid.filter((f) => !names.has(f.name)).slice(0, remaining);
      if (toAdd.length < valid.filter((f) => !names.has(f.name)).length) {
        toast.error(`Maximum ${MAX_UPLOAD_FILES} files per task`);
      }
      return [...prev, ...toAdd];
    });
  }, []);

  if (user?.role === 'REVIEWER') {
    return (
      <div className="cosora-card p-8 text-center text-cosora-mid">
        Reviewers have read-only access and cannot create tasks.
      </div>
    );
  }

  const buildFormData = (extra?: Record<string, string>) => {
    const fd = new FormData();
    files.forEach((f) => fd.append('files', f));
    if (input.trim()) fd.append('instructions', input.trim());
    if (extra) Object.entries(extra).forEach(([k, v]) => fd.append(k, v));
    return fd;
  };

  const handleSend = async (text?: string) => {
    const content = (text ?? input).trim();
    if ((!content && files.length === 0) || analyzing || creating) return;

    const userMsg =
      content ||
      `Uploaded ${files.length} document(s): ${files.map((f) => f.name).join(', ')}`;

    setInput('');
    setLastInstructions(content);
    setAnalyzing(true);

    setMessages((m) => [
      ...m,
      { id: `u-${Date.now()}`, role: 'user', content: userMsg },
    ]);

    try {
      const fd = new FormData();
      files.forEach((f) => fd.append('files', f));
      fd.append('message', content);
      if (sessionId) fd.append('sessionId', sessionId);

      const res = await axios.post(`${API_URL}/api/tasks/intake/chat`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      const {
        sessionId: sid,
        reply,
        draft: chatDraft,
        missingFields,
        readyToCreate,
        analysisSummary,
      } = res.data;

      setSessionId(sid);

      if (chatDraft) {
        setDraft({
          title: chatDraft.title,
          description: chatDraft.description,
          domain: chatDraft.domain,
          priority: chatDraft.priority,
          riskScore: chatDraft.riskScore,
          riskScorePrecise: chatDraft.riskScorePrecise,
          summary: chatDraft.summary,
          analysisSummary: analysisSummary as TaskAnalysisSummary,
          readyToCreate,
          missingFields,
          instructions: content,
        });
      }

      setMessages((m) => [
        ...m,
        { id: `a-${Date.now()}`, role: 'assistant', content: reply },
      ]);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'Analysis failed';
      toast.error(msg);
      setMessages((m) => [
        ...m,
        { id: `err-${Date.now()}`, role: 'assistant', content: `Something went wrong: ${msg}` },
      ]);
    } finally {
      setAnalyzing(false);
    }
  };

  const confirmCreate = async () => {
    if (!draft || creating) return;
    setCreating(true);
    try {
      const fd = buildFormData({
        title: draft.title,
        description: draft.description,
        domain: draft.domain,
        priority: draft.priority,
        riskScore: String(draft.riskScore),
        riskScorePrecise: String(draft.riskScorePrecise),
        summary: draft.summary,
        instructions: draft.instructions,
        analysisSummary: JSON.stringify(draft.analysisSummary),
        sessionId: sessionId || '',
      });

      const res = await axios.post(`${API_URL}/api/tasks/intake/create`, fd, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      toast.success('Task created — documents uploaded & AI pipeline started');
      setFiles([]);
      setMessages((m) => [
        ...m,
        {
          id: `done-${Date.now()}`,
          role: 'assistant',
          content: 'Task created with uploaded documents. Redirecting to task workspace…',
        },
      ]);
      setTimeout(() => router.push(`/tasks/${res.data.task.id}`), 800);
    } catch {
      toast.error('Failed to create task');
      setCreating(false);
    }
  };

  return (
    <div
      className={`flex flex-col h-[calc(100vh-8rem)] max-h-[820px] cosora-card overflow-hidden ${dragOver ? 'ring-2 ring-cosora-orange' : ''}`}
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
      }}
    >
      <div className="px-5 py-4 border-b border-cosora-smoke flex items-center gap-3 bg-cosora-charcoal">
        <div className="w-9 h-9 rounded-full bg-cosora-orange/20 flex items-center justify-center">
          <Sparkles size={18} className="text-cosora-orange" />
        </div>
        <div>
          <h2 className="text-cosora-light font-semibold">New Legal Task</h2>
          <p className="text-cosora-mid text-sm">
            Interactive Indian-law intake — Azure AI asks for missing details & precise risk scoring
          </p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-cosora-black">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[85%] rounded-lg px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === 'user'
                  ? 'bg-cosora-orange text-cosora-white'
                  : 'bg-cosora-charcoal border border-cosora-smoke text-cosora-light'
              }`}
            >
              {msg.content}
            </div>
          </div>
        ))}

        {draft?.analysisSummary && (
          <div className="space-y-4">
            <TaskAnalysisPanel analysis={draft.analysisSummary} />

            {draft.missingFields && draft.missingFields.length > 0 && !draft.readyToCreate && (
              <div className="cosora-card p-4 border-cosora-gold/40">
                <p className="text-cosora-gold text-xs uppercase mb-2">Still needed from you</p>
                {draft.missingFields.map((f) => (
                  <p key={f.field} className="text-cosora-light text-sm">• {f.label} — {f.reason}</p>
                ))}
                <p className="text-cosora-mid text-xs mt-2">Reply in the chat above, or say &quot;proceed with assumptions&quot;.</p>
              </div>
            )}

            {files.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {files.map((f) => {
                  const Icon = fileIcon(f.name);
                  return (
                    <span key={f.name} className="flex items-center gap-1 text-xs bg-cosora-smoke px-2 py-1 rounded text-cosora-mid">
                      <Icon size={12} /> {f.name}
                    </span>
                  );
                })}
              </div>
            )}

            <button
              onClick={confirmCreate}
              disabled={creating || !draft.readyToCreate}
              className="cosora-btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {creating ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Creating task & uploading docs…
                </>
              ) : draft.readyToCreate ? (
                'Confirm & Create Task'
              ) : (
                'Answer questions above to enable task creation'
              )}
            </button>
          </div>
        )}

        {messages.length === 1 && (
          <div className="flex flex-wrap gap-2 pt-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setInput(s)}
                className="text-left text-xs px-3 py-2 rounded-lg border border-cosora-smoke text-cosora-mid hover:border-cosora-orange hover:text-cosora-light transition-colors"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Attached files */}
      {files.length > 0 && (
        <div className="px-4 py-2 border-t border-cosora-smoke bg-cosora-charcoal flex flex-wrap gap-2">
          {files.map((f) => {
            const Icon = fileIcon(f.name);
            return (
              <span
                key={f.name}
                className="inline-flex items-center gap-2 text-xs bg-cosora-smoke px-3 py-1.5 rounded-full text-cosora-light"
              >
                <Icon size={14} className="text-cosora-orange shrink-0" />
                <span className="max-w-[140px] truncate">{f.name}</span>
                <span className="text-cosora-mid">{formatFileSize(f.size)}</span>
                <button
                  type="button"
                  onClick={() => setFiles((prev) => prev.filter((x) => x.name !== f.name))}
                  className="text-cosora-mid hover:text-cosora-danger"
                >
                  <X size={14} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      <div className="p-4 border-t border-cosora-smoke bg-cosora-charcoal">
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={ACCEPTED_TYPES}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) addFiles(e.target.files);
            e.target.value = '';
          }}
        />
        <div className="flex items-end gap-2 bg-cosora-smoke rounded-xl px-3 py-2 border border-cosora-smoke focus-within:border-cosora-orange">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={analyzing || creating}
            className="p-2 text-cosora-mid hover:text-cosora-orange transition-colors shrink-0"
            title="Attach PDF, Word, Excel"
          >
            <Paperclip size={20} />
          </button>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder="Describe your matter, answer AI questions, or upload Indian legal documents…"
            rows={1}
            disabled={analyzing}
            className="flex-1 bg-transparent text-cosora-light text-sm resize-none outline-none placeholder:text-cosora-mid max-h-32 py-2 disabled:opacity-50"
            style={{ minHeight: '24px' }}
          />
          <button
            onClick={() => handleSend()}
            disabled={(!input.trim() && files.length === 0) || analyzing || creating}
            className="p-2 rounded-lg bg-cosora-orange text-white disabled:opacity-40 hover:opacity-90 transition-opacity shrink-0"
          >
            {analyzing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
          </button>
        </div>
        <p className="text-cosora-mid text-xs mt-2 text-center">
          Attach PDF · Word · Excel · CSV · TXT — up to {MAX_UPLOAD_FILE_SIZE_MB} MB each, {MAX_UPLOAD_FILES} files max · drag & drop supported
        </p>
      </div>
    </div>
  );
}
