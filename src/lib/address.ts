/**
 * Lieferadressen einheitlich darstellen.
 *
 * Die Adresse kommt aus zwei Quellen, die sich unterschiedlich verhalten:
 * aus Stripe (Onlinebestellung) und aus dem Telefonformular. Beide legen sie
 * als JSON in `orders.shipping_address` ab. Ohne eine gemeinsame Stelle
 * driften Adminliste, Bestellmeldung und Versandmail auseinander – und genau
 * das ist passiert: die Adminliste zeigte nur den Ort, obwohl Straße und PLZ
 * gespeichert waren.
 *
 * Bewusst ohne Typenzwang auf die Felder: was Stripe liefert, ist nicht
 * garantiert vollständig. Leere Teile fallen weg, statt „undefined" oder eine
 * einsame Leerzeile zu erzeugen.
 */

export interface ShippingAddress {
    /** Empfängername. Bei Stripe steht er neben, nicht in der Adresse – der
     *  Webhook schreibt ihn hier hinein, damit Geschenksendungen stimmen. */
    name?: string | null;
    line1?: string | null;
    line2?: string | null;
    postal_code?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
}

/**
 * Die Adresse als Zeilen, wie sie auf ein Paket gehören.
 *
 * Das Land erscheint nur, wenn es nicht Deutschland ist: auf einem Inlandspaket
 * wäre „DE" nur Rauschen.
 */
export function addressLines(address: ShippingAddress | null | undefined): string[] {
    if (!address) return [];

    const ortszeile = [address.postal_code, address.city]
        .map((teil) => (teil ?? '').trim())
        .filter(Boolean)
        .join(' ');

    const land = (address.country ?? '').trim().toUpperCase();

    return [
        address.name,
        address.line1,
        address.line2,
        ortszeile,
        land && land !== 'DE' ? land : null,
    ]
        .map((zeile) => (zeile ?? '').trim())
        .filter(Boolean);
}

/** Dieselben Zeilen als Text – zum Kopieren in ein Versandetikett. */
export function addressText(address: ShippingAddress | null | undefined): string {
    return addressLines(address).join('\n');
}

/**
 * Reicht die Adresse zum Verschicken?
 *
 * Ohne Straße oder Ort lässt sich kein Paket adressieren. Das ist keine
 * Formatfrage, sondern der Unterschied zwischen „Adresse fehlt teilweise" und
 * „ich kann packen" – die Adminliste soll das deutlich sagen können.
 */
export function isDeliverable(address: ShippingAddress | null | undefined): boolean {
    if (!address) return false;
    return Boolean((address.line1 ?? '').trim() && (address.city ?? '').trim());
}
