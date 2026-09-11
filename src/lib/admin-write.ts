/**
 * Prüfen, ob ein Schreibvorgang im Adminbereich wirklich etwas bewirkt hat.
 *
 * Der Hintergrund ist eine unangenehme Eigenheit: Trifft ein UPDATE oder
 * DELETE wegen der Zeilenschutzregeln (RLS) keine einzige Zeile, antwortet
 * PostgREST mit HTTP 200 und einer leeren Liste – also ohne Fehler. Wer nur
 * auf `error` prüft, hält das für Erfolg. Genau so ist am 11.09.2026 ein
 * Bestellstatus im Browser auf „Versendet" gesprungen, während die Datenbank
 * unverändert „bezahlt" enthielt.
 *
 * Deshalb fordern schreibende Aufrufe die betroffenen Zeilen mit `.select()`
 * zurück und reichen das Ergebnis hier durch. Kommt nichts zurück, ist fast
 * immer die Anmeldung abgelaufen.
 */
export function assertWritten(rows: unknown[] | null | undefined, was: string): void {
    if (!rows || rows.length === 0) {
        throw new Error(
            `${was} wurde nicht gespeichert – vermutlich ist die Anmeldung abgelaufen. ` +
            'Bitte die Seite neu laden, erneut anmelden und es noch einmal versuchen.'
        );
    }
}
