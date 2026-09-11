import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';
import { supabase } from '@/lib/supabase';

const baseUrl = siteUrl;

/**
 * Bei jedem Abruf frisch erzeugen.
 *
 * Sonst friert Next die Sitemap beim Bauen ein: ein neu angelegtes Produkt
 * oder eine umbenannte Linie taucht erst beim nächsten Deploy auf – und
 * gelöschte Einträge bleiben stehen.
 */
export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
    const staticRoutes: MetadataRoute.Sitemap = [
        { url: `${baseUrl}/`, changeFrequency: 'weekly', priority: 1 },
        { url: `${baseUrl}/shop`, changeFrequency: 'weekly', priority: 0.9 },
        { url: `${baseUrl}/about`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/faq`, changeFrequency: 'monthly', priority: 0.5 },
        { url: `${baseUrl}/versand`, changeFrequency: 'monthly', priority: 0.4 },
        { url: `${baseUrl}/agb`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${baseUrl}/datenschutz`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${baseUrl}/impressum`, changeFrequency: 'yearly', priority: 0.2 },
        { url: `${baseUrl}/widerruf`, changeFrequency: 'yearly', priority: 0.2 },
    ];

    // Linien- und Produktseiten. Entwuerfe bleiben draussen - was nicht
    // bestellbar ist, gehört nicht in die Sitemap.
    let dynamicRoutes: MetadataRoute.Sitemap = [];
    try {
        const [{ data: lines }, { data: products }] = await Promise.all([
            supabase.from('product_lines').select('slug, updated_at').eq('is_active', true),
            supabase.from('products').select('id, updated_at').eq('is_available', true),
        ]);

        dynamicRoutes = [
            ...(lines ?? []).map((l) => ({
                url: `${baseUrl}/shop/${l.slug}`,
                lastModified: l.updated_at ? new Date(l.updated_at) : undefined,
                changeFrequency: 'weekly' as const,
                priority: 0.8,
            })),
            ...(products ?? []).map((p) => ({
                url: `${baseUrl}/produkt/${p.id}`,
                lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
                changeFrequency: 'weekly' as const,
                priority: 0.7,
            })),
        ];
    } catch {
        // DB nicht erreichbar - lieber nur die festen Seiten ausliefern
    }

    return [...staticRoutes, ...dynamicRoutes];
}
