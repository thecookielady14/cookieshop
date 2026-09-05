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

/**
 * Umsatzsteuersatz. Kekse sind Lebensmittel und fallen unter den ermäßigten
 * Satz. Alle Preise im Shop sind Bruttopreise.
 */
export const VAT_PERCENTAGE = 7;

export const siteName = 'The Cookie Lady';
export const contactEmail = 'kontakt@thecookielady.de';

/**
 * Verantwortlicher Lebensmittelunternehmer (Art. 8 i.V.m. Art. 9 Abs. 1 lit. h
 * LMIV). Name und Anschrift müssen bei jedem Lebensmittel angegeben sein.
 */
export const foodBusinessOperator = {
    name: 'Tanja Lux – The Cookie Lady',
    street: 'Kissinger Straße 17',
    city: '86415 Mering',
    country: 'Deutschland',
};

/**
 * Pflichtangaben des Rechnungsstellers (§ 14 Abs. 4 UStG): vollständiger Name
 * und Anschrift sowie die USt-IdNr. Wird als Fußzeile in jede Stripe-Rechnung
 * geschrieben, damit die Angaben auch dann vorhanden sind, wenn im
 * Stripe-Dashboard einmal etwas fehlt.
 */
export const invoiceIssuer = [
    'Tanja Lux – The Cookie Lady',
    'Kissinger Straße 17, 86415 Mering',
    'USt-IdNr: DE460296346',
    contactEmail,
].join(' · ');
