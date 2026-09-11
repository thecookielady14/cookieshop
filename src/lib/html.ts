/**
 * Text für die Ausgabe in HTML entschärfen.
 *
 * Namen und Adressen kommen aus dem Checkout, also von außen. Landen sie roh
 * in einer E-Mail-Vorlage, genügt ein spitzes Klammerpaar oder ein
 * Anführungszeichen, um die Darstellung zu zerlegen – und im schlimmsten Fall
 * lässt sich fremdes Markup einschleusen.
 *
 * Liegt in einer eigenen Datei, weil inzwischen zwei Mailvorlagen dieselbe
 * Funktion brauchen und eine Kopie irgendwann von der anderen abweicht.
 */
export function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
