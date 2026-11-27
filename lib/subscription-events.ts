import { prisma } from '@/lib/db';
import { stripe } from '@/lib/stripe';

export type SubEventType = 'new' | 'renewal' | 'canceled' | 'payment_failed';

export interface GeoPayment {
  country: string | null;
  paymentBrand: string | null;
  paymentType: string | null;
  cardLast4: string | null;
  amount: number | null;
  currency: string | null;
}

// Extracts geography + payment-method info for a subscription from Stripe. Uses
// the subscription's default payment method (card issuing country is the best geo
// proxy) and falls back to the customer's billing address country. Best-effort:
// never throws, returns nulls when data is unavailable.
export async function extractGeoPayment(params: {
  subscriptionId?: string | null;
  customerId?: string | null;
}): Promise<GeoPayment> {
  const result: GeoPayment = {
    country: null,
    paymentBrand: null,
    paymentType: null,
    cardLast4: null,
    amount: null,
    currency: null,
  };

  try {
    let sub: any = null;
    if (params.subscriptionId) {
      sub = await stripe.subscriptions.retrieve(params.subscriptionId, {
        expand: ['default_payment_method'],
      });
    }

    // Amount + currency from the subscription's first item price.
    const price = sub?.items?.data?.[0]?.price;
    if (price) {
      result.amount = typeof price.unit_amount === 'number' ? price.unit_amount : null;
      result.currency = price.currency ? String(price.currency).toUpperCase() : null;
    }

    // Payment method: prefer the subscription default PM.
    let pm: any = sub?.default_payment_method;
    if (pm && typeof pm === 'string') {
      pm = await stripe.paymentMethods.retrieve(pm);
    }
    const customerId =
      params.customerId ||
      (typeof sub?.customer === 'string' ? sub.customer : sub?.customer?.id) ||
      null;

    // Fall back to the customer's default PM if the subscription has none.
    if (!pm && customerId) {
      try {
        const cust: any = await stripe.customers.retrieve(customerId, {
          expand: ['invoice_settings.default_payment_method'],
        });
        pm = cust?.invoice_settings?.default_payment_method || null;
        if (pm && typeof pm === 'string') {
          pm = await stripe.paymentMethods.retrieve(pm);
        }
      } catch {
        /* ignore */
      }
    }

    if (pm) {
      result.paymentType = pm.type || null;
      const card = pm.card;
      if (card) {
        result.paymentBrand = card.brand || null;
        result.cardLast4 = card.last4 || null;
        if (card.country) result.country = String(card.country).toUpperCase();
      }
      // Billing address country as a fallback geo signal.
      if (!result.country && pm.billing_details?.address?.country) {
        result.country = String(pm.billing_details.address.country).toUpperCase();
      }
    }

    // Last resort: customer billing address country.
    if (!result.country && customerId) {
      try {
        const cust: any = await stripe.customers.retrieve(customerId);
        const c = cust?.address?.country || cust?.shipping?.address?.country;
        if (c) result.country = String(c).toUpperCase();
      } catch {
        /* ignore */
      }
    }
  } catch (e: any) {
    console.error('extractGeoPayment error:', e?.message);
  }

  return result;
}

// Persists a subscription lifecycle event for analytics. Best-effort: never
// throws so it cannot break the webhook flow.
export async function logSubscriptionEvent(params: {
  eventType: SubEventType;
  userId?: string | null;
  email?: string | null;
  name?: string | null;
  plan?: string | null;
  status?: string | null;
  amount?: number | null;
  currency?: string | null;
  country?: string | null;
  paymentBrand?: string | null;
  paymentType?: string | null;
  cardLast4?: string | null;
  stripeSubscriptionId?: string | null;
  stripeCustomerId?: string | null;
}): Promise<void> {
  try {
    await prisma.subscriptionEvent.create({
      data: {
        eventType: params.eventType,
        userId: params.userId ?? null,
        email: params.email ?? null,
        name: params.name ?? null,
        plan: params.plan ?? null,
        status: params.status ?? null,
        amount: params.amount ?? null,
        currency: params.currency ?? null,
        country: params.country ?? null,
        paymentBrand: params.paymentBrand ?? null,
        paymentType: params.paymentType ?? null,
        cardLast4: params.cardLast4 ?? null,
        stripeSubscriptionId: params.stripeSubscriptionId ?? null,
        stripeCustomerId: params.stripeCustomerId ?? null,
      },
    });
  } catch (e: any) {
    console.error('logSubscriptionEvent error:', e?.message);
  }
}
