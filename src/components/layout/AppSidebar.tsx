"use client"

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Camera,
  TrendingUp,
  ChefHat,
  BookmarkCheck,
  CalendarDays,
  Package,
  ShoppingCart,
  User as UserIcon,
  ChevronsRight,
  ChevronDown,
  LogOut,
  LifeBuoy,
  Sparkles,
  Menu,
  X,
} from "lucide-react";
import { useBillingAccess } from '@/hooks/useBillingAccess';

const menuItems = [
  { href: "/dashboard", icon: LayoutDashboard, title: "Dashboard" },
  { href: "/log", icon: Camera, title: "Log Food" },
  { href: "/progress", icon: TrendingUp, title: "Progress" },
  { href: "/cookbook", icon: ChefHat, title: "Cookbook" },
  { href: "/my-recipes", icon: BookmarkCheck, title: "My Recipes" },
  { href: "/meal-plan", icon: CalendarDays, title: "Meal Plan" },
  { href: "/pantry", icon: Package, title: "Pantry" },
  { href: "/shopping", icon: ShoppingCart, title: "Shopping" },
  { href: "/aiadvisor", icon: Sparkles, title: "AI Advisor" },
];

const accountItems = [
  { href: "/settings", icon: UserIcon, title: "Profile" },
];

export function AppSidebar() {
  const { plan, hasPro, hasPremium, isAdmin } = useBillingAccess();
  const [open, setOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName = session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const userPlan = isAdmin ? "Admin" : `${plan.charAt(0).toUpperCase()}${plan.slice(1)} Plan`;
  const visibleMenuItems = menuItems.filter((item) => {
    if (item.href === '/aiadvisor') return hasPremium;
    if (item.href === '/meal-plan' || item.href === '/shopping') return hasPro;
    return true;
  });

  const sidebarInner = (isMobile = false) => (
    <>
      {/* Title */}
      <div className="mb-6 border-b border-gray-200 dark:border-gray-800 pb-4">
        <div className="flex cursor-pointer items-center justify-between rounded-md p-2 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800">
          <div className="flex items-center gap-3 min-w-0">
            <Logo />
            <div
              className="overflow-hidden transition-all duration-300 ease-in-out"
              style={{ width: open || isMobile ? undefined : 0, opacity: open || isMobile ? 1 : 0 }}
            >
              <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                Posha
              </span>
              <span className="block text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                {userName} · {userPlan}
              </span>
            </div>
          </div>
          <ChevronDown
            className="h-4 w-4 text-gray-400 dark:text-gray-500 flex-shrink-0 transition-all duration-300"
            style={{ opacity: open || isMobile ? 1 : 0, width: open || isMobile ? undefined : 0 }}
          />
        </div>
      </div>

      {/* Main nav */}
      <div className="space-y-1 mb-8">
        {visibleMenuItems.map((item) => (
          <Option
            key={item.href}
            Icon={item.icon}
            title={item.title}
            href={item.href}
            selected={pathname === item.href || pathname.startsWith(item.href + "/")}
            open={open || isMobile}
            onClick={() => setMobileOpen(false)}
          />
        ))}
      </div>

      {/* Account section */}
      <div className="border-t border-gray-200 dark:border-gray-800 pt-4 space-y-1">
        <div
          className="overflow-hidden transition-all duration-300 ease-in-out"
          style={{ maxHeight: open || isMobile ? 32 : 0, opacity: open || isMobile ? 1 : 0 }}
        >
          <div className="px-3 py-2 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide whitespace-nowrap">
            Account
          </div>
        </div>
        {accountItems.map((item) => (
          <Option
            key={item.href}
            Icon={item.icon}
            title={item.title}
            href={item.href}
            selected={pathname === item.href}
            open={open || isMobile}
            onClick={() => setMobileOpen(false)}
          />
        ))}
        <a
          href="mailto:support@posha.app?subject=Posha%20Support"
          className="relative flex h-11 w-full items-center rounded-md text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200"
        >
          <div className="grid h-full w-12 place-content-center flex-shrink-0">
            <LifeBuoy className="h-4 w-4" />
          </div>
          <span
            className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out"
            style={{ opacity: open || isMobile ? 1 : 0, maxWidth: open || isMobile ? 160 : 0 }}
          >
            Support
          </span>
        </a>
        {/* Sign Out */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="relative flex h-11 w-full items-center rounded-md text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100 transition-all duration-200"
        >
          <div className="grid h-full w-12 place-content-center flex-shrink-0">
            <LogOut className="h-4 w-4" />
          </div>
          <span
            className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out"
            style={{ opacity: open || isMobile ? 1 : 0, maxWidth: open || isMobile ? 160 : 0 }}
          >
            Sign Out
          </span>
        </button>
      </div>

      {/* Spacer for toggle button */}
      <div className="h-14 flex-shrink-0" />
      <ToggleClose open={open} setOpen={setOpen} />
    </>
  );

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white/95 dark:bg-gray-950/95 border-b border-gray-200 dark:border-gray-800 z-40 h-16 flex items-center px-4 shadow-sm backdrop-blur-md">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        >
          <Menu className="h-5 w-5 text-gray-600 dark:text-gray-400" />
        </button>
        <Link href="/dashboard" className="flex items-center gap-2.5 ml-3">
          <Logo />
          <span className="text-base font-semibold text-gray-900 dark:text-gray-100">Posha</span>
        </Link>
      </header>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <nav
        className={`fixed inset-y-0 left-0 z-50 w-64 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm transition-transform duration-300 md:hidden ${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-end p-2">
          <button
            onClick={() => setMobileOpen(false)}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-500" />
          </button>
        </div>
        {sidebarInner(true)}
      </nav>

      {/* Desktop sidebar */}
      <nav
        className={`hidden md:flex flex-col fixed top-0 left-0 h-screen z-40 border-r transition-all duration-300 ease-in-out overflow-hidden ${
          open ? "w-64" : "w-16"
        } border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 shadow-sm`}
      >
        {sidebarInner(false)}
      </nav>

      {/* Spacer to offset fixed sidebar */}
      <div className={`hidden md:block shrink-0 transition-all duration-300 ease-in-out ${open ? "w-64" : "w-16"}`} />
    </>
  );
}

const Option = ({
  Icon,
  title,
  href,
  selected,
  open,
  onClick,
}: {
  Icon: React.ComponentType<{ className?: string }>;
  title: string;
  href: string;
  selected: boolean;
  open: boolean;
  onClick?: () => void;
}) => {
  return (
    <Link
      href={href}
      onClick={onClick}
      className={`relative flex h-11 w-full items-center rounded-md transition-all duration-200 ${
        selected
          ? "bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 shadow-sm border-l-2 border-green-600 font-semibold"
          : "text-gray-700 dark:text-gray-300 hover:bg-white/60 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-gray-100"
      }`}
    >
      <div className="grid h-full w-12 place-content-center flex-shrink-0">
        <Icon className="h-4 w-4" />
      </div>
      <span
        className="text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out"
        style={{ opacity: open ? 1 : 0, maxWidth: open ? 160 : 0 }}
      >
        {title}
      </span>
    </Link>
  );
};

const Logo = () => {
  return (
    <div className="grid size-10 shrink-0 place-content-center rounded-lg bg-[#1E3F20] shadow-sm">
      <Sparkles className="w-5 h-5 text-white" />
    </div>
  );
};

const ToggleClose = ({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) => {
  return (
    <button
      onClick={() => setOpen(!open)}
      className="absolute bottom-0 left-0 right-0 border-t border-gray-200 dark:border-gray-800 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 hidden md:block"
    >
      <div className="flex items-center p-3">
        <div className="grid size-10 place-content-center flex-shrink-0">
          <ChevronsRight
            className={`h-4 w-4 transition-transform duration-300 text-gray-500 dark:text-gray-400 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
        <span
          className="text-sm font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap overflow-hidden transition-all duration-300 ease-in-out"
          style={{ opacity: open ? 1 : 0, maxWidth: open ? 120 : 0 }}
        >
          Collapse
        </span>
      </div>
    </button>
  );
};

export default AppSidebar;
