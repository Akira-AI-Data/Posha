'use client';

import { motion } from 'motion/react';
import { ScrollReveal } from './ScrollReveal';
import { Check, ArrowRight } from 'lucide-react';
import { PricingCheckoutButton } from '@/components/billing/PricingCheckoutButton';

const PLANS = [
  {
    key: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    desc: 'Essentials for logging, tracking, and building better habits.',
    features: [
      'Food logging with edit and delete',
      'Live calories, macros, and weekly progress',
      'Recipe discovery and saved recipes',
      'Pantry basics and dashboard tracking',
    ],
    cta: 'Start with essentials',
    popular: false,
    accent: false,
  },
  {
    key: 'pro',
    name: 'Pro',
    price: '$9.99',
    period: '/month',
    desc: 'Premium planning tools for households that want structure every week.',
    features: [
      'Goal-aware weekly meal planning',
      'Shopping sync from your meal plan',
      'Cuisine, ingredient, and nutrient-smart cookbook filters',
      'Up to 2 family profiles with allergies and exclusions',
      'Planning goals for daily or per-meal calorie targets',
      'Plan refill suggestions when meals are removed',
    ],
    cta: 'Unlock Pro planning',
    popular: true,
    accent: true,
  },
  {
    key: 'premium',
    name: 'Premium',
    price: '$19.99',
    period: '/month',
    desc: 'Full Posha intelligence for advanced nutrition guidance and family access.',
    features: [
      'Everything in Pro',
      'AI Advisor access',
      'Advanced nutrition insights on your dashboard',
      'Unlimited family profiles',
      'Premium nutrition guidance and recommendations',
      'Priority access to premium intelligence features',
    ],
    cta: 'Unlock Premium guidance',
    popular: false,
    accent: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="section-spacing bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-14">
            <p className="text-sm uppercase tracking-[0.2em] font-bold text-[#8A9A86] mb-4">Pricing</p>
            <h2 className="font-heading text-4xl md:text-5xl tracking-tight leading-[1.15] font-medium text-[#1A241C]">
              Premium nutrition, priced with clarity
            </h2>
            <p className="text-base md:text-lg text-[#4A544C] leading-relaxed mt-4">
              Every tier reflects features already live in Posha today. Upgrade only when you want deeper planning and guidance.
            </p>
          </div>
        </ScrollReveal>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan, i) => (
            <ScrollReveal key={plan.name} delay={i * 0.1}>
              <motion.div
                whileHover={{ y: -8 }}
                transition={{ duration: 0.3 }}
                className={`rounded-3xl p-8 h-full flex flex-col ${
                  plan.accent
                    ? 'bg-[#1E3F20] text-white glow-accent border-2 border-[#C05A45]/30 relative'
                    : 'bg-white border border-[#E5E0D8] shadow-[0_8px_30px_rgb(0,0,0,0.04)]'
                }`}
              >
                {plan.popular && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-[#C05A45] text-white text-xs font-bold uppercase tracking-wider">
                    Most Popular
                  </span>
                )}

                <h3 className={`font-heading text-2xl font-medium mb-2 ${plan.accent ? 'text-white' : 'text-[#1A241C]'}`}>
                  {plan.name}
                </h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className={`font-heading text-4xl font-bold ${plan.accent ? 'text-white' : 'text-[#1A241C]'}`}>
                    {plan.price}
                  </span>
                  <span className={`text-sm ${plan.accent ? 'text-white/70' : 'text-[#8A9A86]'}`}>
                    {plan.period}
                  </span>
                </div>
                <p className={`text-sm mb-6 ${plan.accent ? 'text-white/80' : 'text-[#4A544C]'}`}>
                  {plan.desc}
                </p>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 mt-0.5 flex-shrink-0 ${
                        plan.accent ? 'text-[#D68C45]' : 'text-[#3D7A42]'
                      }`} />
                      <span className={`text-sm ${plan.accent ? 'text-white/90' : 'text-[#4A544C]'}`}>
                        {f}
                      </span>
                    </li>
                  ))}
                </ul>

                <div className="space-y-3">
                  <PricingCheckoutButton
                    plan={plan.key as 'free' | 'pro' | 'premium'}
                    planName={plan.name}
                    price={plan.price}
                    period={plan.period}
                    highlighted={plan.accent}
                  />
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold uppercase tracking-wide">
                    <span className={plan.accent ? 'text-white' : 'text-[#51604F]'}>{plan.cta}</span>
                    <ArrowRight className={`w-3.5 h-3.5 ${plan.accent ? 'text-white' : 'text-[#51604F]'}`} />
                  </div>
                </div>
              </motion.div>
            </ScrollReveal>
          ))}
        </div>
      </div>
    </section>
  );
}
