import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { isAdminEmail } from '@/lib/admin';
import {
  BILLING_PLAN_COOKIE,
  BILLING_PLAN_EMAIL_COOKIE,
  BILLING_PLAN_SIG_COOKIE,
  normalizeBillingPlan,
} from '@/lib/billing';
import { signBillingAccess } from '@/lib/billing-node';

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'login required' }, { status: 401 });
  }

  if (isAdminEmail(session.user.email)) {
    return NextResponse.json({ ok: true, plan: 'premium', admin: true });
  }

  if (!process.env.STRIPE_SECRET_KEY || !process.env.AUTH_SECRET) {
    return NextResponse.json({ error: 'billing not configured' }, { status: 503 });
  }

  const url = new URL(req.url);
  const sessionId = url.searchParams.get('session_id');
  if (!sessionId) {
    return NextResponse.json({ error: 'missing session_id' }, { status: 400 });
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);
  const plan = normalizeBillingPlan(checkoutSession.metadata?.plan);
  const paid =
    checkoutSession.payment_status === 'paid' ||
    checkoutSession.status === 'complete' ||
    Boolean(checkoutSession.subscription);

  if (!paid || plan === 'free') {
    return NextResponse.json({ error: 'payment not completed' }, { status: 400 });
  }

  const email = session.user.email.trim().toLowerCase();
  const checkoutEmail =
    checkoutSession.customer_details?.email?.trim().toLowerCase() ||
    checkoutSession.metadata?.email?.trim().toLowerCase();

  if (checkoutEmail && checkoutEmail !== email) {
    return NextResponse.json({ error: 'session email mismatch' }, { status: 403 });
  }

  const signature = signBillingAccess(plan, email, process.env.AUTH_SECRET);
  const response = NextResponse.json({ ok: true, plan });
  const cookieOptions = {
    path: '/',
    sameSite: 'lax' as const,
    secure: true,
    maxAge: 60 * 60 * 24 * 30,
  };

  response.cookies.set(BILLING_PLAN_COOKIE, plan, cookieOptions);
  response.cookies.set(BILLING_PLAN_EMAIL_COOKIE, email, cookieOptions);
  response.cookies.set(BILLING_PLAN_SIG_COOKIE, signature, cookieOptions);
  return response;
}
