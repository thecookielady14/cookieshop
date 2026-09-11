/**
 * Zahl mit passender Ein- oder Mehrzahl ausgeben.
 *
 * Klingt nach Kleinkram, war aber innerhalb eines Tages dreimal falsch:
 * „1 leckere Kekse" im Warenkorb, „1 Kekse" in der Übersicht und „1 Sorten"
 * bei den Linien. Jedes Mal, weil die Mehrzahl fest im Text stand.
 *
 * Wörter, die in beiden Fällen gleich lauten – Artikel, Euro –, brauchen die
 * Funktion nicht.
 */
export function plural(anzahl: number, einzahl: string, mehrzahl: string): string {
    return `${anzahl} ${anzahl === 1 ? einzahl : mehrzahl}`;
}
