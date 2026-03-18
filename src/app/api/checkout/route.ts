import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabase } from '@/lib/supabase';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

export async function POST(req: Request) {
    try {
        const { items } = await req.json();

        if (!items || items.length === 0) {
            return new NextResponse("Menge darf nicht 0 sein", { status: 400 });
        }

        if (!process.env.STRIPE_SECRET_KEY) {
            return NextResponse.json(
                { error: 'Stripe Secret Key is missing. Bitte richte Stripe ein!' },
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
            return new NextResponse("Fehler beim Laden der Produkte aus der Datenbank", { status: 500 });
        }

        // Convert cart items to Stripe line items using secure DB prices
        const lineItems = [];
        for (const item of items) {
            const realProduct = dbProducts.find(p => p.id === item.id);

            if (!realProduct) {
                throw new Error(`Produkt nicht gefunden oder manipuliert.`);
            }
            if (realProduct.is_available === false) {
                throw new Error(`${realProduct.name} ist zurzeit leider ausverkauft.`);
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
            return sum + (item.price_data.unit_amount * item.quantity);
        }, 0) / 100; // Convert cents to euros

        // Dynamic shipping: free above 30€
        const shippingOptions = cartTotal >= 30
            ? [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount' as const,
                        fixed_amount: {
                            amount: 0,
                            currency: 'eur',
                        },
                        display_name: 'Kostenloser Versand',
                        delivery_estimate: {
                            minimum: { unit: 'business_day' as const, value: 2 },
                            maximum: { unit: 'business_day' as const, value: 4 },
                        },
                    },
                },
            ]
            : [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount' as const,
                        fixed_amount: {
                            amount: 490, // 4.90 €
                            currency: 'eur',
                        },
                        display_name: 'Standardversand',
                        delivery_estimate: {
                            minimum: { unit: 'business_day' as const, value: 2 },
                            maximum: { unit: 'business_day' as const, value: 4 },
                        },
                    },
                },
            ];

        // Create Checkout Session
        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card', 'paypal'],
            line_items: lineItems,
            mode: 'payment',
            metadata: {
                // Pass order details to webhook
                items: JSON.stringify(items.map((i: any) => ({ id: i.id, qty: i.quantity, price: i.price }))),
            },
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
        console.error('Stripe Checkout Error:', error);
        return new NextResponse(error.message, { status: 500 });
    }
}
