import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site';

const baseUrl = siteUrl;

export default function robots(): MetadataRoute.Robots {
    return {
        rules: {
            userAgent: '*',
            allow: '/',
            disallow: ['/admin', '/api', '/cart', '/success'],
        },
        sitemap: `${baseUrl}/sitemap.xml`,
    };
}
