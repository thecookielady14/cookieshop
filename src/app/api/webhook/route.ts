import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { formatEuro } from '@/lib/shop-settings';
import { decodeItemsFromMetadata } from '@/lib/checkout-items';
import { VAT_PERCENTAGE, contactEmail } from '@/lib/site';
import { sendMail } from '@/lib/email';
import { sendNewOrderNotification } from '@/lib/order-notification';

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
            // Stripe verlangt im Checkout immer eine E-Mail; fehlt sie wider
            // Erwarten, wird das protokolliert statt eine Fantasieadresse zu speichern.
            const customerEmail = session.customer_details?.email ?? null;
            if (!customerEmail) {
                console.warn(`Session ${session.id} kam ohne E-Mail-Adresse an.`);
            }
            // Stripe API >= 2025-03-31: shipping_details lives under collected_information
            const shippingDetails = (session as any).collected_information?.shipping_details
                ?? (session as any).shipping_details
                ?? null;
            // Stripes Adressobjekt hat kein Namensfeld – der Empfängername steht
            // daneben. Wird er nicht mit hineingeschrieben, geht bei einer
            // Geschenksendung der eigentliche Empfänger verloren und das Paket
            // trägt den Namen der Bestellerin. Die Form entspricht damit dem,
            // was das Telefonformular speichert.
            const shippingAddress = shippingDetails?.address
                ? {
                      ...shippingDetails.address,
                      name: shippingDetails.name ?? session.customer_details?.name ?? null,
                  }
                : null;
            const totalAmount = (session.amount_total || 0) / 100;

            // 2. Positionen aus dem Checkout-Entwurf lesen. Dort steht auch,
            //    welche Sorten in einem zusammengestellten Karton stecken – das
            //    passt nicht in die Stripe-Metadata. Fehlt der Entwurf, greift
            //    das kompakte Metadata-Format als Rückfallebene.
            let items: { product_id: string; name?: string; quantity: number; price: number;
                         varieties: { variety_id: string; name: string; quantity: number }[] }[] = [];

            const draftId = session.metadata?.draft;
            if (draftId) {
                const { data: draft } = await supabaseAdmin
                    .from('checkout_drafts')
                    .select('payload')
                    .eq('id', draftId)
                    .maybeSingle();

                if (draft?.payload?.items) {
                    items = draft.payload.items;
                } else {
                    console.warn(`Checkout-Entwurf ${draftId} nicht gefunden – nutze Metadata.`);
                }
            }

            if (items.length === 0) {
                items = decodeItemsFromMetadata(session.metadata).map((i) => ({
                    product_id: i.id,
                    quantity: i.qty,
                    price: i.price,
                    varieties: [],
                }));
            }

            // 3. Bestellkopf, Positionen und Sorten in EINER Transaktion.
            //    Früher lief das als getrennte Schreibvorgänge: schlug der
            //    zweite fehl, antwortete die Route mit 500, Stripe lieferte
            //    erneut aus – und die Idempotenzprüfung fand die bereits
            //    angelegte Bestellung und übersprang sie. Die Bestellung blieb
            //    dauerhaft ohne Positionen.
            // Nicht jede abgeschlossene Session ist auch bezahlt: Klarna, SEPA
            // und Rechnungskauf bestaetigen erst spaeter. Nur was Stripe als
            // bezahlt meldet, wird auch als bezahlt gefuehrt – sonst steht die
            // Bestellung offen, bis das Geld da ist.
            const isPaid = session.payment_status === 'paid'
                || session.payment_status === 'no_payment_required';
            if (!isPaid) {
                console.log(`Session ${session.id}: Zahlungsstatus "${session.payment_status}" – Bestellung wird als offen angelegt.`);
            }

            const { data: orderId, error: orderError } = await supabaseAdmin.rpc('record_order', {
                payload: {
                    customer_name: session.customer_details?.name || null,
                    customer_email: customerEmail,
                    stripe_session_id: session.id,
                    total_amount: totalAmount,
                    status: isPaid ? 'paid' : 'pending',
                    source: 'online',
                    shipping_address: shippingAddress,
                    items: items.map((i) => ({
                        product_id: i.product_id,
                        quantity: i.quantity,
                        price: i.price,
                        varieties: i.varieties ?? [],
                    })),
                },
            });

            if (orderError) throw orderError;

            // NULL heisst: diese Session wurde bereits verarbeitet.
            if (!orderId) {
                console.log(`Session ${session.id} war schon verarbeitet – doppelter Webhook.`);
                return new NextResponse('Already processed', { status: 200 });
            }

            // Entwurf abhaken, damit das Aufräumen weiss, was erledigt ist.
            if (draftId) {
                await supabaseAdmin
                    .from('checkout_drafts')
                    .update({ consumed_at: new Date().toISOString() })
                    .eq('id', draftId);
            }

            const orderData = { id: orderId };

            const { data: orderRow } = await supabaseAdmin
                .from('orders')
                .select('order_number')
                .eq('id', orderId)
                .maybeSingle();
            const orderNumber = orderRow?.order_number ?? null;

            // Meldung an die Betreiberin. Da auf Bestellung gebacken wird, ist
            // das der eigentliche Auslöser für die Arbeit – ohne sie müsste
            // regelmäßig im Adminbereich nachgeschaut werden.
            // Ein Fehler hier darf die Bestellung nicht gefährden.
            try {
                await sendNewOrderNotification({
                    orderNumber,
                    customerName: session.customer_details?.name ?? null,
                    customerEmail,
                    shippingAddress: shippingAddress,
                    totalAmount,
                    isPaid,
                    items: items.map((i) => ({
                        name: i.name ?? 'Artikel',
                        quantity: i.quantity,
                        price: i.price,
                        varieties: i.varieties ?? [],
                    })),
                });
            } catch (notifyError) {
                console.error('Meldung über neue Bestellung fehlgeschlagen:', notifyError);
            }
            console.log(`Bestellung ${orderId} angelegt für ${customerEmail} (${isPaid ? 'bezahlt' : 'offen'})`);

            // Send order confirmation email if RESEND_API_KEY is configured
            if (items.length > 0 && customerEmail) {
                try {
                    // Namen stehen im Entwurf; nur bei der Rückfallebene fehlen sie.
                    const missingNames = items.filter((i) => !i.name).map((i) => i.product_id);
                    const productMap = new Map<string, string>();
                    if (missingNames.length > 0) {
                        const { data: productRows } = await supabaseAdmin
                            .from('products')
                            .select('id, name')
                            .in('id', missingNames);
                        for (const row of productRows ?? []) productMap.set(row.id, row.name);
                    }

                    const itemsHtml = items.map((item) => {
                        const name = item.name || productMap.get(item.product_id) || 'Unbekanntes Produkt';
                        // Bei einem zusammengestellten Karton ist der Inhalt das
                        // Wesentliche – ohne ihn weiss niemand, was bestellt wurde.
                        const composition = (item.varieties ?? []).length > 1
                            ? `<br><span style="font-size:12px;color:#9c7a4a;">${item.varieties.map((v) => `${v.quantity}× ${v.name}`).join(', ')}</span>`
                            : '';
                        return `<tr>
                            <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;">${name}${composition}</td>
                            <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;text-align:center;vertical-align:top;">${item.quantity}x</td>
                            <td style="padding:8px 0;border-bottom:1px solid #f0e8d8;text-align:right;vertical-align:top;">${item.price.toFixed(2).replace('.', ',')} €</td>
                        </tr>`;
                    }).join('');

                    const customerName = session.customer_details?.name || 'liebe Kundin / lieber Kunde';
                    // Tatsächlich berechneter Versand – nicht schätzen: totalAmount
                    // enthält den Versand bereits und taugt nicht als Vergleichswert.
                    // Der Versand läuft als besteuerte Position (siehe lib/stripe-tax.ts),
                    // deshalb steht der Betrag in der Metadata; shipping_cost bleibt als
                    // Rückfallebene für ältere Sessions.
                    const shippingAmount = session.metadata?.shipping !== undefined
                        ? parseFloat(session.metadata.shipping) || 0
                        : (session.shipping_cost?.amount_total ?? 0) / 100;
                    const shippingCost = shippingAmount === 0 ? 'Kostenlos' : formatEuro(shippingAmount);

                    const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family:'Helvetica Neue',Arial,sans-serif;background:#ece0c4;margin:0;padding:20px;">
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
          <span>Zwischensumme</span><span>${formatEuro(totalAmount - shippingAmount)}</span>
        </div>
        <div style="margin-top:4px;display:flex;justify-content:space-between;font-size:14px;color:#5a4a3a;">
          <span>Versandkosten</span><span>${shippingCost}</span>
        </div>
        <div style="margin-top:8px;display:flex;justify-content:space-between;font-size:17px;font-weight:bold;color:#331f16;">
          <span>Gesamtbetrag</span><span>${formatEuro(totalAmount)}</span>
        </div>
        <div style="margin-top:4px;display:flex;justify-content:space-between;font-size:12px;color:#9c7a4a;">
          <span>darin enthalten ${VAT_PERCENTAGE} % MwSt.</span><span>${formatEuro(totalAmount - totalAmount / (1 + VAT_PERCENTAGE / 100))}</span>
        </div>
      </div>

      <p style="color:#5a4a3a;font-size:14px;line-height:1.6;">Du erhältst eine separate E-Mail von Stripe mit deiner Rechnung als PDF. Bei Fragen melde dich gerne unter <a href="mailto:kontakt@thecookielady.de" style="color:#b0813b;">kontakt@thecookielady.de</a>.</p>

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

                    await sendMail({
                        to: customerEmail,
                        subject: `Deine Bestellung ist eingegangen! 🍪 (${orderNumber ? '#' + orderNumber : '#' + String(orderData.id).slice(0, 8).toUpperCase()})`,
                        html: emailHtml,
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

    // Nachzügler-Zahlungen.
    //
    // Bei Zahlungsarten wie Klarna gilt der Checkout als abgeschlossen, bevor
    // das Geld sicher ist – die Bestellung entsteht dann als "pending". Das
    // Ergebnis kommt erst später als eigenes Ereignis. Ohne diese Behandlung
    // bliebe eine längst bezahlte Bestellung für immer auf "unbezahlt" stehen
    // und würde nie gebacken; eine gescheiterte bliebe offen und würde
    // vielleicht doch gebacken. Beides kostet echtes Geld.
    if (
        event.type === 'checkout.session.async_payment_succeeded' ||
        event.type === 'checkout.session.async_payment_failed'
    ) {
        const session = event.data.object as Stripe.Checkout.Session;
        const bezahlt = event.type === 'checkout.session.async_payment_succeeded';

        try {
            // Nur den Status ändern, nichts neu anlegen: die Bestellung gibt es
            // schon aus checkout.session.completed. Findet sich keine, ist das
            // kein Fehler – dann kam das Ereignis zu einer Sitzung, die diese
            // Website nicht erzeugt hat.
            const { data, error } = await supabaseAdmin
                .from('orders')
                .update({ status: bezahlt ? 'paid' : 'cancelled' })
                .eq('stripe_session_id', session.id)
                .select('id, order_number, customer_email')
                .maybeSingle();

            if (error) throw error;
            if (!data) {
                console.warn(`Nachzügler-Zahlung ohne passende Bestellung: ${session.id}`);
                return new NextResponse('No matching order', { status: 200 });
            }

            console.log(
                `Bestellung ${data.order_number ?? data.id} nach Nachzügler-Zahlung auf ` +
                `${bezahlt ? 'bezahlt' : 'storniert'} gesetzt.`
            );

            // Die Betreiberin muss das erfahren: bei Erfolg ist das der
            // Startschuss zum Backen, bei Misserfolg die Warnung, es zu lassen.
            await sendMail({
                to: contactEmail,
                subject: bezahlt
                    ? `Zahlung eingegangen – Bestellung #${data.order_number ?? data.id}`
                    : `Zahlung fehlgeschlagen – Bestellung #${data.order_number ?? data.id} storniert`,
                html: bezahlt
                    ? `<p>Die Zahlung zu Bestellung <strong>#${data.order_number ?? data.id}</strong> ist eingegangen. Die Bestellung steht jetzt auf „bezahlt“ und kann gebacken werden.</p>`
                    : `<p>Die Zahlung zu Bestellung <strong>#${data.order_number ?? data.id}</strong> ist fehlgeschlagen. Die Bestellung wurde auf „storniert“ gesetzt – bitte nicht backen.</p>`,
            }).catch((mailError) => {
                // Der Statuswechsel ist das Wichtige und darf nicht an der Mail scheitern.
                console.error('Meldung zur Nachzügler-Zahlung fehlgeschlagen:', mailError);
            });
        } catch (error: any) {
            console.error('Fehler bei Nachzügler-Zahlung:', error);
            // 500 lässt Stripe erneut zustellen – der Statuswechsel darf nicht verloren gehen.
            return new NextResponse('Error updating order status', { status: 500 });
        }
    }

    return new NextResponse('Webhook processed successfully', { status: 200 });
}
