import { contactEmail, siteUrl } from '@/lib/site';
import { sendMail } from '@/lib/email';
import { addressLines, type ShippingAddress } from '@/lib/address';

/**
 * Meldung an die Betreiberin, dass eine Bestellung eingegangen ist.
 *
 * Bewusst schlicht gehalten: das ist keine Werbung, sondern ein Arbeitszettel.
 * Er enthält genau das, was zum Backen und Packen gebraucht wird – Sorten mit
 * Mengen, Lieferadresse und ob das Geld schon da ist.
 *
 * Da auf Bestellung gebacken wird, ist diese Mail der eigentliche Auslöser für
 * die Arbeit. Ohne sie müsste regelmäßig im Adminbereich nachgeschaut werden.
 */

export interface NotificationItem {
    name: string;
    quantity: number;
    price: number;
    varieties: { name: string; quantity: number }[];
}

const euro = (value: number) => `${value.toFixed(2).replace('.', ',')} €`;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function sendNewOrderNotification(options: {
    orderNumber: number | string | null;
    customerName: string | null;
    customerEmail: string | null;
    shippingAddress: ShippingAddress | null;
    totalAmount: number;
    isPaid: boolean;
    items: NotificationItem[];
}) {
    const reference = options.orderNumber ? `#${options.orderNumber}` : 'ohne Nummer';

    // Was gebacken werden muss – über alle Positionen zusammengezählt, weil
    // dieselbe Sorte in mehreren Kartons stecken kann.
    const perVariety = new Map<string, number>();
    for (const item of options.items) {
        for (const variety of item.varieties) {
            perVariety.set(
                variety.name,
                (perVariety.get(variety.name) ?? 0) + variety.quantity * item.quantity
            );
        }
    }
    const bakeList = [...perVariety.entries()].sort((a, b) => b[1] - a[1]);

    const itemRows = options.items
        .map((item) => {
            const composition = item.varieties.length
                ? `<br><span style="color:#6b7280;font-size:13px;">${item.varieties
                      .map((v) => `${v.quantity}× ${escapeHtml(v.name)}`)
                      .join(', ')}</span>`
                : '';
            return `<tr>
                <td style="padding:8px 0;border-bottom:1px solid #eee;">${item.quantity}× ${escapeHtml(item.name)}${composition}</td>
                <td style="padding:8px 0;border-bottom:1px solid #eee;text-align:right;vertical-align:top;white-space:nowrap;">${euro(item.price * item.quantity)}</td>
            </tr>`;
        })
        .join('');

    // Dieselbe Formatierung wie in der Adminliste – sonst steht in der Mail
    // etwas anderes als auf dem Bildschirm.
    const zeilen = addressLines(options.shippingAddress);
    const addressHtml = zeilen.length > 0
        ? zeilen.map((zeile) => escapeHtml(zeile)).join('<br>')
        : '<span style="color:#9ca3af;">keine Adresse übermittelt</span>';

    const paymentNote = options.isPaid
        ? '<span style="color:#047857;font-weight:bold;">bezahlt</span>'
        : '<span style="color:#b45309;font-weight:bold;">noch offen – erst backen, wenn das Geld da ist</span>';

    const html = `<!DOCTYPE html>
<html lang="de"><head><meta charset="UTF-8"></head>
<body style="font-family:-apple-system,'Segoe UI',Arial,sans-serif;background:#f3f4f6;margin:0;padding:20px;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb;">
    <div style="background:#331f16;padding:20px 24px;">
      <p style="color:#b0813b;font-size:12px;letter-spacing:2px;margin:0 0 4px;text-transform:uppercase;">Neue Bestellung</p>
      <h1 style="color:#fff;font-size:22px;margin:0;">${reference}</h1>
    </div>

    <div style="padding:24px;">
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:24px;">
        <tr><td style="padding:4px 0;color:#6b7280;width:120px;">Zahlung</td><td style="padding:4px 0;">${paymentNote}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Betrag</td><td style="padding:4px 0;font-weight:bold;">${euro(options.totalAmount)}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">Kundin/Kunde</td><td style="padding:4px 0;">${escapeHtml(options.customerName ?? 'ohne Namen')}</td></tr>
        <tr><td style="padding:4px 0;color:#6b7280;">E-Mail</td><td style="padding:4px 0;">${options.customerEmail ? escapeHtml(options.customerEmail) : '<span style="color:#9ca3af;">keine</span>'}</td></tr>
      </table>

      ${bakeList.length > 0 ? `
      <h2 style="font-size:15px;margin:0 0 8px;color:#111827;">Zu backen</h2>
      <table style="width:100%;border-collapse:collapse;font-size:15px;color:#111827;margin-bottom:24px;">
        ${bakeList.map(([name, count]) => `<tr>
          <td style="padding:6px 0;border-bottom:1px solid #eee;">${escapeHtml(name)}</td>
          <td style="padding:6px 0;border-bottom:1px solid #eee;text-align:right;font-weight:bold;white-space:nowrap;">${count}×</td>
        </tr>`).join('')}
      </table>` : ''}

      <h2 style="font-size:15px;margin:0 0 8px;color:#111827;">Bestellung</h2>
      <table style="width:100%;border-collapse:collapse;font-size:14px;color:#374151;margin-bottom:24px;">
        ${itemRows}
      </table>

      <h2 style="font-size:15px;margin:0 0 8px;color:#111827;">Lieferadresse</h2>
      <p style="font-size:14px;color:#374151;line-height:1.6;margin:0 0 24px;">${addressHtml}</p>

      <a href="${siteUrl}/admin/orders" style="background:#331f16;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
        Im Adminbereich öffnen
      </a>
    </div>
  </div>
</body></html>`;

    return sendMail({
        to: contactEmail,
        subject: `Neue Bestellung ${reference}${options.isPaid ? '' : ' (Zahlung offen)'}`,
        html,
        // Antworten gehen direkt an die Kundschaft, nicht an einen selbst.
        replyTo: options.customerEmail ?? undefined,
    });
}
