export type BillingPlan = 'free' | 'pro' | 'premium';

export const BILLING_PLAN_COOKIE = 'posha_plan';
export const BILLING_PLAN_EMAIL_COOKIE = 'posha_plan_email';
export const BILLING_PLAN_SIG_COOKIE = 'posha_plan_sig';

const PLAN_RANK: Record<BillingPlan, number> = {
  free: 0,
  pro: 1,
  premium: 2,
};

export function normalizeBillingPlan(plan?: string | null): BillingPlan {
  if (plan === 'premium') return 'premium';
  if (plan === 'pro') return 'pro';
  return 'free';
}

export function hasPlanAccess(currentPlan: BillingPlan, requiredPlan: BillingPlan) {
  return PLAN_RANK[currentPlan] >= PLAN_RANK[requiredPlan];
}

export function getRequiredPlanForPath(pathname: string): BillingPlan | null {
  if (pathname.startsWith('/aiadvisor')) return 'premium';
  if (pathname.startsWith('/meal-plan') || pathname.startsWith('/shopping')) return 'pro';
  return null;
}

export function getFamilyProfileLimit(plan: BillingPlan) {
  if (plan === 'premium') return Number.POSITIVE_INFINITY;
  if (plan === 'pro') return 2;
  return 0;
}

