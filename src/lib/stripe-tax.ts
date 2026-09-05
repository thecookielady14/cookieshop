import type Stripe from 'stripe';
import { VAT_PERCENTAGE } from './site';

/**
 * Umsatzsteuer im Stripe-Checkout.
 *
 * Kekse sind Lebensmittel und fallen unter den ermäßigten Satz (VAT_PERCENTAGE
 * in lib/site.ts). Die Versandkosten teilen als Nebenleistung denselben Satz –
 * deshalb wird der Versand im Checkout als besteuerte Position geführt und
 * nicht als shipping_option: Stripe erlaubt an Versandoptionen keine
 * Steuersätze, der Versand bliebe dort unversteuert.
 *
 * Die Preise im Shop sind Bruttopreise, der Satz ist daher `inclusive`.
 */

/** Erkennungsmerkmal, um den eigenen Satz wiederzufinden statt Duplikate anzulegen. */
const VAT_MARKER_KEY = 'cookie_lady_vat';
const VAT_MARKER_VALUE = '7_inclusive';

// Steuersätze sind pro Stripe-Modus getrennt (Test und Live haben eigene IDs).
// Der Cache gilt deshalb immer nur für den gerade aktiven Modus.
let cachedTaxRateId: string | null = null;

/**
 * Liefert die ID des 7-%-Satzes. Existiert er im aktuellen Stripe-Modus noch
 * nicht, wird er angelegt – dadurch funktioniert die Umstellung auf Live-Keys
 * ohne manuellen Zwischenschritt.
 */
export async function getVatTaxRateId(stripe: Stripe): Promise<string> {
    if (process.env.STRIPE_TAX_RATE_ID) return process.env.STRIPE_TAX_RATE_ID;
    if (cachedTaxRateId) return cachedTaxRateId;

    const existing = await stripe.taxRates.list({ active: true, limit: 100 });
    const match = existing.data.find(
        (rate) =>
            rate.metadata?.[VAT_MARKER_KEY] === VAT_MARKER_VALUE ||
            (rate.percentage === VAT_PERCENTAGE && rate.inclusive && rate.country === 'DE')
    );

    if (match) {
        cachedTaxRateId = match.id;
        return match.id;
    }

    const created = await stripe.taxRates.create({
        display_name: 'MwSt',
        description: 'Ermäßigter Steuersatz für Lebensmittel',
        percentage: VAT_PERCENTAGE,
        inclusive: true,
        country: 'DE',
        metadata: { [VAT_MARKER_KEY]: VAT_MARKER_VALUE },
    });

    cachedTaxRateId = created.id;
    return created.id;
}
