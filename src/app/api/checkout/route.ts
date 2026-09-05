import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';
import { getShippingSettings, calculateShipping } from '@/lib/shipping';
import { encodeItemsToMetadata } from '@/lib/checkout-items';

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
            .select('id, name, price, is_available, stock_count')
            .in('id', productIds);

        if (dbError || !dbProducts) {
            return NextResponse.json(
                { error: 'Die Produkte konnten gerade nicht geladen werden. Bitte versuche es in einem Moment noch einmal.' },
                { status: 503 }
            );
        }

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
            if (realProduct.is_available === false) {
                return NextResponse.json(
                    { error: `"${realProduct.name}" ist zurzeit leider ausverkauft.` },
                    { status: 400 }
                );
            }
            if (typeof realProduct.stock_count === 'number' && item.quantity > realProduct.stock_count) {
                return NextResponse.json(
                    {
                        error: realProduct.stock_count === 0
                            ? `"${realProduct.name}" ist zurzeit leider ausverkauft.`
                            : `Von "${realProduct.name}" sind leider nur noch ${realProduct.stock_count} Stück verfügbar. Bitte passe die Menge an.`,
                    },
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
            });
        }

        // Calculate cart total from validated DB prices for shipping logic
        const cartTotal = lineItems.reduce((sum, item) => {
            return sum + ((item.price_data!.unit_amount ?? 0) * (item.quantity ?? 1));
        }, 0) / 100; // Convert cents to euros

        // Versandkosten kommen aus den Shop-Einstellungen (Admin → Einstellungen)
        const shippingSettings = await getShippingSettings();
        const shippingCost = calculateShipping(cartTotal, shippingSettings);

        const shippingOptions = [
            {
                shipping_rate_data: {
                    type: 'fixed_amount' as const,
                    fixed_amount: {
                        amount: Math.round(shippingCost * 100),
                        currency: 'eur',
                    },
                    display_name: shippingCost === 0 ? 'Kostenloser Versand' : 'Standardversand',
                    delivery_estimate: {
                        minimum: { unit: 'business_day' as const, value: shippingSettings.deliveryDaysMin },
                        maximum: { unit: 'business_day' as const, value: shippingSettings.deliveryDaysMax },
                    },
                },
            },
        ];

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'],
            line_items: lineItems,
            mode: 'payment',
            // Kompaktes, auf mehrere Schlüssel verteiltes Format – siehe lib/checkout-items.ts.
            // Preise stammen aus der DB, nie vom Client.
            metadata: encodeItemsToMetadata(
                items.map((i: any, idx: number) => ({
                    id: i.id,
                    qty: i.quantity,
                    price: (lineItems[idx].price_data!.unit_amount ?? 0) / 100,
                }))
            ),
            success_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/cart`,
            shipping_address_collection: {
                allowed_countries: ['DE'],
            },
            shipping_options: shippingOptions,
            // Promo codes: create & manage codes in the Stripe Dashboard
            allow_promotion_codes: true,
            // This setting automatically generates PDF invoices for the customer!
            invoice_creation: {
                enabled: true,
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
