/**
 * Ladeanzeige nur für den Adminbereich.
 *
 * Auf den Kundenseiten darf es KEINE loading.tsx geben: sobald Next die
 * Ladehülle streamt, steht der Statuscode 200 fest, und ein späteres
 * notFound() kann ihn nicht mehr auf 404 ändern. Eine nicht existierende
 * Linie oder ein gelöschtes Produkt würden dann als gültige Seite gelten
 * und von Suchmaschinen als Soft-404 gewertet.
 */
export default function AdminLoading() {
    return (
        <div className="flex items-center gap-3 text-gray-500">
            <span className="text-2xl animate-bounce" aria-hidden="true">🍪</span>
            <span role="status">Wird geladen …</span>
        </div>
    );
}
