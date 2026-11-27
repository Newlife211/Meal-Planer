// The single canonical domain for the site. All SEO output points here.
export const DEFAULT_SITE_URL = 'https://geteatwise.com';

// Public, indexable routes. Keep in sync with middleware's public allowlist.
export const PUBLIC_ROUTES = [
  '/',
  '/meal-plans',
  '/blog',
  '/faq',
  '/terms',
  '/privacy',
  '/refund',
];

// Resolves the absolute site origin used for ALL SEO output (canonical tags,
// structured data, sitemap, robots). This ALWAYS returns the single canonical
// domain, regardless of which host actually served the request. That way the
// app never competes with itself across multiple deployed domains — every
// alias points search engines to geteatwise.com as the one indexable origin.
export function getSiteUrl(): string {
  return DEFAULT_SITE_URL;
}
