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
            // Stripe API >= 2025-03-31: shipping_details lives under collected_information
            const shippingAddress = (session as any).collected_information?.shipping_details?.address
                ?? (session as any).shipping_details?.address
                ?? null;
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

            // Idempotency: skip if this session was already processed
            const { data: existing } = await supabaseAdmin
                .from('orders')
                .select('id')
                .eq('stripe_session_id', session.id)
                .maybeSingle();

            if (existing) {
                console.log(`Session ${session.id} already processed – skipping duplicate webhook.`);
                return new NextResponse('Already processed', { status: 200 });
            }

            const { data: orderData, error: orderError } = await supabaseAdmin
                .from('orders')
                .insert([{
                    customer_name: session.customer_details?.name || null,
                    customer_email: customerEmail,
                    stripe_session_id: session.id,
                    total_amount: totalAmount,
                    status: 'paid',
                    shipping_address: shippingAddress
                }])
                .select()
                .single();

            if (orderError) throw orderError;

            // 4. Insert the order items (price_at_time comes from validated server-side metadata)
            if (items.length > 0 && orderData) {
                const orderItemsToInsert = items.map((item: any) => ({
                    order_id: orderData.id,
                    product_id: item.id,
                    quantity: item.qty,
                    price_at_time: item.price  // set from validated DB price in checkout route
                }));

                const { error: itemsError } = await supabaseAdmin
                    .from('order_items')
                    .insert(orderItemsToInsert);

                if (itemsError) throw itemsError;
            }

            console.log(`Order ${orderData.id} created successfully for ${customerEmail}`);

            // Decrement stock; failures here must not block the order
            for (const item of items) {
                try {
                    const { data: prod } = await supabaseAdmin
                        .from('products')
                        .select('stock_count')
                        .eq('id', item.id)
                        .single();
                    if (prod && typeof prod.stock_count === 'number') {
                        const newStock = Math.max(0, prod.stock_count - item.qty);
                        await supabaseAdmin
                            .from('products')
                            .update({ stock_count: newStock, ...(newStock === 0 ? { is_available: false } : {}) })
                            .eq('id', item.id);
                    }
                } catch (stockError) {
                    console.error(`Failed to decrement stock for product ${item.id}:`, stockError);
                }
            }

            // Send order confirmation email if RESEND_API_KEY is configured
            if (process.env.RESEND_API_KEY && items.length > 0) {
                try {
                    // Fetch product names for the email
                    const productIds = items.map((i: any) => i.id);
                    const { data: productRows } = await supabaseAdmin
                        .from('products')
                        .select('id, name')
                        .in('id', productIds);

                    const productMap = new Map((productRows || []).map((p: any) => [p.id, p.name]));

                    const itemsHtml = items.map((item: any) => {
                        const name = productMap.get(item.id) || 'Unbekanntes Produkt';
                        return `<tr>
                            <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;">${name}</td>
                            <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;text-align:center;">${item.qty}x</td>
                            <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;text-align:right;">${item.price.toFixed(2).replace('.', ',')} €</td>
                        </tr>`;
                    }).join('');

                    const customerName = session.customer_details?.name || 'liebe Kundin / lieber Kunde';
                    const shippingCost = totalAmount >= 30 ? '0,00 €' : '4,90 €';

                    const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#f7ecd6;margin:0;padding:20px;">
  <div style="max-width:580px;margin:0 auto;background:#fff;border-radius:24px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08);">
    <div style="background:#331f16;padding:32px;text-align:center;">
      <p style="color:#b0813b;font-size:14px;letter-spacing:3px;margin:0 0 8px;text-transform:uppercase;">The Cookie Lady</p>
      <h1 style="color:#fff;font-size:26px;margin:0;font-weight:bold;">Deine Bestellung ist eingegangen! 🍪</h1>
    </div>
    <div style="padding:32px;">
      <p style="color:#331f16;font-size:16px;">Hallo ${customerName},</p>
      <p style="color:#5a4a3a;font-size:15px;line-height:1.6;">vielen Dank für deine Bestellung! Ich werde deine Kekse jetzt mit viel Liebe backen und frisch für dich verpacken.</p>

      <div style="background:#fef5e7;border-radius:16px;padding:20px;margin:24px 0;">
        <h2 style="color:#331f16;font-size:16px;margin:0 0 16px;font-weight:bold;">Deine Bestellung</h2>
        <table style="width:100%;border-collapse:collapse;font-size:14px;color:#5a4a3a;">
          <thead>
            <tr>
              <th style="text-align:left;padding:4px 0;color:#9c7a4a;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Produkt</th>
              <th style="text-align:center;padding:4px 0;color:#9c7a4a;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Menge</th>
              <th style="text-align:right;padding:4px 0;color:#9c7a4a;font-weight:600;font-size:12px;text-transform:uppercase;letter-spacing:1px;">Preis</th>
            </tr>
          </thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div style="margin-top:12px;padding-top:12px;border-top:2px solid #b0813b;display:flex;justify-content:space-between;font-size:14px;color:#5a4a3a;">
          <span>Versandkosten</span><span>${shippingCost}</span>
        </div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;font-size:17px;font-weight:bold;color:#331f16;">
          <span>Gesamtbetrag</span><span>${totalAmount.toFixed(2).replace('.', ',')} €</span>
        </div>
      </div>

      <p style="color:#5a4a3a;font-size:14px;line-height:1.6;">Du erhältst eine separate E-Mail von Stripe mit deiner Rechnung als PDF. Bei Fragen melde dich gerne unter <a href="mailto:thecookielady2025@gmail.com" style="color:#b0813b;">thecookielady2025@gmail.com</a>.</p>

      <div style="text-align:center;margin-top:28px;">
        <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'https://thecookielady.de'}/shop" style="background:#331f16;color:#fff;padding:14px 28px;border-radius:50px;text-decoration:none;font-weight:bold;font-size:15px;display:inline-block;">
          Weitere Kekse entdecken
        </a>
      </div>
    </div>
    <div style="background:#fef5e7;padding:20px;text-align:center;">
      <p style="color:#9c7a4a;font-size:12px;margin:0;">The Cookie Lady · Handgemachte Kekse mit Liebe</p>
    </div>
  </div>
</body>
</html>`;

                    await fetch('https://api.resend.com/emails', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            from: 'The Cookie Lady <bestellung@thecookielady.de>',
                            to: [customerEmail],
                            subject: `Deine Bestellung ist eingegangen! 🍪 (#${orderData.id.slice(0, 8).toUpperCase()})`,
                            html: emailHtml,
                        }),
                    });

                    console.log(`Order confirmation email sent to ${customerEmail}`);
                } catch (emailError) {
                    // Email failure must not block the order
                    console.error('Failed to send confirmation email:', emailError);
                }
            }

        } catch (error: any) {
            console.error('Error processing webhook:', error);
            return new NextResponse('Error saving order to database', { status: 500 });
        }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
}
