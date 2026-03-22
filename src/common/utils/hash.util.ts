import { createHash } from 'crypto';

export function sha256(input: string): string {
  return createHash('sha256').update(input).digest('hex');
}

export function buildDedupeHash(parts: (string | number)[]): string {
  return sha256(parts.map(String).join('|'));
}
