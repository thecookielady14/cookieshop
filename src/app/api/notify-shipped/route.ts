import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/admin-auth';
import { sendMail } from '@/lib/email';
import { carrierName, trackingUrl } from '@/lib/tracking';
import { addressLines } from '@/lib/address';
import { escapeHtml } from '@/lib/html';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    // Auth: admin panel sends the Supabase access token of the logged-in admin;
    // the server-side secret remains as fallback for manual/scripted calls
    let authorized = false;
    const secret = req.headers.get('x-notify-secret');
    if (secret && secret === process.env.NOTIFY_SHIPPED_SECRET) {
        authorized = true;
    } else {
        const authHeader = req.headers.get('authorization');
        if (authHeader?.startsWith('Bearer ')) {
            const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
            // Angemeldet zu sein reicht nicht – es muss ein Adminkonto sein.
            if (user && isAdminEmail(user.email)) authorized = true;
        }
    }
    if (!authorized) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return new NextResponse('orderId fehlt', { status: 400 });
        }

        // Fetch order details from DB
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('customer_email, customer_name, order_number, total_amount, shipping_address, tracking_number, tracking_carrier')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return new NextResponse('Bestellung nicht gefunden', { status: 404 });
        }

        // Telefonbestellungen haben oft keine E-Mail – die Bestätigung liegt
        // dann als ausgedruckte Rechnung im Paket.
        if (!order.customer_email) {
            return NextResponse.json({ sent: false, reason: 'Keine E-Mail-Adresse hinterlegt' });
        }


        const customerName = order.customer_name || order.customer_email;
        const orderNumber = order.order_number ? `#${order.order_number}` : `#${orderId.substring(0, 8)}`;
        const totalFormatted = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(order.total_amount);

        // Sendungsverfolgung – nur wenn eine Nummer hinterlegt wurde. Fehlt sie,
        // bleibt die Mail wie bisher: "ist unterwegs", ohne falsches Versprechen.
        const trackingLink = trackingUrl(order.tracking_number, order.tracking_carrier);
        const dienst = carrierName(order.tracking_carrier);

        // Die vollständige Anschrift, nicht nur der Ort: So kann die Kundschaft
        // erkennen, ob das Paket wirklich zur richtigen Adresse geht – und bei
        // einem Tippfehler noch rechtzeitig schreiben. Dieselbe Formatierung
        // wie im Adminbereich, damit beide Seiten dasselbe sehen.
        const adresszeilen = addressLines(order.shipping_address);

        const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: Georgia, serif; background: #ece0c4; margin: 0; padding: 20px;">
  <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background: #331f16; padding: 40px 40px 32px; text-align: center;">
      <h1 style="color: #b0813b; font-size: 28px; margin: 0 0 8px;">The Cookie Lady 🍪</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Handgemacht mit Liebe</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <h2 style="color: #331f16; font-size: 22px; margin: 0 0 16px;">Deine Kekse sind unterwegs! 🚀</h2>
      
      <p style="color: #3e2723; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Hallo ${escapeHtml(customerName)},<br><br>
        wir haben deine Bestellung <strong>${orderNumber}</strong> heute frisch verpackt und auf die Reise zu dir geschickt.
        Du solltest deine leckeren Cookies in <strong>2–4 Werktagen</strong> erhalten.
      </p>

      <!-- Order Info Box -->
      <div style="background: #ece0c4; border-radius: 16px; padding: 20px 24px; margin: 0 0 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #3e2723; padding: 4px 0; font-size: 14px;">Bestellnummer</td>
            <td style="color: #331f16; font-weight: bold; font-size: 14px; text-align: right;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="color: #3e2723; padding: 4px 0; font-size: 14px;">Gesamtbetrag</td>
            <td style="color: #331f16; font-weight: bold; font-size: 14px; text-align: right;">${totalFormatted}</td>
          </tr>
          ${adresszeilen.length > 0 ? `
          <tr>
            <td style="color: #3e2723; padding: 4px 0; font-size: 14px; vertical-align: top;">Lieferadresse</td>
            <td style="color: #331f16; font-weight: bold; font-size: 14px; text-align: right; line-height: 1.5;">${adresszeilen.map((z) => escapeHtml(z)).join('<br>')}</td>
          </tr>` : ''}
          ${order.tracking_number ? `
          <tr>
            <td style="color: #3e2723; padding: 4px 0; font-size: 14px;">Sendungsnummer${dienst ? ` (${dienst})` : ''}</td>
            <td style="color: #331f16; font-weight: bold; font-size: 14px; text-align: right;">${escapeHtml(order.tracking_number)}</td>
          </tr>` : ''}
        </table>
      </div>

      ${trackingLink ? `
      <div style="text-align: center; margin: 0 0 28px;">
        <a href="${trackingLink}" target="_blank" rel="noopener noreferrer"
           style="background: #b0813b; color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-weight: bold; font-size: 16px; display: inline-block;">
          Sendung verfolgen 📦
        </a>
      </div>
      <p style="color: #6b7280; font-size: 13px; line-height: 1.6; text-align: center; margin: -16px 0 28px;">
        Es kann ein paar Stunden dauern, bis der Paketdienst die Sendung im System hat.
      </p>` : ''}

      <p style="color: #3e2723; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
        <strong>Tipp fürs beste Erlebnis:</strong> Leg die Cookies kurz vor dem Essen für 1–2 Minuten bei 150°C in den Ofen – dann schmecken sie wieder wie frisch aus der Backstube! 🤤
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 0 0 32px;">
        <a href="https://thecookielady.de/shop" 
           style="background: #331f16; color: #b0813b; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-weight: bold; font-size: 16px; display: inline-block;">
          Mehr Cookies bestellen →
        </a>
      </div>

      <p style="color: #3e2723; font-size: 14px; line-height: 1.6; text-align: center; margin: 0;">
        Fragen? Schreib uns an <a href="mailto:kontakt@thecookielady.de" style="color: #331f16;">kontakt@thecookielady.de</a>
      </p>
    </div>

    <!-- Footer -->
    <div style="background: #2c1a12; padding: 20px 40px; text-align: center;">
      <p style="color: rgba(255,255,255,0.5); font-size: 12px; margin: 0;">
        © ${new Date().getFullYear()} The Cookie Lady · Mering · Made with ❤️
      </p>
    </div>
  </div>
</body>
</html>`;

        const result = await sendMail({
            to: order.customer_email,
            subject: `Deine Kekse sind unterwegs! 🚀 (${orderNumber})`,
            html: emailHtml,
        });

        if (!result.sent) {
            // Der Status ist schon gesetzt; nur die Mail ging nicht raus.
            return NextResponse.json({ sent: false, reason: result.reason }, { status: 502 });
        }

        return NextResponse.json({ sent: true });
    } catch (error: any) {
        console.error('notify-shipped error:', error);
        return new NextResponse(error.message, { status: 500 });
    }
}
