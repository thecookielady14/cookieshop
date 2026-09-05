import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { getShippingSettings, calculateShipping } from '@/lib/shipping';
import { encodeItemsToMetadata } from '@/lib/checkout-items';
import { getVatTaxRateId } from '@/lib/stripe-tax';
import { siteUrl, invoiceIssuer } from '@/lib/site';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

export async function POST(req: Request) {
    try {
        const { items } = await req.json();

        if (!items || items.length === 0) {
            return NextResponse.json({ error: 'Dein Warenkorb ist leer.' }, { status: 400 });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Die Bezahlung ist gerade nicht konfiguriert. Bitte melde dich unter kontakt@thecookielady.de.' },
                { status: 500 }
            );
        }

        // Security Check: Fetch real products from DB to prevent client-side price tampering
        const productIds = items.map((i: any) => i.id);
        const { data: dbProducts, error: dbError } = await supabase
            .from('products')
            .select('id, name, price, is_available')
            .in('id', productIds);

        if (dbError || !dbProducts) {
            return NextResponse.json(
                { error: 'Die Produkte konnten gerade nicht geladen werden. Bitte versuche es in einem Moment noch einmal.' },
                { status: 503 }
            );
        }

        // 7 % MwSt. (Lebensmittel); Preise im Shop sind Bruttopreise.
        const taxRateId = await getVatTaxRateId(stripe);

        // Convert cart items to Stripe line items using secure DB prices
        const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
        for (const item of items) {
            const realProduct = dbProducts.find(p => p.id === item.id);

            if (!realProduct) {
                return NextResponse.json(
                    { error: 'Ein Artikel in deinem Warenkorb ist nicht mehr verfügbar. Bitte lade die Seite neu.' },
                    { status: 400 }
                );
            }
            // Es wird auf Bestellung gebacken – kein Lagerbestand. Ob ein Keks
            // bestellbar ist, steuerst du im Admin über is_available.
            if (realProduct.is_available === false) {
                return NextResponse.json(
                    { error: `"${realProduct.name}" ist zurzeit leider nicht bestellbar.` },
                    { status: 400 }
                );
            }

            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: realProduct.name,
                        images: item.imageUrl ? [item.imageUrl] : [],
                    },
                    unit_amount: Math.round(realProduct.price * 100), // Secure server-side price
                },
                quantity: item.quantity,
                tax_rates: [taxRateId],
            });
        }

        // Calculate cart total from validated DB prices for shipping logic
        const cartTotal = lineItems.reduce((sum, item) => {
            return sum + ((item.price_data!.unit_amount ?? 0) * (item.quantity ?? 1));
        }, 0) / 100; // Convert cents to euros

        // Versandkosten kommen aus den Shop-Einstellungen (Admin → Einstellungen)
        const shippingSettings = await getShippingSettings();
        const shippingCost = calculateShipping(cartTotal, shippingSettings);

        // Versand als eigene, besteuerte Position: Stripe erlaubt an
        // shipping_options keine Steuersätze, der Versand bliebe dort
        // unversteuert. Als Nebenleistung teilt er den Satz der Ware.
        if (shippingCost > 0) {
            lineItems.push({
                price_data: {
                    currency: 'eur',
                    product_data: {
                        name: 'Versandkosten',
                        description: `Lieferung in ${shippingSettings.deliveryDaysMin}–${shippingSettings.deliveryDaysMax} Werktagen`,
                    },
                    unit_amount: Math.round(shippingCost * 100),
                },
                quantity: 1,
                tax_rates: [taxRateId],
            });
        }

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'],
            line_items: lineItems,
            mode: 'payment',
            // Kompaktes, auf mehrere Schlüssel verteiltes Format – siehe lib/checkout-items.ts.
            // Preise stammen aus der DB, nie vom Client.
            metadata: {
                ...encodeItemsToMetadata(
                    items.map((i: any, idx: number) => ({
                        id: i.id,
                        qty: i.quantity,
                        price: (lineItems[idx].price_data!.unit_amount ?? 0) / 100,
                    }))
                ),
                // Der Versand ist keine Bestellposition, wird aber für die
                // Bestätigungsmail gebraucht.
                shipping: shippingCost.toFixed(2),
            },
            success_url: `${siteUrl}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${siteUrl}/cart`,
            shipping_address_collection: {
                allowed_countries: ['DE'],
            },
            // Promo codes: create & manage codes in the Stripe Dashboard
            allow_promotion_codes: true,
            // Erzeugt automatisch eine PDF-Rechnung mit fortlaufender Nummer.
            invoice_creation: {
                enabled: true,
                invoice_data: {
                    // Pflichtangaben des Rechnungsstellers – unabhängig davon,
                    // was im Stripe-Dashboard hinterlegt ist.
                    footer: invoiceIssuer,
                },
            },
            locale: 'de',
        });

        return NextResponse.json({ url: session.url });
    } catch (error: any) {
        // Interne Details bleiben im Log, der Kunde bekommt eine verständliche Meldung.
        console.error('Stripe Checkout Error:', error);
        return NextResponse.json(
            { error: 'Die Bezahlung konnte nicht gestartet werden. Bitte versuche es noch einmal.' },
            { status: 500 }
        );
    }
}
