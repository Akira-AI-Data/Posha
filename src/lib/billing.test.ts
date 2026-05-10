import { describe, expect, it } from 'vitest';
import {
  getFamilyProfileLimit,
  getRequiredPlanForPath,
  hasPlanAccess,
  normalizeBillingPlan,
} from './billing';

describe('billing', () => {
  it('normalizes billing plans safely', () => {
    expect(normalizeBillingPlan('premium')).toBe('premium');
    expect(normalizeBillingPlan('pro')).toBe('pro');
    expect(normalizeBillingPlan('anything')).toBe('free');
  });

  it('compares plan access correctly', () => {
    expect(hasPlanAccess('premium', 'pro')).toBe(true);
    expect(hasPlanAccess('pro', 'premium')).toBe(false);
    expect(hasPlanAccess('free', 'free')).toBe(true);
  });

  it('maps gated routes to required plans', () => {
    expect(getRequiredPlanForPath('/meal-plan')).toBe('pro');
    expect(getRequiredPlanForPath('/shopping')).toBe('pro');
    expect(getRequiredPlanForPath('/aiadvisor')).toBe('premium');
    expect(getRequiredPlanForPath('/dashboard')).toBeNull();
  });

  it('returns family profile limits by plan', () => {
    expect(getFamilyProfileLimit('free')).toBe(0);
    expect(getFamilyProfileLimit('pro')).toBe(2);
    expect(getFamilyProfileLimit('premium')).toBe(Number.POSITIVE_INFINITY);
  });
});
