import type { MetadataRoute } from 'next';
import { supabase } from '@/lib/supabase';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.thecookielady.de';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1 },
        { url: `${baseUrl}/shop`, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/faq`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/agb`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${baseUrl}/datenschutz`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${baseUrl}/impressum`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${baseUrl}/widerruf`, changeFrequency: 'yearly', priority: 0.2 },
    ];

    // Product detail pages (products are publicly readable)
    let productRoutes: MetadataRoute.Sitemap = [];
    try {
        const { data: products } = await supabase
            .from('products')
            .select('id, updated_at');
        productRoutes = (products ?? []).map((p) => ({
            url: `${baseUrl}/shop/${p.id}`,
            lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
            changeFrequency: 'weekly' as const,
            priority: 0.8,
        }));
    } catch {
        // DB unreachable – deliver static routes only rather than failing the sitemap
    }

    return [...staticRoutes, ...productRoutes];
}
