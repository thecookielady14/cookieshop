export default function Widerruf() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-3xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold mb-8">Widerrufsbelehrung</h1>

                <div className="space-y-6 text-neutral-700">
                    <section>
                        <h2 className="font-bold text-xl mb-2">Widerrufsrecht</h2>
                        <p>
                            Verbraucher haben ein vierzehntägiges Widerrufsrecht.
                        </p>
                        <p className="mt-4">
                            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
                            Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">Ausschluss des Widerrufsrechts</h2>
                        <p className="bg-[var(--color-brand-bg)] p-4 rounded-xl text-[var(--color-brand-text)] font-medium">
                            Achtung: Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren,
                            die schnell verderben können oder deren Verfallsdatum schnell überschritten würde (wie bei frischen Backwaren/Cookies).
                        </p>
                    </section>

                    <p className="text-sm opacity-60 italic mt-8 border-t pt-8">
                        Hinweis: Dies ist ein Platzhalter. Bitte von einem Experten prüfen lassen. Der Ausschluss für frische Lebensmittel (§ 312g Abs. 2 Nr. 2 BGB) ist für Cookies essenziell!
                    </p>
                </div>
            </div>
        </div>
    );
}
