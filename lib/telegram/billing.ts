import { prisma } from '@/lib/db';
import { stripe, PLANS, BILLING_CURRENCY, PlanKey, TRIAL_PERIOD_DAYS } from '@/lib/stripe';

function baseUrl(): string {
  return process.env.NEXTAUTH_URL || '';
}

// Creates a Stripe Checkout link for the given plan, reusing the exact same
// tariffs/config as the web app. Returns null on failure.
export async function createCheckoutLink(userId: string, planKey: PlanKey): Promise<string | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  try {
    const plan = PLANS[planKey];
    const origin = baseUrl();
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return null;

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;
      await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
    }

    const checkout = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: BILLING_CURRENCY,
            unit_amount: plan.amount,
            recurring: { interval: plan.interval },
            product_data: { name: plan.productName },
          },
        },
      ],
      allow_promotion_codes: true,
      success_url: `${origin}/billing/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/billing`,
      metadata: { userId: user.id, plan: planKey },
      subscription_data: {
        metadata: { userId: user.id, plan: planKey },
        ...(TRIAL_PERIOD_DAYS > 0 ? { trial_period_days: TRIAL_PERIOD_DAYS } : {}),
      },
    });
    return checkout.url ?? null;
  } catch (e: any) {
    console.error('Bot checkout link error:', e?.message);
    return null;
  }
}

// Creates a Stripe Billing Portal link so the user can manage/cancel.
export async function createPortalLink(userId: string): Promise<string | null> {
  if (!process.env.STRIPE_SECRET_KEY) return null;
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) return null;
    const portal = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${baseUrl()}/profile`,
    });
    return portal.url ?? null;
  } catch (e: any) {
    console.error('Bot portal link error:', e?.message);
    return null;
  }
}
