import { differenceInCalendarDays, parseISO } from 'date-fns';

/**
 * MHD-Warnung für Zutaten.
 *
 * Ob gewarnt wird, entscheidet die Sicht public.mhd_warnings (E-Mail und
 * Übersicht). Die Funktionen hier rechnen dieselbe Regel im Browser nach,
 * damit die Zutatenliste ihre Farben ohne zusätzliche Abfrage bekommt.
 */

export interface MhdWarning {
    lot_id: string;
    lot_number: string;
    best_before: string;
    days_left: number;
    mhd_warned_at: string | null;
    mhd_expired_at: string | null;
    ingredient_id: string;
    ingredient_name: string;
    supplier: string | null;
    mhd_warn_days: number;
}

/** Auswahl pro Zutat. null = keine Warnung (z. B. Salz, Zucker). */
export const MHD_WARN_OPTIONS: { value: number | null; label: string }[] = [
    { value: null, label: 'Keine MHD-Warnung' },
    { value: 3, label: '3 Tage vorher warnen' },
    { value: 7, label: '1 Woche vorher warnen' },
    { value: 14, label: '2 Wochen vorher warnen' },
    { value: 30, label: '1 Monat vorher warnen' },
    { value: 60, label: '2 Monate vorher warnen' },
];

export type MhdStatus = 'ok' | 'bald' | 'abgelaufen';

/**
 * Abgelaufen ist abgelaufen – auch ohne eingestellte Warnung. „Bald" dagegen
 * gibt es nur, wenn für die Zutat eine Vorlaufzeit gewählt ist.
 */
export function mhdStatus(bestBefore: string | null, warnDays: number | null, today = new Date()): MhdStatus {
    if (!bestBefore) return 'ok';
    const left = differenceInCalendarDays(parseISO(bestBefore), today);
    if (left < 0) return 'abgelaufen';
    if (warnDays !== null && left <= warnDays) return 'bald';
    return 'ok';
}

/** „läuft heute ab", „noch 5 Tage", „seit 3 Tagen abgelaufen" */
export function mhdText(w: { days_left: number }): string {
    const d = w.days_left;
    if (d < 0) return d === -1 ? 'seit gestern abgelaufen' : `seit ${-d} Tagen abgelaufen`;
    if (d === 0) return 'läuft heute ab';
    if (d === 1) return 'läuft morgen ab';
    return `noch ${d} Tage`;
}
