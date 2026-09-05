/**
 * Wird angezeigt, solange eine Server Component ihre Daten lädt
 * (Startseite, Shop und Produktseiten laufen mit force-dynamic).
 */
export default function Loading() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen flex flex-col items-center justify-center gap-4">
            <div className="text-6xl animate-bounce" aria-hidden="true">🍪</div>
            <p className="text-[var(--color-brand-dark)] font-medium">Frisch aus dem Ofen …</p>
            <span className="sr-only" role="status">Inhalte werden geladen</span>
        </div>
    );
}
