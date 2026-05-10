import { createHash } from 'crypto';

export function signBillingAccess(plan: string, email: string, secret: string) {
  return createHash('sha256')
    .update(`${plan}:${email.trim().toLowerCase()}:${secret}`)
    .digest('hex');
}

