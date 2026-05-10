'use client';

import { useEffect, useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { renderCheckoutHint, renderPlanCta } from '@/lib/pricingTemplates';
import { useBillingAccess } from '@/hooks/useBillingAccess';

type PlanKey = 'free' | 'pro' | 'premium';

export function PricingCheckoutButton({
  plan,
  planName,
  price,
  period,
  highlighted = false,
}: {
  plan: PlanKey;
  planName: string;
  price: string;
  period: string;
  highlighted?: boolean;
}) {
  const { plan: currentPlan, isAdmin, hasPro, hasPremium, ready } = useBillingAccess();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isAndroidApp, setIsAndroidApp] = useState(false);
  const hasAccess = plan === 'free' || isAdmin || (plan === 'pro' ? hasPro : hasPremium);

  const cta =
    hasAccess
      ? renderPlanCta(planName, 'Open')
      : renderPlanCta(planName, 'Unlock');

  useEffect(() => {
    const capacitor = (window as unknown as { Capacitor?: { getPlatform?: () => string; isNativePlatform?: () => boolean } }).Capacitor;
    setIsAndroidApp(Boolean(capacitor?.isNativePlatform?.() && capacitor?.getPlatform?.() === 'android'));
  }, []);

  async function handleCheckout() {
    setError('');

    if (plan === 'free' || hasAccess) {
      window.location.href = '/dashboard';
      return;
    }

    if (isAndroidApp) {
      setError('Android subscriptions will be available after Google Play Billing is enabled.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/billing/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan }),
      });

      const data = await response.json();
      if (response.status === 401 && data.url) {
        window.location.href = data.url;
        return;
      }
      if (!response.ok || !data.url) {
        throw new Error(data.error || 'Could not start checkout.');
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not start checkout.');
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleCheckout}
        disabled={loading || !ready}
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
          highlighted
            ? 'bg-[#DDF0E4] text-[#17361C] hover:bg-[#CDE7D7]'
            : 'bg-[#1E5B35] text-white hover:bg-[#17492A]'
        } disabled:cursor-wait disabled:opacity-100`}
      >
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : hasAccess && plan !== 'free' ? <Lock className="w-4 h-4" /> : null}
        {isAndroidApp && !hasAccess ? 'Coming soon on Android' : cta}
      </button>
      <p className={`text-center text-[11px] ${highlighted ? 'text-white/75' : 'text-[#6D756E]'}`}>
        {isAndroidApp && !hasAccess
          ? 'Google Play Billing setup required before Android purchase.'
          : isAdmin && plan !== 'free'
          ? 'Admin access included'
          : hasAccess && plan !== 'free'
            ? `${planName} active on this account`
            : renderCheckoutHint(planName, price, period)}
      </p>
      {error ? <p className="text-center text-xs text-red-500">{error}</p> : null}
    </div>
  );
}
