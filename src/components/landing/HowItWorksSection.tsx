'use client';

import { ScrollReveal } from './ScrollReveal';
import { ChefHat, CalendarDays, Utensils, BarChart3 } from 'lucide-react';

const STEPS = [
  {
    step: '01',
    icon: ChefHat,
    title: 'Generate Recipes',
    desc: "AI creates personalized recipes from global cuisines, tailored to your family's ages, allergies, and preferences.",
    color: '#1E3F20',
  },
  {
    step: '02',
    icon: CalendarDays,
    title: 'Plan & Shop',
    desc: 'Drag recipes into your weekly meal plan. Get a smart shopping list that syncs with your pantry.',
    color: '#C05A45',
  },
  {
    step: '03',
    icon: Utensils,
    title: 'Cook & Track',
    desc: 'Log meals by photo, barcode, or description. Track calories, macros, and nutrition scores in real-time.',
    color: '#D68C45',
  },
  {
    step: '04',
    icon: BarChart3,
    title: 'Get Insights',
    desc: 'AI analyzes your nutrition, spots gaps, and gives personalized recommendations for your whole family.',
    color: '#3D7A42',
  },
];

export function HowItWorksSection() {
  return (
    <section id="how-it-works" className="section-spacing bg-white">
      <div className="max-w-6xl mx-auto px-6">
        <ScrollReveal>
          <div className="text-center mb-16">
            <p className="text-sm uppercase tracking-[0.2em] font-bold text-[#8A9A86] mb-4">How It Works</p>
            <h2 className="font-heading text-4xl md:text-5xl tracking-tight leading-[1.15] font-medium text-[#1A241C]">
              From recipe to results in four steps
            </h2>
            <p className="text-base md:text-lg text-[#4A544C] leading-relaxed mt-4 max-w-lg mx-auto">
              Getting started takes less than a minute. No complicated setup required.
            </p>
          </div>
        </ScrollReveal>

        <ScrollReveal>
          <div className="mb-20 grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div className="text-center lg:text-left">
              <p className="text-sm uppercase tracking-[0.2em] font-bold text-[#8A9A86] mb-4">See Posha In Action</p>
              <h3 className="font-heading text-3xl md:text-4xl tracking-tight leading-[1.15] font-medium text-[#1A241C]">
                Snap once. Get the nutrition breakdown instantly.
              </h3>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                {[
                  { label: 'Photo capture', value: '1 tap' },
                  { label: 'Nutrition view', value: 'Calories + macros' },
                  { label: 'Finish feeling', value: 'Track and eat' },
                ].map((item) => (
                  <div key={item.label} className="rounded-[8px] border border-[#E5E0D8] bg-[#F8F6F1] px-4 py-4 text-left">
                    <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#8A9A86]">{item.label}</p>
                    <p className="mt-2 text-sm font-semibold text-[#1A241C]">{item.value}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-[720px] rounded-[8px] border border-[#E5E0D8] bg-[#102416] p-3 shadow-[0_24px_80px_rgba(18,36,22,0.16)]">
                <div className="overflow-hidden rounded-[8px] bg-black">
                  <video
                    className="block aspect-video w-full bg-black object-contain"
                    poster="/videos/posha-promo-poster-landscape.png"
                    controls
                    playsInline
                    preload="metadata"
                  >
                    <source src="/videos/posha-promo-mobile.mp4" type="video/mp4" />
                  </video>
                </div>
                <a
                  href="/videos/posha-promo-mobile.mp4"
                  className="mt-3 block rounded-[8px] bg-white px-4 py-3 text-center text-sm font-semibold text-[#102416]"
                >
                  Open video
                </a>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="relative">
          <div className="hidden md:block absolute left-1/2 top-0 bottom-0 w-px bg-[#E5E0D8] -translate-x-1/2" />

          <div className="space-y-12 md:space-y-0 md:grid md:grid-cols-1 md:gap-0">
            {STEPS.map((step, i) => {
              const Icon = step.icon;
              const isEven = i % 2 === 0;
              return (
                <ScrollReveal key={step.step} delay={i * 0.15}>
                  <div
                    className={`relative md:flex md:items-center md:gap-12 ${
                      isEven ? 'md:flex-row' : 'md:flex-row-reverse'
                    } py-8`}
                  >
                    <div className={`md:w-1/2 ${isEven ? 'md:text-right md:pr-16' : 'md:text-left md:pl-16'}`}>
                      <span
                        className="inline-block text-xs uppercase tracking-[0.2em] font-bold mb-3 px-3 py-1 rounded-full"
                        style={{ color: step.color, backgroundColor: `${step.color}15` }}
                      >
                        Step {step.step}
                      </span>
                      <h3 className="font-heading text-2xl md:text-3xl tracking-tight font-medium text-[#1A241C] mb-3">
                        {step.title}
                      </h3>
                      <p className="text-sm text-[#4A544C] leading-relaxed max-w-sm mx-auto md:mx-0">
                        {step.desc}
                      </p>
                    </div>

                    <div
                      className="hidden md:flex absolute left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white border-2 items-center justify-center shadow-lg z-10"
                      style={{ borderColor: step.color }}
                    >
                      <Icon className="w-6 h-6" style={{ color: step.color }} />
                    </div>

                    <div className="hidden md:block md:w-1/2" />
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
