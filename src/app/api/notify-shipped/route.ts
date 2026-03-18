import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: Request) {
    try {
        const { orderId } = await req.json();

        if (!orderId) {
            return new NextResponse('orderId fehlt', { status: 400 });
        }

        // Fetch order details from DB
        const { data: order, error } = await supabaseAdmin
            .from('orders')
            .select('customer_email, customer_name, order_number, total_amount, shipping_address')
            .eq('id', orderId)
            .single();

        if (error || !order) {
            return new NextResponse('Bestellung nicht gefunden', { status: 404 });
        }

        const resendApiKey = process.env.RESEND_API_KEY;
        if (!resendApiKey) {
            console.warn('RESEND_API_KEY nicht gesetzt – Email wird nicht versendet');
            return NextResponse.json({ sent: false, reason: 'No RESEND_API_KEY' });
        }

        const customerName = order.customer_name || order.customer_email;
        const orderNumber = order.order_number ? `#${order.order_number}` : `#${orderId.substring(0, 8)}`;
        const totalFormatted = new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(order.total_amount);

        const emailHtml = `
<!DOCTYPE html>
<html lang="de">
<head><meta charset="UTF-8"></head>
<body style="font-family: Georgia, serif; background: #fae4a0; margin: 0; padding: 20px;">
  <div style="max-width: 580px; margin: 0 auto; background: #fff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
    
    <!-- Header -->
    <div style="background: #331f16; padding: 40px 40px 32px; text-align: center;">
      <h1 style="color: #e6b840; font-size: 28px; margin: 0 0 8px;">The Cookie Lady 🍪</h1>
      <p style="color: rgba(255,255,255,0.8); margin: 0; font-size: 14px;">Handgemacht mit Liebe</p>
    </div>

    <!-- Body -->
    <div style="padding: 40px;">
      <h2 style="color: #331f16; font-size: 22px; margin: 0 0 16px;">Deine Kekse sind unterwegs! 🚀</h2>
      
      <p style="color: #3e2723; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">
        Hallo ${customerName},<br><br>
        wir haben deine Bestellung <strong>${orderNumber}</strong> heute frisch verpackt und auf die Reise zu dir geschickt.
        Du solltest deine leckeren Cookies in <strong>2–4 Werktagen</strong> erhalten.
      </p>

      <!-- Order Info Box -->
      <div style="background: #fae4a0; border-radius: 16px; padding: 20px 24px; margin: 0 0 24px;">
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="color: #3e2723; padding: 4px 0; font-size: 14px;">Bestellnummer</td>
            <td style="color: #331f16; font-weight: bold; font-size: 14px; text-align: right;">${orderNumber}</td>
          </tr>
          <tr>
            <td style="color: #3e2723; padding: 4px 0; font-size: 14px;">Gesamtbetrag</td>
            <td style="color: #331f16; font-weight: bold; font-size: 14px; text-align: right;">${totalFormatted}</td>
          </tr>
          ${order.shipping_address?.city ? `
          <tr>
            <td style="color: #3e2723; padding: 4px 0; font-size: 14px;">Lieferadresse</td>
            <td style="color: #331f16; font-weight: bold; font-size: 14px; text-align: right;">${order.shipping_address.city}</td>
          </tr>` : ''}
        </table>
      </div>

      <p style="color: #3e2723; font-size: 15px; line-height: 1.6; margin: 0 0 32px;">
        <strong>Tipp fürs beste Erlebnis:</strong> Leg die Cookies kurz vor dem Essen für 1–2 Minuten bei 150°C in den Ofen – dann schmecken sie wieder wie frisch aus der Backstube! 🤤
      </p>

      <!-- CTA Button -->
      <div style="text-align: center; margin: 0 0 32px;">
        <a href="https://thecookielady.de/shop" 
           style="background: #331f16; color: #e6b840; text-decoration: none; padding: 14px 32px; border-radius: 100px; font-weight: bold; font-size: 16px; display: inline-block;">
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

        // Send via Resend API (no SDK needed, plain fetch)
        const emailResponse = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${resendApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: 'The Cookie Lady <bestellungen@thecookielady.de>',
                to: [order.customer_email],
                subject: `Deine Kekse sind unterwegs! 🚀 (${orderNumber})`,
                html: emailHtml,
            }),
        });

        if (!emailResponse.ok) {
            const errText = await emailResponse.text();
            console.error('Resend error:', errText);
            return new NextResponse('Email konnte nicht versendet werden', { status: 500 });
        }

        return NextResponse.json({ sent: true });
    } catch (error: any) {
        console.error('notify-shipped error:', error);
        return new NextResponse(error.message, { status: 500 });
    }
}
