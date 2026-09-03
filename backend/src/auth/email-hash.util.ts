import * as crypto from 'crypto';

const PEPPER = process.env.EMAIL_HASH_PEPPER || 'default-pepper-change-me';

export function hashEmail(email: string): string {
  return crypto.createHash('sha256').update(email.trim().toLowerCase() + PEPPER).digest('hex');
}
