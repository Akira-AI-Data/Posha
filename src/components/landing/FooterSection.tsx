'use client';

import Link from 'next/link';
import { ScrollReveal } from './ScrollReveal';
import { ArrowRight, Sparkles } from 'lucide-react';

export function FooterSection() {
  return (
    <>
      <section className="section-spacing bg-[#F9F8F6]">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <ScrollReveal>
            <h2 className="font-heading text-4xl md:text-5xl tracking-tight leading-[1.15] font-medium text-[#1A241C] mb-6">
              Start your nutrition journey today
            </h2>
            <p className="text-base md:text-lg text-[#4A544C] leading-relaxed mb-10 max-w-xl mx-auto">
              Join 100,000+ families who plan, cook, and track smarter with Posha.
              Free to start, no credit card required.
            </p>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-10 py-4 rounded-full bg-[#1E3F20] text-white font-semibold text-base hover:bg-[#2A522D] transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              Get Started Free
              <ArrowRight className="w-5 h-5" />
            </Link>
          </ScrollReveal>
        </div>
      </section>

      <footer className="bg-[#1E3F20] text-[#F9F8F6] py-16 md:py-24">
        <div className="max-w-6xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
                <span className="font-heading font-semibold text-lg">Posha</span>
              </div>
              <p className="text-sm text-white/60 leading-relaxed">
                AI-powered nutrition and meal planning for the whole family.
              </p>
            </div>

            <div>
              <h4 className="font-heading font-medium text-sm uppercase tracking-wider text-white/40 mb-4">Product</h4>
              <ul className="space-y-3">
                <li><a href="#pricing" className="text-sm text-white/70 hover:text-white transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="text-sm text-white/70 hover:text-white transition-colors">How it works</a></li>
                <li><Link href="/cookbook" className="text-sm text-white/70 hover:text-white transition-colors">Cookbook</Link></li>
                <li><Link href="/meal-plan" className="text-sm text-white/70 hover:text-white transition-colors">Meal Planner</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-medium text-sm uppercase tracking-wider text-white/40 mb-4">Company</h4>
              <ul className="space-y-3">
                <li><span className="text-sm text-white/70">Built for practical, everyday nutrition</span></li>
                <li><span className="text-sm text-white/70">Weekly product improvements</span></li>
              </ul>
            </div>

            <div>
              <h4 className="font-heading font-medium text-sm uppercase tracking-wider text-white/40 mb-4">Support</h4>
              <ul className="space-y-3">
                <li><a href="mailto:rahulpagidi025@gmail.com" className="text-sm text-white/70 hover:text-white transition-colors">rahulpagidi025@gmail.com</a></li>
                <li><span className="text-sm text-white/70">Fast bug acknowledgement in-app and by email</span></li>
                <li><Link href="/settings" className="text-sm text-white/70 hover:text-white transition-colors">Profile & settings</Link></li>
                <li><Link href="/privacy" className="text-sm text-white/70 hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link href="/delete-account" className="text-sm text-white/70 hover:text-white transition-colors">Delete Account</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-white/40">
              &copy; 2026 Posha. All rights reserved.
            </p>
            <div className="flex items-center gap-6">
              <Link href="/privacy" className="text-xs text-white/40 hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/delete-account" className="text-xs text-white/40 hover:text-white transition-colors">
                Delete Account
              </Link>
              {['Twitter', 'Instagram', 'LinkedIn'].map((social) => (
                <a key={social} href="#" className="text-xs text-white/40 hover:text-white transition-colors">
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </>
  );
}
