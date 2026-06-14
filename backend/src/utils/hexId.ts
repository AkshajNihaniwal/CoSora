import crypto from 'crypto';

export function generateHexUserId(): string {
  const groups: string[] = [];
  for (let i = 0; i < 4; i++) {
    groups.push(crypto.randomBytes(2).toString('hex').toUpperCase());
  }
  return groups.join('-');
}

export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateBiometricToken(userId: string): string {
  const payload = `${userId}:${Date.now()}:${crypto.randomBytes(16).toString('hex')}`;
  return crypto.createHash('sha256').update(payload).digest('hex');
}
