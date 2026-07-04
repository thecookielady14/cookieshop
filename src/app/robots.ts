import type { MetadataRoute } from 'next';

const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://www.thecookielady.de';

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
