'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export function UserIDChip({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(userId);
    setCopied(true);
    toast.success('User ID copied');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={copy}
      className="inline-flex items-center gap-1.5 font-mono text-xs bg-cosora-smoke px-2 py-1 rounded text-cosora-gold hover:bg-cosora-smoke/80"
    >
      {userId}
      {copied ? <Check size={12} /> : <Copy size={12} />}
    </button>
  );
}
