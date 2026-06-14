'use client';

import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MessageSquare, X, Send, Loader2, Sparkles } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface AssistantMessage {
  id: string;
  role: string;
  content: string;
  createdAt: string;
}

interface AssistantSession {
  task?: { title: string; domain: string };
  contextBrief?: string;
  documentName?: string | null;
  messages: AssistantMessage[];
}

export function TaskAssistantChat({ taskId }: { taskId: string }) {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState('');
  const [pending, setPending] = useState(false);
  const [localMessages, setLocalMessages] = useState<AssistantMessage[]>([]);
  const [contextBrief, setContextBrief] = useState<string | null>(null);
  const [taskTitle, setTaskTitle] = useState<string>('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const qc = useQueryClient();

  const { data, isLoading, isError, refetch } = useQuery<AssistantSession>({
    queryKey: ['task-assistant', taskId],
    queryFn: async () => (await api.get(`/tasks/${taskId}/assistant`)).data,
    enabled: open && !!taskId,
  });

  useEffect(() => {
    if (!data) return;
    setLocalMessages(data.messages || []);
    setContextBrief(data.contextBrief || null);
    setTaskTitle(data.task?.title || '');
  }, [data]);

  const send = useMutation({
    mutationFn: async (message: string) =>
      (await api.post(`/tasks/${taskId}/assistant`, { message })).data as {
        messages: AssistantMessage[];
        message: AssistantMessage;
      },
    onMutate: async (message) => {
      setPending(true);
      const tempUser: AssistantMessage = {
        id: `temp-${Date.now()}`,
        role: 'user',
        content: message,
        createdAt: new Date().toISOString(),
      };
      setLocalMessages((prev) => [...prev, tempUser]);
      setInput('');
    },
    onSuccess: (result) => {
      setLocalMessages(result.messages || []);
      setPending(false);
      qc.setQueryData(['task-assistant', taskId], (old: AssistantSession | undefined) => ({
        ...old,
        messages: result.messages,
      }));
    },
    onError: (err: unknown) => {
      setPending(false);
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data?.error ||
        'AI assistant failed';
      toast.error(msg);
      refetch();
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [localMessages, pending, open]);

  const showBrief = contextBrief && localMessages.length === 0 && !pending;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 cosora-btn-primary shadow-lg rounded-full px-4 py-3"
      >
        <Sparkles size={18} />
        AI Assistant
      </button>

      {open && (
        <div className="fixed bottom-6 right-6 z-50 w-[min(420px,calc(100vw-2rem))] h-[min(560px,calc(100vh-4rem))] cosora-card flex flex-col shadow-2xl border-cosora-orange/30">
          <div className="flex items-center justify-between px-4 py-3 border-b border-cosora-smoke">
            <div className="flex items-center gap-2 min-w-0">
              <MessageSquare size={18} className="text-cosora-orange shrink-0" />
              <div className="min-w-0">
                <p className="text-cosora-light text-sm font-medium truncate">
                  {taskTitle || 'CoSora AI Assistant'}
                </p>
                <p className="text-cosora-mid text-xs truncate">
                  Indian law · task context loaded
                  {data?.documentName ? ` · ${data.documentName}` : ''}
                </p>
              </div>
            </div>
            <button onClick={() => setOpen(false)} className="text-cosora-mid hover:text-cosora-light shrink-0">
              <X size={18} />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {isLoading && (
              <div className="flex items-center justify-center gap-2 text-cosora-mid text-sm py-8">
                <Loader2 size={16} className="animate-spin" /> Loading task context…
              </div>
            )}

            {isError && (
              <p className="text-cosora-danger text-sm text-center py-4">
                Could not load assistant. Check your connection and try again.
              </p>
            )}

            {showBrief && (
              <div className="flex justify-start">
                <div className="max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap bg-cosora-charcoal border border-cosora-orange/30 text-cosora-light">
                  {contextBrief}
                </div>
              </div>
            )}

            {localMessages.map((m) => (
              <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap ${
                    m.role === 'user'
                      ? 'bg-cosora-orange text-white'
                      : 'bg-cosora-charcoal border border-cosora-smoke text-cosora-light'
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}

            {pending && (
              <div className="flex justify-start">
                <div className="rounded-lg px-3 py-2 text-sm bg-cosora-charcoal border border-cosora-smoke text-cosora-mid flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  Analysing task context…
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          <div className="p-3 border-t border-cosora-smoke flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && input.trim() && !send.isPending && !pending) {
                  send.mutate(input.trim());
                }
              }}
              placeholder="Ask about this task's clauses, risk, or edits…"
              className="cosora-input flex-1 text-sm"
              disabled={send.isPending || pending || isLoading}
            />
            <button
              onClick={() => input.trim() && send.mutate(input.trim())}
              disabled={!input.trim() || send.isPending || pending || isLoading}
              className="p-2 bg-cosora-orange rounded text-white disabled:opacity-40"
            >
              {send.isPending || pending ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
