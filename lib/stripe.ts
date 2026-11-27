import Stripe from 'stripe';

// Server-side Stripe client. The API version is omitted so the account default
// (a recent Basil version) is used, which supports flexible subscription billing.
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  typescript: true,
});

export type PlanKey = 'monthly' | 'yearly';

interface PlanConfig {
  key: PlanKey;
  amount: number; // in cents (USD)
  interval: 'month' | 'year';
  productName: string;
}

// Premium subscription plans. Billed in USD. Prices are defined inline via
// price_data at checkout time, so no pre-created Stripe Price IDs are required.
export const PLANS: Record<PlanKey, PlanConfig> = {
  monthly: {
    key: 'monthly',
    amount: 799, // $7.99 / month
    interval: 'month',
    productName: 'Eatwise Premium (Monthly)',
  },
  yearly: {
    key: 'yearly',
    amount: 5999, // $59.99 / year (~37% off)
    interval: 'year',
    productName: 'Eatwise Premium (Yearly)',
  },
};

export const BILLING_CURRENCY = 'usd';

// Free trial length (in days) applied to new Premium subscriptions. The card is
// collected up front and the first charge happens automatically after the trial
// ends. Set to 0 to disable trials entirely.
export const TRIAL_PERIOD_DAYS = 7;
