/**
 * Bestellstatus: deutsche Bezeichnung und Farbe an einer Stelle.
 *
 * Vorher übersetzten Bestellliste und Übersicht den Status getrennt – und
 * beide unvollständig, aber unterschiedlich: In der Liste erschien bei einer
 * stornierten Bestellung "cancelled", in der Übersicht zusätzlich "paid".
 * Genau so entsteht englisches Kauderwelsch in einer deutschen Oberfläche.
 *
 * `istEinnahme` beantwortet die Frage, die für Zahlen wichtig ist: Ist das
 * Geld tatsächlich geflossen? Eine stornierte oder noch offene Bestellung
 * gehört in keine Umsatzsumme.
 */

export interface StatusInfo {
    label: string;
    /** Tailwind-Klassen für Hintergrund und Schrift. */
    farbe: string;
    /** Zählt diese Bestellung als eingenommenes Geld? */
    istEinnahme: boolean;
    /** Steht diese Bestellung noch zur Bearbeitung an? */
    istOffen: boolean;
}

const STATUS: Record<string, StatusInfo> = {
    pending:    { label: 'Unbezahlt',      farbe: 'bg-yellow-100 text-yellow-800', istEinnahme: false, istOffen: true },
    paid:       { label: 'In Bearbeitung', farbe: 'bg-blue-100 text-blue-800',     istEinnahme: true,  istOffen: true },
    processing: { label: 'In Bearbeitung', farbe: 'bg-blue-100 text-blue-800',     istEinnahme: true,  istOffen: true },
    shipped:    { label: 'Versendet',      farbe: 'bg-purple-100 text-purple-800', istEinnahme: true,  istOffen: false },
    delivered:  { label: 'Zugestellt',     farbe: 'bg-green-100 text-green-800',   istEinnahme: true,  istOffen: false },
    cancelled:  { label: 'Storniert',      farbe: 'bg-red-100 text-red-800',       istEinnahme: false, istOffen: false },
};

/**
 * Angaben zu einem Status. Unbekannte Werte behalten ihren Rohwert als
 * Bezeichnung – lieber sichtbar seltsam als stillschweigend falsch.
 */
export function statusInfo(status: string | null | undefined): StatusInfo {
    return STATUS[status ?? ''] ?? {
        label: status ?? 'unbekannt',
        farbe: 'bg-gray-100 text-gray-700',
        istEinnahme: false,
        istOffen: false,
    };
}

export const statusLabel = (status: string | null | undefined) => statusInfo(status).label;
export const zaehltAlsUmsatz = (status: string | null | undefined) => statusInfo(status).istEinnahme;
