import { describe, expect, it } from 'vitest';
import { normalizePlan, renderCheckoutHint, renderPlanCta } from './pricingTemplates';

describe('pricingTemplates', () => {
  it('renders cta label with caveman template', () => {
    expect(renderPlanCta('Pro', 'Purchase')).toBe('Purchase Pro');
  });

  it('renders checkout hint with caveman template', () => {
    expect(renderCheckoutHint('Premium', '$19.99', '/month')).toBe('Premium · $19.99/month');
  });

  it('normalizes plan keys safely', () => {
    expect(normalizePlan('premium')).toBe('premium');
    expect(normalizePlan('pro')).toBe('pro');
    expect(normalizePlan('weird')).toBe('free');
  });
});
