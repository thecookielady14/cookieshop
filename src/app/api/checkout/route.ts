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
                allowed_countries: ['DE', 'AT', 'CH'],
            },
            shipping_options: [
                {
                    shipping_rate_data: {
                        type: 'fixed_amount',
                        fixed_amount: {
                            amount: 490, // 4.90 € shipping
                            currency: 'eur',
                        },
                        display_name: 'Standardversand',
                        delivery_estimate: {
                            minimum: {
                                unit: 'business_day',
                                value: 2,
                            },
                            maximum: {
                                unit: 'business_day',
                                value: 4,
                            },
                        },
                    },
                },
            ],
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
