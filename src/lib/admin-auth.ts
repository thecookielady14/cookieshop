/**
 * Wer darf in den Adminbereich?
 *
 * Vorher galt: wer bei Supabase angemeldet ist, kommt rein. Da im Projekt die
 * Selbstregistrierung offen stand, hätte sich jede beliebige Person ein Konto
 * anlegen und damit Bestellungen, Kundendaten und Produkte einsehen und ändern
 * können. Deshalb wird jetzt zusätzlich geprüft, WER angemeldet ist.
 *
 * Weitere Adressen lassen sich über die Umgebungsvariable ADMIN_EMAILS
 * ergänzen (kommagetrennt), ohne den Code anzufassen.
 */

const FALLBACK_ADMIN_EMAILS = ['kontakt@thecookielady.de'];

function allowedEmails(): string[] {
    const fromEnv = (process.env.ADMIN_EMAILS ?? '')
        .split(',')
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);

    return fromEnv.length > 0 ? fromEnv : FALLBACK_ADMIN_EMAILS;
}

/** Prüft, ob die E-Mail-Adresse eines angemeldeten Kontos Adminrechte hat. */
export function isAdminEmail(email: string | null | undefined): boolean {
    if (!email) return false;
    return allowedEmails().includes(email.toLowerCase());
}
