import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { auth } from '@/lib/auth';
import { normalizePlan } from '@/lib/pricingTemplates';
import { isAdminEmail } from '@/lib/admin';

type PaidPlan = 'pro' | 'premium';

function getBaseUrl() {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    process.env.AUTH_URL ||
    process.env.NEXTAUTH_URL ||
    'https://www.myposha.com'
  );
}

async function resolveRecurringPriceId(stripe: Stripe, value: string) {
  if (value.startsWith('price_')) return value;
  if (!value.startsWith('prod_')) return value;

  const prices = await stripe.prices.list({
    product: value,
    active: true,
    limit: 10,
    expand: ['data.tiers'],
  });

  const monthly = prices.data.find(
    (price) => price.type === 'recurring' && price.recurring?.interval === 'month'
  );

  return monthly?.id;
}

export async function POST(req: Request) {
  let plan = 'free';

  try {
    const body = await req.json();
    plan = normalizePlan(body.plan);
  } catch {
    return NextResponse.json({ error: 'invalid request body' }, { status: 400 });
  }

  if (plan === 'free') {
    return NextResponse.json({ url: '/dashboard' });
  }

  const priceMap: Record<PaidPlan, string | undefined> = {
    pro: process.env.STRIPE_PRICE_PRO,
    premium: process.env.STRIPE_PRICE_PREMIUM,
  };

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json(
      { error: 'Stripe not configured yet. Add Stripe secret key and price IDs first.' },
      { status: 503 }
    );
  }

  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ url: '/login' }, { status: 401 });
  }
  if (isAdminEmail(session?.user?.email)) {
    return NextResponse.json({ url: '/dashboard' });
  }
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  const priceIdOrProductId = priceMap[plan as PaidPlan];
  const priceId = priceIdOrProductId
    ? await resolveRecurringPriceId(stripe, priceIdOrProductId)
    : undefined;

  if (!priceId) {
    return NextResponse.json(
      { error: `No active monthly Stripe price found for ${plan}.` },
      { status: 503 }
    );
  }

  const baseUrl = getBaseUrl();

  const checkoutSession = await stripe.checkout.sessions.create({
    mode: 'subscription',
    allow_promotion_codes: true,
    billing_address_collection: 'auto',
    customer_email: session?.user?.email || undefined,
    success_url: `${baseUrl}/pricing/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/pricing?checkout=cancelled&plan=${plan}`,
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      plan,
      userId: session?.user?.id || 'guest',
      email: session.user.email,
    },
  });

  return NextResponse.json({ url: checkoutSession.url });
}
