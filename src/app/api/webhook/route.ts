import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-01-28.clover',
});

// Stripe requires the raw body to construct the event
export const runtime = 'nodejs';

export async function POST(req: Request) {
    const body = await req.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature || !process.env.STRIPE_WEBHOOK_SECRET) {
        return new NextResponse('Webhook secret or signature missing', { status: 400 });
    }

    let event: Stripe.Event;

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err: any) {
        console.error(`Webhook signature verification failed: ${err.message}`);
        return new NextResponse(`Webhook Error: ${err.message}`, { status: 400 });
    }

    // Handle successful checkout
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        try {
            // 1. Get customer email and shipping details
            const customerEmail = session.customer_details?.email || 'unknown@email.com';
            const shippingAddress = (session as any).shipping_details?.address || null;
            const totalAmount = (session.amount_total || 0) / 100;

            // 2. Parse the items from metadata
            let items = [];
            if (session.metadata?.items) {
                items = JSON.parse(session.metadata.items);
            }

            // 3. Insert the order into Supabase using the service role key (bypasses RLS)
            const supabaseAdmin = createClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL || '',
                process.env.SUPABASE_SERVICE_ROLE_KEY || ''
            );

            const { data: orderData, error: orderError } = await supabaseAdmin
                .from('orders')
                .insert([{
                    customer_email: customerEmail,
                    stripe_session_id: session.id,
                    total_amount: totalAmount,
                    status: 'paid',
                    shipping_address: shippingAddress
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 4. Insert the order items
            if (items.length > 0 && orderData) {
                const orderItemsToInsert = items.map((item: any) => ({
                    order_id: orderData.id,
                    product_id: item.id,
                    quantity: item.qty,
                    price_at_time: item.price
                }));

                const { error: itemsError } = await supabaseAdmin
                    .from('order_items')
                    .insert(orderItemsToInsert);

                if (itemsError) throw itemsError;
            }

            console.log(`Order ${orderData.id} created successfully for ${customerEmail}`);

        } catch (error: any) {
            console.error('Error processing webhook:', error);
            return new NextResponse('Error saving order to database', { status: 500 });
        }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
}
