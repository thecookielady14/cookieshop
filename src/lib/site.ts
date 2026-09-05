/**
 * Kanonische Basis-URL des Shops.
 *
 * Die Live-Domain leitet thecookielady.de per 301 auf www.thecookielady.de um –
 * deshalb ist www die kanonische Variante. Alle Metadaten, Sitemap-Einträge und
 * Stripe-Redirects müssen dieselbe URL verwenden, sonst zeigen Canonicals,
 * OG-Tags und Sitemap auf unterschiedliche Hosts.
 */
export const siteUrl = (
    process.env.NEXT_PUBLIC_BASE_URL || 'https://www.thecookielady.de'
).replace(/\/$/, '');

export const siteName = 'The Cookie Lady';
export const contactEmail = 'kontakt@thecookielady.de';
