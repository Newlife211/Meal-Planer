'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

// Fires a lightweight page-view beacon on every navigation. Excludes the admin
// area so admin browsing doesn't inflate visit stats.
export function VisitTracker() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname) return;
    if (pathname.startsWith('/admin')) return;
    try {
      fetch('/api/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          path: pathname,
          referrer: typeof document !== 'undefined' ? document.referrer || null : null,
        }),
        keepalive: true,
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, [pathname]);

  return null;
}
