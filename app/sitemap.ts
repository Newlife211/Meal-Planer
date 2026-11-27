import type { MetadataRoute } from 'next';
import { getSiteUrl, PUBLIC_ROUTES } from '@/lib/seo/site';
import { BLOG_SLUGS } from '@/lib/content/blog';
import { ALL_PLAN_SLUGS } from '@/lib/content/use-cases';

export const dynamic = 'force-dynamic';

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const now = new Date();

  const staticRoutes: MetadataRoute.Sitemap = PUBLIC_ROUTES.map((route) => ({
    url: `${site}${route === '/' ? '' : route}`,
    lastModified: now,
    changeFrequency: route === '/' ? 'weekly' : 'monthly',
    priority: route === '/' ? 1 : 0.6,
  }));

  const blogRoutes: MetadataRoute.Sitemap = BLOG_SLUGS.map((slug) => ({
    url: `${site}/blog/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  const useCaseRoutes: MetadataRoute.Sitemap = ALL_PLAN_SLUGS.map((slug) => ({
    url: `${site}/meal-plans/${slug}`,
    lastModified: now,
    changeFrequency: 'monthly',
    priority: 0.8,
  }));

  return [...staticRoutes, ...blogRoutes, ...useCaseRoutes];
}
