import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { sendMail } from '@/lib/email';
import { escapeHtml } from '@/lib/html';
import { contactEmail, siteUrl } from '@/lib/site';
import { mhdText, type MhdWarning } from '@/lib/mhd';

/**
 * Tägliche MHD-Prüfung der Zutaten (angestoßen von
 * netlify/functions/mhd-warnung.mts).
 *
 * Jede Charge löst höchstens zwei Mails aus: einmal beim Eintritt in den
 * Warnzeitraum, einmal wenn das MHD überschritten ist. Die Zeitpunkte stehen
 * an der Charge (mhd_warned_at / mhd_expired_at) – so kommt nicht jeden
 * Morgen dieselbe Mail. Im Adminbereich bleibt der Hinweis dagegen stehen,
 * bis die Charge als aufgebraucht markiert ist.
 *
 * Geschützt über CRON_SECRET. Ohne gesetztes Secret lehnt die Route alles ab
 * (fail closed), statt offen zu sein.
 */
export async function POST(request: Request) {
    const secret = process.env.CRON_SECRET;
    if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
        return NextResponse.json({ error: 'Nicht erlaubt' }, { status: 401 });
    }

    const { data, error } = await supabaseAdmin.from('mhd_warnings').select('*');
    if (error) {
        console.error('MHD-Prüfung fehlgeschlagen:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = (data ?? []) as MhdWarning[];
    const abgelaufen = rows.filter((r) => r.days_left < 0 && !r.mhd_expired_at);
    const bald = rows.filter((r) => r.days_left >= 0 && !r.mhd_warned_at);

    if (abgelaufen.length === 0 && bald.length === 0) {
        return NextResponse.json({ sent: false, offen: rows.length });
    }

    const liste = (items: MhdWarning[]) => items
        .sort((a, b) => a.days_left - b.days_left)
        .map((r) => `<li style="margin-bottom:6px;"><strong>${escapeHtml(r.ingredient_name)}</strong>, Los ${escapeHtml(r.lot_number)} – ${escapeHtml(mhdText(r))}</li>`)
        .join('');

    const html = `<!DOCTYPE html>
<html lang="de"><body style="margin:0;padding:24px;background:#f9fafb;font-family:Arial,sans-serif;">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;">
    <h1 style="font-size:20px;margin:0 0 16px;color:#331f16;">MHD-Hinweis für deine Zutaten</h1>
    ${abgelaufen.length > 0 ? `
    <h2 style="font-size:15px;margin:0 0 8px;color:#b91c1c;">MHD überschritten</h2>
    <ul style="font-size:14px;color:#374151;padding-left:20px;margin:0 0 20px;">${liste(abgelaufen)}</ul>` : ''}
    ${bald.length > 0 ? `
    <h2 style="font-size:15px;margin:0 0 8px;color:#92400e;">MHD läuft bald ab</h2>
    <ul style="font-size:14px;color:#374151;padding-left:20px;margin:0 0 20px;">${liste(bald)}</ul>` : ''}
    <p style="font-size:13px;color:#6b7280;line-height:1.5;margin:0 0 20px;">
      Ist eine Packung leer, markiere sie unter „Zutaten“ als aufgebraucht – dann kommt dazu keine weitere Meldung.
    </p>
    <a href="${siteUrl}/admin/zutaten" style="background:#331f16;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;font-size:14px;display:inline-block;">
      Zutaten öffnen
    </a>
  </div>
</body></html>`;

    const result = await sendMail({
        to: contactEmail,
        subject: abgelaufen.length > 0
            ? `MHD überschritten: ${abgelaufen.map((r) => r.ingredient_name).join(', ')}`
            : `MHD läuft bald ab: ${bald.map((r) => r.ingredient_name).join(', ')}`,
        html,
    });

    // Nur als gemeldet markieren, wenn die Mail wirklich raus ist – sonst
    // versucht es der nächste Lauf erneut.
    if (result.sent) {
        const jetzt = new Date().toISOString();
        if (bald.length > 0) {
            await supabaseAdmin.from('ingredient_lots')
                .update({ mhd_warned_at: jetzt }).in('id', bald.map((r) => r.lot_id));
        }
        if (abgelaufen.length > 0) {
            // Wer direkt abgelaufen gemeldet wird, braucht die Vorwarnung nicht mehr.
            await supabaseAdmin.from('ingredient_lots')
                .update({ mhd_expired_at: jetzt, mhd_warned_at: jetzt }).in('id', abgelaufen.map((r) => r.lot_id));
        }
    }

    return NextResponse.json({ sent: result.sent, reason: result.reason, bald: bald.length, abgelaufen: abgelaufen.length });
}
