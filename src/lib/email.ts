import { contactEmail, siteName } from '@/lib/site';

/**
 * E-Mail-Versand über Resend.
 *
 * An einer Stelle, weil inzwischen drei Mails verschickt werden:
 * Bestellbestätigung und Versandbenachrichtigung an die Kundschaft sowie die
 * Meldung über eine neue Bestellung an die Betreiberin. Damit steht der
 * Absender, die Schnittstelle und die Regel „ohne Schlüssel wird nichts
 * verschickt" nur einmal im Code.
 *
 * Ohne RESEND_API_KEY passiert nichts – der Shop bleibt benutzbar, es geht nur
 * keine Mail raus. Das ist Absicht: ein fehlgeschlagener Mailversand darf
 * niemals eine Bestellung verhindern.
 */

export interface MailResult {
    sent: boolean;
    /** Grund, falls nichts verschickt wurde – für das Log, nicht für Kunden. */
    reason?: string;
}

export async function sendMail(options: {
    to: string;
    subject: string;
    html: string;
    /** Antworten sollen woanders landen als beim Absender. */
    replyTo?: string;
}): Promise<MailResult> {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        console.warn(`RESEND_API_KEY nicht gesetzt – Mail "${options.subject}" wurde nicht verschickt.`);
        return { sent: false, reason: 'Kein RESEND_API_KEY' };
    }
    if (!options.to) {
        return { sent: false, reason: 'Keine Empfängeradresse' };
    }

    try {
        const response = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                from: `${siteName} <${contactEmail}>`,
                to: [options.to],
                subject: options.subject,
                html: options.html,
                ...(options.replyTo ? { reply_to: options.replyTo } : {}),
            }),
        });

        if (!response.ok) {
            const detail = await response.text();
            console.error(`Resend lehnte "${options.subject}" ab:`, detail);
            return { sent: false, reason: detail.slice(0, 200) };
        }

        return { sent: true };
    } catch (error) {
        console.error(`Mailversand "${options.subject}" fehlgeschlagen:`, error);
        return { sent: false, reason: String(error).slice(0, 200) };
    }
}
