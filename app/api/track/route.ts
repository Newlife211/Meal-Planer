export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { headers, cookies } from 'next/headers';
import { prisma } from '@/lib/db';
import { resolveCountry } from '@/lib/geo';

const VISITOR_COOKIE = 'vid';
const ONE_YEAR = 60 * 60 * 24 * 365;

// Public endpoint. Records a single page view. Best-effort — always returns 200
// and never blocks the client. Skips bots and non-content paths.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    let path: string = typeof body?.path === 'string' ? body.path : '/';
    // Normalize: strip query/hash, cap length.
    path = path.split('?')[0].split('#')[0] || '/';
    if (path.length > 300) path = path.slice(0, 300);

    // Ignore internal / non-marketing paths.
    if (path.startsWith('/api') || path.startsWith('/_next') || path.startsWith('/admin')) {
      return NextResponse.json({ ok: true });
    }

    const h = headers();
    const ua = h.get('user-agent') || '';
    // Skip obvious bots/crawlers.
    if (/bot|crawler|spider|crawling|facebookexternalhit|slurp|bingpreview|headless/i.test(ua)) {
      return NextResponse.json({ ok: true });
    }

    // Visitor id (for unique-visitor counts).
    const jar = cookies();
    let visitorId = jar.get(VISITOR_COOKIE)?.value || null;
    let setCookie = false;
    if (!visitorId) {
      visitorId = randomUUID();
      setCookie = true;
    }

    const referrer = typeof body?.referrer === 'string' ? body.referrer.slice(0, 300) : null;
    const country = await resolveCountry(h);

    await prisma.pageView.create({
      data: { path, country, visitorId, referrer },
    });

    const res = NextResponse.json({ ok: true });
    if (setCookie && visitorId) {
      res.cookies.set(VISITOR_COOKIE, visitorId, {
        httpOnly: true,
        sameSite: 'lax',
        secure: true,
        path: '/',
        maxAge: ONE_YEAR,
      });
    }
    return res;
  } catch {
    return NextResponse.json({ ok: true });
  }
}
