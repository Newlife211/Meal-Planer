import type { MetadataRoute } from 'next';
import { getSiteUrl } from '@/lib/seo/site';

export const dynamic = 'force-dynamic';

export default function robots(): MetadataRoute.Robots {
  const site = getSiteUrl();
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        // Keep private/authenticated and API areas out of the index.
        disallow: [
          '/api/',
          '/meal-plan',
          '/pantry',
          '/shopping-list',
          '/history',
          '/profile',
          '/billing',
          '/admin',
          '/support',
          '/onboarding',
          '/login',
          '/signup',
          '/forgot-password',
          '/reset-password',
        ],
      },
    ],
    sitemap: `${site}/sitemap.xml`,
    host: site,
  };
}
