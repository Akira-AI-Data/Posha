import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import {
  BILLING_PLAN_COOKIE,
  BILLING_PLAN_EMAIL_COOKIE,
  BILLING_PLAN_SIG_COOKIE,
  getRequiredPlanForPath,
  hasPlanAccess,
  normalizeBillingPlan,
} from '@/lib/billing';
import { signBillingAccessEdge } from '@/lib/billing-edge';
import { NextResponse } from 'next/server';

export default auth(async (req) => {
  const isLoggedIn = !!req.auth;
  const { pathname } = req.nextUrl;
  const host = req.nextUrl.hostname;

  if (
    host === 'myposha.com' ||
    host === 'calorieai-omega.vercel.app'
  ) {
    const redirectUrl = req.nextUrl.clone();
    redirectUrl.hostname = 'www.myposha.com';
    redirectUrl.protocol = 'https:';
    return NextResponse.redirect(redirectUrl, 308);
  }

  // Allow auth and public billing API routes
  if (
    pathname.startsWith('/api/auth') ||
    pathname === '/api/billing/checkout' ||
    pathname === '/api/billing/confirm'
  ) {
    return NextResponse.next();
  }

  // Allow public assets
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    pathname.startsWith('/icons') ||
    pathname.startsWith('/videos') ||
    pathname === '/sw.js' ||
    pathname === '/manifest.json'
  ) {
    return NextResponse.next();
  }

  // Public pages accessible to everyone
  const publicPages = ['/', '/pricing', '/login', '/pricing/success', '/privacy', '/delete-account', '/auth/mobile-callback'];
  const isPublicPage = publicPages.includes(pathname);

  // Allow public pages
  if (isPublicPage) {
    return NextResponse.next();
  }

  // Redirect unauthenticated users to login
  if (!isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  const requiredPlan = getRequiredPlanForPath(pathname);
  if (requiredPlan) {
    const email = req.auth?.user?.email?.trim().toLowerCase();
    if (!isAdminEmail(email)) {
      const plan = normalizeBillingPlan(req.cookies.get(BILLING_PLAN_COOKIE)?.value);
      const planEmail = req.cookies.get(BILLING_PLAN_EMAIL_COOKIE)?.value?.trim().toLowerCase() || '';
      const sig = req.cookies.get(BILLING_PLAN_SIG_COOKIE)?.value || '';
      const secret = process.env.AUTH_SECRET || '';
      const expectedSig =
        email && planEmail === email && sig && secret
          ? await signBillingAccessEdge(plan, email, secret)
          : '';
      const hasAccess = planEmail === email && sig === expectedSig && hasPlanAccess(plan, requiredPlan);

      if (!hasAccess) {
        const upgradeUrl = req.nextUrl.clone();
        upgradeUrl.pathname = '/pricing';
        upgradeUrl.searchParams.set('upgrade', requiredPlan);
        upgradeUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(upgradeUrl);
      }
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
