export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import {
  applyStripeSubscription,
  findUserByCustomerId,
  subscriptionPeriodEndUnix,
  subscriptionPlanKey,
} from '@/lib/subscription';
import { prisma } from '@/lib/db';
import { notifyAdminNewSubscription } from '@/lib/telegram/notify';
import { extractGeoPayment, logSubscriptionEvent } from '@/lib/subscription-events';

// Stripe webhook for subscription lifecycle (renewals, cancellations, payment
// failures). Requires STRIPE_WEBHOOK_SECRET to be configured. The raw request
// body is required for signature verification.
export async function POST(request: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('STRIPE_WEBHOOK_SECRET not configured; ignoring webhook.');
    return NextResponse.json({ received: true, skipped: true });
  }

  const sig = request.headers.get('stripe-signature');
  if (!sig) {
    return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
  }

  let event: any;
  try {
    const rawBody = await request.text();
    event = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err?.message);
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const s = event.data.object;
        const userId = s?.metadata?.userId;
        const subId = typeof s?.subscription === 'string' ? s.subscription : s?.subscription?.id;
        if (userId && subId) {
          const sub: any = await stripe.subscriptions.retrieve(subId);
          const planKey = subscriptionPlanKey(sub) || (s?.metadata?.plan ?? null);
          await applyStripeSubscription({
            userId,
            subscriptionId: sub.id,
            status: sub.status || 'active',
            plan: planKey,
            periodEndUnix: subscriptionPeriodEndUnix(sub),
            customerId: typeof s?.customer === 'string' ? s.customer : null,
          });
          const customerId = typeof s?.customer === 'string' ? s.customer : s?.customer?.id ?? null;
          const u = await prisma.user.findUnique({ where: { id: userId }, select: { name: true, email: true } });
          // Capture geography + payment method for analytics.
          try {
            const gp = await extractGeoPayment({ subscriptionId: sub.id, customerId });
            await logSubscriptionEvent({
              eventType: 'new',
              userId,
              email: u?.email ?? null,
              name: u?.name ?? null,
              plan: planKey,
              status: sub.status || 'active',
              amount: gp.amount,
              currency: gp.currency,
              country: gp.country,
              paymentBrand: gp.paymentBrand,
              paymentType: gp.paymentType,
              cardLast4: gp.cardLast4,
              stripeSubscriptionId: sub.id,
              stripeCustomerId: customerId,
            });
          } catch (e: any) {
            console.error('logSubscriptionEvent(new) error:', e?.message);
          }
          // Notify the system Telegram group about the new subscription.
          try {
            await notifyAdminNewSubscription(u?.name ?? null, u?.email ?? null, planKey);
          } catch (e: any) {
            console.error('notifyAdminNewSubscription error:', e?.message);
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const sub: any = event.data.object;
        let userId = sub?.metadata?.userId as string | undefined;
        if (!userId && sub?.customer) {
          const user = await findUserByCustomerId(
            typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
          );
          userId = user?.id;
        }
        if (userId) {
          await applyStripeSubscription({
            userId,
            subscriptionId: sub.id,
            status: sub.status || 'active',
            plan: subscriptionPlanKey(sub),
            periodEndUnix: subscriptionPeriodEndUnix(sub),
            customerId: typeof sub.customer === 'string' ? sub.customer : null,
          });
        }
        break;
      }
      case 'invoice.payment_failed': {
        const inv: any = event.data.object;
        const customerId = typeof inv?.customer === 'string' ? inv.customer : inv?.customer?.id;
        if (customerId) {
          const user = await findUserByCustomerId(customerId);
          if (user?.id) {
            await applyStripeSubscription({
              userId: user.id,
              status: 'past_due',
            });
            await logSubscriptionEvent({
              eventType: 'payment_failed',
              userId: user.id,
              email: user.email ?? null,
              name: user.name ?? null,
              plan: user.subscriptionPlan ?? null,
              status: 'past_due',
              amount: typeof inv?.amount_due === 'number' ? inv.amount_due : null,
              currency: inv?.currency ? String(inv.currency).toUpperCase() : null,
              stripeSubscriptionId: user.stripeSubscriptionId ?? null,
              stripeCustomerId: customerId,
            });
          }
        }
        break;
      }
      case 'customer.subscription.deleted': {
        const sub: any = event.data.object;
        let userId = sub?.metadata?.userId as string | undefined;
        if (!userId && sub?.customer) {
          const user = await findUserByCustomerId(
            typeof sub.customer === 'string' ? sub.customer : sub.customer?.id
          );
          userId = user?.id;
        }
        if (userId) {
          await applyStripeSubscription({
            userId,
            subscriptionId: sub.id,
            status: 'canceled',
            periodEndUnix: subscriptionPeriodEndUnix(sub),
          });
          try {
            const u = await prisma.user.findUnique({
              where: { id: userId },
              select: { name: true, email: true, subscriptionPlan: true },
            });
            await logSubscriptionEvent({
              eventType: 'canceled',
              userId,
              email: u?.email ?? null,
              name: u?.name ?? null,
              plan: subscriptionPlanKey(sub) || u?.subscriptionPlan || null,
              status: 'canceled',
              stripeSubscriptionId: sub.id,
              stripeCustomerId: typeof sub.customer === 'string' ? sub.customer : null,
            });
          } catch (e: any) {
            console.error('logSubscriptionEvent(canceled) error:', e?.message);
          }
        }
        break;
      }
      default:
        break;
    }
  } catch (err: any) {
    console.error('Webhook handler error:', err?.message);
    return NextResponse.json({ error: 'Handler error' }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
