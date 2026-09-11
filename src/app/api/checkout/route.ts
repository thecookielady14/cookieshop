import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { getShopSettings, calculateShipping, DEFAULT_ORDERS_CLOSED_MESSAGE } from '@/lib/shop-settings';
import { encodeItemsToMetadata } from '@/lib/checkout-items';
import { getVatTaxRateId } from '@/lib/stripe-tax';
import { siteUrl, invoiceIssuer } from '@/lib/site';
import { describeComposition, validateSelection } from '@/lib/catalog';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

/** Eine Position, wie sie der Browser schickt. Preise kommen nie von dort. */
interface IncomingItem {
    id: string;
    quantity: number;
    varieties?: { varietyId: string; quantity: number }[];
}

/**
 * Produktzeile samt fester Zusammensetzung. Der Typ steht hier explizit, weil
 * die verschachtelte Supabase-Abfrage sonst nicht abgeleitet werden kann.
 */
interface ProductRow {
    id: string;
    name: string;
    price: number | string;
    image_url: string | null;
    is_available: boolean;
    kind: 'fixed' | 'configurable';
    piece_count: number | null;
    line_id: string;
    product_varieties: {
        variety_id: string;
        quantity: number;
        varieties: { id: string; name: string; is_available: boolean } | null;
    }[] | null;
}

/** Eine geprüfte Position, wie sie in Stripe und in den Entwurf geht. */
interface ResolvedItem {
    product_id: string;
    name: string;
    quantity: number;
    price: number;
    varieties: { variety_id: string; name: string; quantity: number }[];
}

