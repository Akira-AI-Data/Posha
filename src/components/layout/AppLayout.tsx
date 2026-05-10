'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ShoppingCart, X } from 'lucide-react';
import { useSession } from 'next-auth/react';
import { AppSidebar } from './AppSidebar';
import { useShoppingReminder } from '@/hooks/useShoppingReminder';
import { resetIfFirstLogin } from '@/lib/firstLoginReset';
import { ThemeToggle } from '@/components/ui/ThemeToggle';

function ShoppingReminderToast() {
  const [reminder, setReminder] = useState<{ count: number } | null>(null);

  useEffect(() => {
    function handler(e: Event) {
      const detail = (e as CustomEvent).detail;
      setReminder({ count: detail.count });
    }
    window.addEventListener('posha-shopping-reminder', handler);
    return () => window.removeEventListener('posha-shopping-reminder', handler);
  }, []);

  if (!reminder) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300 max-w-sm">
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
          <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">Shopping Reminder</p>
          <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            You have {reminder.count} item{reminder.count > 1 ? 's' : ''} on your list. You&apos;re away from home — good time to shop!
          </p>
          <Link
            href="/shopping"
            className="inline-flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 mt-2 hover:underline"
            onClick={() => setReminder(null)}
          >
            View Shopping List →
          </Link>
        </div>
        <button
          onClick={() => setReminder(null)}
          className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors flex-shrink-0"
        >
          <X className="w-4 h-4 text-gray-400" />
        </button>
      </div>
    </div>
  );
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  useEffect(() => {
    resetIfFirstLogin(session?.user?.id);
  }, [session?.user?.id]);
  useShoppingReminder();

  return (
    <div className="flex min-h-screen bg-background">
      <div className="fixed right-4 top-4 z-50 hidden md:block">
        <ThemeToggle compact />
      </div>
      <AppSidebar />
      <main className="flex-1 min-w-0 pt-14 md:pt-0 overflow-y-auto">
        <div className="max-w-6xl mx-auto p-4 md:p-8 pb-24">
          {children}
        </div>
      </main>
      <ShoppingReminderToast />
    </div>
  );
}
