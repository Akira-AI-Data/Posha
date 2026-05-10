import Caveman from 'caveman';

type PricePlan = 'free' | 'pro' | 'premium';

Caveman.register('ctaLabel', '{{d.prefix}} {{d.planName}}');
Caveman.register('checkoutHint', '{{d.planName}} · {{d.price}}{{d.period}}');

export function renderPlanCta(planName: string, prefix: string) {
  return Caveman.render('ctaLabel', { planName, prefix });
}

export function renderCheckoutHint(planName: string, price: string, period: string) {
  return Caveman.render('checkoutHint', { planName, price, period });
}

export function normalizePlan(plan: string): PricePlan {
  if (plan === 'premium') return 'premium';
  if (plan === 'pro') return 'pro';
  return 'free';
}
