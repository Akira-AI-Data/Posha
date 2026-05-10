'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

export default function PricingSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [message, setMessage] = useState('Confirming your plan...');

  useEffect(() => {
    const sessionId = searchParams.get('session_id');
    if (!sessionId) {
      setMessage('Missing checkout session. Please contact support.');
      return;
    }

    fetch(`/api/billing/confirm?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error || 'Could not confirm your subscription.');
        }
        setMessage(`Your ${data.plan} plan is now active. Redirecting...`);
        window.setTimeout(() => router.replace('/dashboard'), 900);
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : 'Could not confirm your subscription.');
      });
  }, [router, searchParams]);

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="max-w-lg w-full rounded-3xl border border-[#E5E0D8] bg-white shadow-[0_18px_60px_rgb(0,0,0,0.06)] p-8 text-center space-y-4">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#8A9A86]">Posha Billing</p>
        <h1 className="font-heading text-3xl text-[#1A241C]">Payment received</h1>
        <p className="text-sm text-[#4A544C]">{message}</p>
        <Link href="/dashboard" className="inline-flex items-center justify-center rounded-xl bg-[#1E5B35] px-5 py-3 text-sm font-semibold text-white hover:bg-[#17492A] transition-colors">
          Open dashboard
        </Link>
      </div>
    </div>
  );
}
