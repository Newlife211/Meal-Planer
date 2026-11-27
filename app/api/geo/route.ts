export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { resolveCountry } from '@/lib/geo';

// Public endpoint: returns the visitor's best-effort ISO-2 country code.
// Used by the client to pick a default UI language (Russia -> Russian, else English).
export async function GET(req: Request) {
  try {
    const country = await resolveCountry(req.headers);
    return NextResponse.json({ country });
  } catch {
    return NextResponse.json({ country: null });
  }
}
