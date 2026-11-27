import { prisma } from '@/lib/db';

// Free-tier limits.
export const FREE_PLANS_PER_WEEK = 1;
export const FREE_REPLACES_PER_MONTH = 3;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

function monthAhead(from: Date): Date {
  const d = new Date(from);
  d.setMonth(d.getMonth() + 1);
  return d;
}

type SubUser = {
  subscriptionStatus?: string | null;
  subscriptionPeriodEnd?: Date | null;
};

export function isPremium(user: SubUser | null | undefined): boolean {
  if (!user) return false;
  const active =
    user.subscriptionStatus === 'active' || user.subscriptionStatus === 'trialing';
  if (!active) return false;
  // If we have a period end recorded, treat an expired period as not premium.
  if (user.subscriptionPeriodEnd && user.subscriptionPeriodEnd.getTime() < Date.now()) {
    return false;
  }
  return true;
}

export interface UsageView {
  isPremium: boolean;
  status: string;
  plan: string | null;
  periodEnd: string | null;
  plans: { used: number; limit: number; resetAt: string | null };
  replaces: { used: number; limit: number; resetAt: string | null };
}

// Read-only view of the user's subscription + usage, applying lazy window resets
// in-memory (does not mutate the DB).
export async function getUsageView(userId: string): Promise<UsageView> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  const now = Date.now();
  const premium = isPremium(user);

  let planUsed = user?.planGenCount ?? 0;
  let planReset = user?.planGenResetAt ?? null;
  if (!planReset || planReset.getTime() < now) {
    planUsed = 0;
    planReset = null;
  }

  let repUsed = user?.replaceCount ?? 0;
  let repReset = user?.replaceResetAt ?? null;
  if (!repReset || repReset.getTime() < now) {
    repUsed = 0;
    repReset = null;
  }

  return {
    isPremium: premium,
    status: user?.subscriptionStatus ?? 'free',
    plan: user?.subscriptionPlan ?? null,
    periodEnd: user?.subscriptionPeriodEnd?.toISOString() ?? null,
    plans: {
      used: planUsed,
      limit: FREE_PLANS_PER_WEEK,
      resetAt: planReset?.toISOString() ?? null,
    },
    replaces: {
      used: repUsed,
      limit: FREE_REPLACES_PER_MONTH,
      resetAt: repReset?.toISOString() ?? null,
    },
  };
}

export interface ConsumeResult {
  allowed: boolean;
  isPremium: boolean;
  used: number;
  limit: number;
  resetAt: string | null;
}

// Checks whether the user may perform an action of the given kind and, if so,
// consumes one unit of quota. Premium users are always allowed and never
// counted. Windows reset lazily when expired.
export async function checkAndConsume(
  userId: string,
  kind: 'plan' | 'replace'
): Promise<ConsumeResult> {
  const user = await prisma.user.findUnique({ where: { id: userId } });

  if (isPremium(user)) {
    return { allowed: true, isPremium: true, used: 0, limit: 0, resetAt: null };
  }

  const now = new Date();
  const limit = kind === 'plan' ? FREE_PLANS_PER_WEEK : FREE_REPLACES_PER_MONTH;

  const currentCount =
    kind === 'plan' ? user?.planGenCount ?? 0 : user?.replaceCount ?? 0;
  const currentReset =
    kind === 'plan' ? user?.planGenResetAt ?? null : user?.replaceResetAt ?? null;

  // Determine effective count considering window expiry.
  let effectiveCount = currentCount;
  let effectiveReset = currentReset;
  if (!currentReset || currentReset.getTime() < now.getTime()) {
    effectiveCount = 0;
    effectiveReset = kind === 'plan' ? new Date(now.getTime() + WEEK_MS) : monthAhead(now);
  }

  if (effectiveCount >= limit) {
    return {
      allowed: false,
      isPremium: false,
      used: effectiveCount,
      limit,
      resetAt: effectiveReset?.toISOString() ?? null,
    };
  }

  const newCount = effectiveCount + 1;
  const data =
    kind === 'plan'
      ? { planGenCount: newCount, planGenResetAt: effectiveReset }
      : { replaceCount: newCount, replaceResetAt: effectiveReset };

  await prisma.user.update({ where: { id: userId }, data });

  return {
    allowed: true,
    isPremium: false,
    used: newCount,
    limit,
    resetAt: effectiveReset?.toISOString() ?? null,
  };
}

// ---- Stripe -> DB sync helpers ----

export function subscriptionPeriodEndUnix(sub: any): number | null {
  return sub?.items?.data?.[0]?.current_period_end ?? sub?.current_period_end ?? null;
}

export function subscriptionPlanKey(sub: any): string | null {
  return sub?.metadata?.plan ?? null;
}

export async function findUserByCustomerId(customerId: string) {
  if (!customerId) return null;
  return prisma.user.findFirst({ where: { stripeCustomerId: customerId } });
}

export async function applyStripeSubscription(params: {
  userId: string;
  subscriptionId?: string | null;
  status: string;
  plan?: string | null;
  periodEndUnix?: number | null;
  customerId?: string | null;
}): Promise<void> {
  await prisma.user.update({
    where: { id: params.userId },
    data: {
      ...(params.subscriptionId ? { stripeSubscriptionId: params.subscriptionId } : {}),
      subscriptionStatus: params.status,
      ...(params.plan ? { subscriptionPlan: params.plan } : {}),
      subscriptionPeriodEnd:
        params.periodEndUnix != null ? new Date(params.periodEndUnix * 1000) : undefined,
      ...(params.customerId ? { stripeCustomerId: params.customerId } : {}),
    },
  });
}
