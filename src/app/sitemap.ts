import type { MetadataRoute } from 'next';

import { getAllBlogSlugs, getAllCategories, getAllToolSlugs } from '@/lib/supabase/queries';

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'https://freehub.kr';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, toolSlugs, blogSlugs] = await Promise.all([
    getAllCategories(),
    getAllToolSlugs(),
    getAllBlogSlugs().catch(() => [] as string[]),
  ]);

  const home: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
  ];

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/compare`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];

  const categoryPages: MetadataRoute.Sitemap = categories.map((category) => ({
    url: `${BASE_URL}/category/${category.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const toolPages: MetadataRoute.Sitemap = toolSlugs.map((slug) => ({
    url: `${BASE_URL}/tool/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const blogPages: MetadataRoute.Sitemap = blogSlugs.map((slug) => ({
    url: `${BASE_URL}/blog/${slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...home, ...categoryPages, ...staticPages, ...toolPages, ...blogPages];
}
