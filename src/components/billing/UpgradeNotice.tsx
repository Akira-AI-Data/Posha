'use client';

import Link from 'next/link';
import { Lock } from 'lucide-react';
import type { BillingPlan } from '@/lib/billing';

export function UpgradeNotice({
  title,
  description,
  plan,
}: {
  title: string;
  description: string;
  plan: BillingPlan;
}) {
  return (
    <div className="rounded-2xl border border-[#E5E0D8] bg-[#FBF7F1] p-4 flex items-start gap-3">
      <div className="w-10 h-10 rounded-xl bg-[#1E3F20] text-white flex items-center justify-center flex-shrink-0">
        <Lock className="w-4 h-4" />
      </div>
      <div className="min-w-0 flex-1 space-y-1">
        <p className="text-sm font-semibold text-[#1A241C]">{title}</p>
        <p className="text-sm text-[#4A544C]">{description}</p>
      </div>
      <Link
        href={`/pricing?upgrade=${plan}`}
        className="inline-flex items-center justify-center rounded-xl bg-[#1E5B35] px-4 py-2 text-xs font-semibold text-white hover:bg-[#17492A] transition-colors"
      >
        Upgrade
      </Link>
    </div>
  );
}
