// Best-effort geolocation for incoming requests. Never throws.
// Tries common CDN/proxy country headers first; falls back to a free IP lookup
// (cached in-memory per IP) when no header is present.

const ipCache = new Map<string, { country: string | null; at: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

function headerCountry(headers: Headers): string | null {
  const keys = [
    'x-vercel-ip-country',
    'cf-ipcountry',
    'x-country-code',
    'x-geo-country',
    'x-appengine-country',
  ];
  for (const k of keys) {
    const v = headers.get(k);
    if (v && v.length === 2 && v !== 'XX') return v.toUpperCase();
  }
  return null;
}

export function clientIp(headers: Headers): string | null {
  const xff = headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  return headers.get('x-real-ip') || null;
}

function isPrivateIp(ip: string): boolean {
  return (
    ip === '127.0.0.1' ||
    ip === '::1' ||
    ip.startsWith('10.') ||
    ip.startsWith('192.168.') ||
    ip.startsWith('172.16.') ||
    ip.startsWith('172.17.') ||
    ip.startsWith('172.18.') ||
    ip.startsWith('172.19.') ||
    ip.startsWith('172.2') ||
    ip.startsWith('172.30.') ||
    ip.startsWith('172.31.') ||
    ip.startsWith('fc') ||
    ip.startsWith('fd')
  );
}

async function lookupIp(ip: string): Promise<string | null> {
  const cached = ipCache.get(ip);
  if (cached && Date.now() - cached.at < CACHE_TTL) return cached.country;
  let country: string | null = null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    const res = await fetch(`https://ipwho.is/${encodeURIComponent(ip)}?fields=success,country_code`, {
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (res.ok) {
      const data: any = await res.json();
      if (data?.success && typeof data.country_code === 'string' && data.country_code.length === 2) {
        country = data.country_code.toUpperCase();
      }
    }
  } catch {
    // ignore — best effort
  }
  ipCache.set(ip, { country, at: Date.now() });
  return country;
}

// Resolve an ISO-2 country code for the request. Header first, then IP lookup.
export async function resolveCountry(headers: Headers): Promise<string | null> {
  const fromHeader = headerCountry(headers);
  if (fromHeader) return fromHeader;
  const ip = clientIp(headers);
  if (!ip || isPrivateIp(ip)) return null;
  return lookupIp(ip);
}
