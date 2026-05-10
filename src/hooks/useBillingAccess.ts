'use client';

import { useEffect, useMemo, useState } from 'react';
import { useSession } from 'next-auth/react';
import { isAdminEmail } from '@/lib/admin';
import {
  BILLING_PLAN_COOKIE,
  BILLING_PLAN_EMAIL_COOKIE,
  type BillingPlan,
  getFamilyProfileLimit,
  hasPlanAccess,
  normalizeBillingPlan,
} from '@/lib/billing';

function readCookie(name: string) {
  if (typeof document === 'undefined') return '';
  const prefix = `${name}=`;
  const match = document.cookie.split('; ').find((item) => item.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : '';
}

export function useBillingAccess() {
  const { data: session, status } = useSession();
  const [plan, setPlan] = useState<BillingPlan>('free');
  const email = session?.user?.email?.trim().toLowerCase() || '';
  const isAdmin = Boolean(session?.user?.isAdmin || isAdminEmail(email));

  useEffect(() => {
    if (isAdmin) {
      setPlan('premium');
      return;
    }

    const cookieEmail = readCookie(BILLING_PLAN_EMAIL_COOKIE).trim().toLowerCase();
    const cookiePlan = normalizeBillingPlan(readCookie(BILLING_PLAN_COOKIE));
    if (cookieEmail && email && cookieEmail === email) {
      setPlan(cookiePlan);
      return;
    }
    setPlan('free');
  }, [email, isAdmin, status]);

  return useMemo(() => ({
    plan,
    isAdmin,
    hasPro: isAdmin || hasPlanAccess(plan, 'pro'),
    hasPremium: isAdmin || hasPlanAccess(plan, 'premium'),
    familyProfileLimit: isAdmin ? Number.POSITIVE_INFINITY : getFamilyProfileLimit(plan),
    ready: status !== 'loading',
  }), [isAdmin, plan, status]);
}
