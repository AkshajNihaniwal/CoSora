import crypto from 'crypto';

export function sha256(data: string | Buffer): string {
  return crypto.createHash('sha256').update(data).digest('hex');
}

export function hashObject(obj: unknown): string {
  return sha256(JSON.stringify(obj));
}

export function verifyChain(
  entries: Array<{ id: string; entryHash: string; prevHash: string | null; eventType: string; description: string; metadata: unknown; createdAt: Date }>
): { valid: boolean; brokenAt?: string } {
  if (entries.length === 0) return { valid: true };

  const sorted = [...entries].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );

  for (let i = 0; i < sorted.length; i++) {
    const entry = sorted[i];
    const expectedPrev = i === 0 ? null : sorted[i - 1].entryHash;
    if (entry.prevHash !== expectedPrev) {
      return { valid: false, brokenAt: entry.id };
    }

    const content = JSON.stringify({
      eventType: entry.eventType,
      description: entry.description,
      metadata: entry.metadata,
      prevHash: entry.prevHash,
      createdAt: entry.createdAt.toISOString(),
    });
    const computed = sha256(content);
    if (computed !== entry.entryHash) {
      return { valid: false, brokenAt: entry.id };
    }
  }

  return { valid: true };
}
