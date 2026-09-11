/**
 * Sendungsverfolgung: Nummer und Paketdienst zu einem Link zusammensetzen.
 *
 * An einer Stelle, weil der Link an zwei Orten gebraucht wird – in der
 * Bestellliste und in der Versandmail. Liefe das auseinander, würde die
 * Kundschaft einen anderen Link sehen als die Betreiberin.
 *
 * Bewusst ohne Rateversuch: Ist kein Dienst hinterlegt, gibt es keinen Link,
 * sondern nur die Nummer zum Abtippen. Ein Link, der beim falschen Anbieter
 * landet, ist ärgerlicher als gar keiner.
 *
 * Die Adressmuster können sich ändern – wenn ein Link ins Leere führt, ist
 * hier die einzige Stelle, die angefasst werden muss.
 */

export interface Carrier {
    id: string;
    name: string;
    /** `{nummer}` wird ersetzt. Leer = dieser Dienst kann nicht verlinkt werden. */
    urlMuster: string;
}

export const CARRIERS: Carrier[] = [
    {
        id: 'dhl',
        name: 'DHL / Deutsche Post',
        urlMuster: 'https://www.dhl.de/de/privatkunden/pakete-empfangen/verfolgen.html?piececode={nummer}',
    },
    {
        id: 'hermes',
        name: 'Hermes',
        urlMuster: 'https://www.myhermes.de/empfangen/sendungsverfolgung/sendungsinformation/#{nummer}',
    },
    {
        id: 'dpd',
        name: 'DPD',
        urlMuster: 'https://my.dpd.de/redirect.aspx?action=1&parcelno={nummer}',
    },
    {
        id: 'gls',
        name: 'GLS',
        urlMuster: 'https://gls-group.com/DE/de/paketverfolgung?match={nummer}',
    },
    {
        id: 'ups',
        name: 'UPS',
        urlMuster: 'https://www.ups.com/track?loc=de_DE&tracknum={nummer}',
    },
    {
        // Für alles andere: Nummer anzeigen, aber nicht verlinken.
        id: 'sonstige',
        name: 'Anderer Dienst',
        urlMuster: '',
    },
];

export function carrierName(id: string | null | undefined): string | null {
    if (!id) return null;
    return CARRIERS.find((c) => c.id === id)?.name ?? null;
}

/** Verfolgungslink, oder null wenn er sich nicht sicher bilden lässt. */
export function trackingUrl(
    nummer: string | null | undefined,
    carrierId: string | null | undefined
): string | null {
    const sauber = (nummer ?? '').trim();
    if (!sauber) return null;

    const carrier = CARRIERS.find((c) => c.id === carrierId);
    if (!carrier || !carrier.urlMuster) return null;

    return carrier.urlMuster.replace('{nummer}', encodeURIComponent(sauber));
}
