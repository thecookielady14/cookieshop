/**
 * Bestellpositionen in Stripe-Metadata ablegen.
 *
 * Stripe erlaubt pro Metadata-Wert nur 500 Zeichen. Das frühere Format
 * (JSON-Array mit id/qty/price) brauchte ~66 Zeichen pro Position und riss das
 * Limit bereits ab 8 verschiedenen Produkten – die Bezahlung schlug dann
 * komplett fehl. Deshalb hier ein kompaktes Format ("uuid:menge:preis",
 * getrennt durch ";"), das zusätzlich auf mehrere Schlüssel verteilt wird.
 */

export interface CheckoutItem {
    id: string;
    qty: number;
    price: number;
}

const MAX_VALUE_LENGTH = 500;
const CHUNK_PREFIX = 'items_';

/** Baut `items_0`, `items_1`, … – jeder Wert bleibt unter dem Stripe-Limit. */
export function encodeItemsToMetadata(items: CheckoutItem[]): Record<string, string> {
    const entries = items.map((i) => `${i.id}:${i.qty}:${i.price.toFixed(2)}`);

    const chunks: string[] = [];
    let current = '';
    for (const entry of entries) {
        const candidate = current ? `${current};${entry}` : entry;
        if (candidate.length > MAX_VALUE_LENGTH) {
            if (current) chunks.push(current);
            current = entry;
        } else {
            current = candidate;
        }
    }
    if (current) chunks.push(current);

    const metadata: Record<string, string> = {};
    chunks.forEach((chunk, index) => {
        metadata[`${CHUNK_PREFIX}${index}`] = chunk;
    });
    return metadata;
}

/**
 * Liest die Positionen wieder aus. Versteht auch das alte JSON-Format, damit
 * Sessions, die kurz vor einem Deploy erstellt wurden, nicht verloren gehen.
 */
export function decodeItemsFromMetadata(
    metadata: Record<string, string> | null | undefined
): CheckoutItem[] {
    if (!metadata) return [];

    const items: CheckoutItem[] = [];

    for (let index = 0; ; index++) {
        const chunk = metadata[`${CHUNK_PREFIX}${index}`];
        if (!chunk) break;

        for (const entry of chunk.split(';')) {
            if (!entry) continue;
            const [id, qty, price] = entry.split(':');
            const parsedQty = parseInt(qty, 10);
            const parsedPrice = parseFloat(price);
            if (!id || isNaN(parsedQty) || isNaN(parsedPrice)) continue;
            items.push({ id, qty: parsedQty, price: parsedPrice });
        }
    }

    if (items.length > 0) return items;

    // Altes Format: metadata.items als JSON-Array
    if (metadata.items) {
        try {
            const legacy = JSON.parse(metadata.items);
            if (Array.isArray(legacy)) {
                return legacy
                    .filter((i) => i && i.id)
                    .map((i) => ({ id: i.id, qty: Number(i.qty), price: Number(i.price) }));
            }
        } catch {
            // unlesbare Metadata darf den Webhook nicht abbrechen
        }
    }

    return [];
}