export async function POST(req: Request) {
    try {
        const { items } = (await req.json()) as { items?: IncomingItem[] };

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Dein Warenkorb ist leer.' }, { status: 400 });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Die Bezahlung ist gerade nicht konfiguriert. Bitte melde dich unter kontakt@thecookielady.de.' },
                { status: 500 }
            );
        }

        // Bestellannahme geschlossen? Das ist die maßgebliche Prüfung – die
        // Hinweise im Shop sind nur Anzeige und lassen sich umgehen.
        const shopSettings = await getShopSettings();
        if (!shopSettings.ordersOpen) {
            return NextResponse.json(
                { error: shopSettings.ordersClosedMessage || DEFAULT_ORDERS_CLOSED_MESSAGE },
                { status: 503 }
            );
        }

        // Produkte samt fester Zusammensetzung aus der Datenbank – der Browser
        // liefert nur IDs und Mengen, niemals Preise.
        const productIds = items.map((i) => i.id);
        const { data: productRows, error: dbError } = await supabase
            .from('products')
            .select(
                'id, name, price, image_url, is_available, kind, piece_count, line_id, ' +
                'product_varieties(variety_id, quantity, varieties(id, name, is_available))'
            )
            .in('id', productIds);

        if (dbError || !productRows) {
            return NextResponse.json(
                { error: 'Die Produkte konnten gerade nicht geladen werden. Bitte versuche es in einem Moment noch einmal.' },
                { status: 503 }
            );
        }

        const dbProducts = productRows as unknown as ProductRow[];

        // Wählbare Sorten je Linie – nur für Kartons zum Selbstzusammenstellen.
        const configurableLineIds = [
            ...new Set(dbProducts.filter((p) => p.kind === 'configurable').map((p) => p.line_id)),
        ];
        const { data: lineVarieties } = configurableLineIds.length
            ? await supabase
                  .from('varieties')
                  .select('id, name, line_id')
                  .eq('is_available', true)
                  .in('line_id', configurableLineIds)
            : { data: [] as { id: string; name: string; line_id: string }[] };

        const taxRateId = await getVatTaxRateId(stripe);
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        const resolved: ResolvedItem[] = [];

        for (const item of items) {
            const product = dbProducts.find((p) => p.id === item.id);

            if (!product) {
                return NextResponse.json(
                    { error: 'Ein Artikel in deinem Warenkorb ist nicht mehr verfügbar. Bitte lade die Seite neu.' },
                    { status: 400 }
                );
            }
            if (product.is_available === false) {
                return NextResponse.json(
                    { error: `"${product.name}" ist zurzeit leider nicht bestellbar.` },
                    { status: 400 }
                );
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return NextResponse.json(
                    { error: `Ungültige Menge bei "${product.name}".` },
                    { status: 400 }
                );
            }

            let composition: { variety_id: string; name: string; quantity: number }[];

            if (product.kind === 'configurable') {
                const allowed = (lineVarieties ?? [])
                    .filter((v) => v.line_id === product.line_id)
                    .map((v) => ({ id: v.id, name: v.name }));

                const check = validateSelection(
                    { kind: 'configurable', pieceCount: product.piece_count, name: product.name },
                    item.varieties ?? [],
                    allowed
                );
                if (!check.ok) {
                    return NextResponse.json({ error: check.error }, { status: 400 });
                }
                composition = check.entries.map((e) => ({
                    variety_id: e.varietyId,
                    name: e.name,
                    quantity: e.quantity,
                }));
            } else {
                // Feste Zusammenstellung: was der Browser schickt, wird ignoriert.
                const rows = product.product_varieties ?? [];

                const locked = rows.find((r) => r.varieties && r.varieties.is_available === false);
                if (locked) {
                    return NextResponse.json(
                        { error: `"${product.name}" ist zurzeit leider nicht bestellbar.` },
                        { status: 400 }
                    );
                }

                composition = rows
                    .filter((r) => r.varieties)
                    .map((r) => ({
                        variety_id: r.variety_id,
                        name: r.varieties!.name,
                        quantity: r.quantity,
                    }));
            }

            const description = describeComposition(composition);

            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: product.name,
                        ...(description ? { description } : {}),
                        // Bild aus der Datenbank, nicht aus dem Warenkorb des Browsers.
                        images: product.image_url ? [product.image_url] : [],
                    },
                    unit_amount: Math.round(Number(product.price) * 100),
                },
                quantity: item.quantity,
                tax_rates: [taxRateId],
            });

            resolved.push({
                product_id: product.id,
                name: product.name,
                quantity: item.quantity,
                price: Number(product.price),
                varieties: composition,
            });
        }

        // Warenwert aus geprüften Preisen – Grundlage der Versandkostenregel.
        const goodsTotal = resolved.reduce((sum, r) => sum + r.price * r.quantity, 0);
        const shippingCost = calculateShipping(goodsTotal, shopSettings);

        // Versand als eigene, besteuerte Position: Stripe erlaubt an
        // shipping_options keine Steuersätze, der Versand bliebe dort
        // unversteuert. Als Nebenleistung teilt er den Satz der Ware.
        if (shippingCost > 0) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Versandkosten',
                        description: `Lieferung in ${shopSettings.deliveryDaysMin}–${shopSettings.deliveryDaysMax} Werktagen`,
                    },
                    unit_amount: Math.round(shippingCost * 100),
                },
                quantity: 1,
                tax_rates: [taxRateId],
            });
        }

        // Der geprüfte Warenkorb wandert in einen Entwurf; nach Stripe geht nur
        // dessen ID. Eine Sortenauswahl mit sechs UUIDs sprengt die
        // 500-Zeichen-Grenze der Metadata sofort.
        let draftId: string | null = null;
        const { data: draft, error: draftError } = await supabaseAdmin
            .from('checkout_drafts')
            .insert({ payload: { items: resolved, shipping: shippingCost } })
            .select('id')
            .single();

        if (draftError || !draft) {
            console.error('Checkout-Entwurf konnte nicht gespeichert werden:', draftError);
            // Bei zusammengestellten Kartons wüsste sonst niemand, welche Sorten
            // gebacken werden sollen – dann lieber abbrechen als falsch liefern.
            const hasConfigured = resolved.some((r) => r.varieties.length > 1);
            if (hasConfigured) {
                return NextResponse.json(
                    { error: 'Die Bestellung konnte gerade nicht vorbereitet werden. Bitte versuche es in einem Moment noch einmal.' },
                    { status: 503 }
                );
            }
            // Bei festen Produkten steht die Zusammensetzung am Produkt – der
            // Kauf darf daran nicht scheitern.
        } else {
            draftId = draft.id;
        }

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'],
            line_items: lineItems,
            mode: 'payment',
            metadata: {
                ...(draftId ? { draft: draftId } : {}),
                // Rückfallebene, falls der Entwurf fehlt.
                ...encodeItemsToMetadata(
                    resolved.map((r) => ({ id: r.product_id, qty: r.quantity, price: r.price }))
                ),
                shipping: shippingCost.toFixed(2),
            },
            success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/cart`,
            shipping_address_collection: { allowed_countries: ['DE'] },
            allow_promotion_codes: true,
            invoice_creation: {
                enabled: true,
                invoice_data: { footer: invoiceIssuer },
            },
            locale: 'de',
        });

        return NextResponse.json({ url: session.url });
    } catch (error: unknown) {
        // Interne Details bleiben im Log, der Kunde bekommt eine verständliche Meldung.
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json(
            { error: 'Die Bezahlung konnte nicht gestartet werden. Bitte versuche es noch einmal.' },
            { status: 500 }
        );
    }
}
