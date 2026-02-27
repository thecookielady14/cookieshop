export default function AGB() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-3xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen</h1>

                <div className="space-y-6 text-neutral-700">
                    <section>
                        <h2 className="font-bold text-xl mb-2">1. Geltungsbereich</h2>
                        <p>
                            Für alle Bestellungen über unseren Online-Shop gelten die nachfolgenden Allgemeinen Geschäftsbedingungen (AGB).
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">2. Vertragspartner, Kundendienst</h2>
                        <p>
                            Der Kaufvertrag kommt zustande mit The Cookie Lady.<br />
                            Weitere Informationen zu uns finden Sie im Impressum.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">3. Vertragsabschluss</h2>
                        <p>
                            Mit Einstellung der Produkte in den Online-Shop geben wir ein verbindliches Angebot zum Vertragsschluss über diese Artikel ab.
                            Der Vertrag kommt zustande, indem Sie durch Anklicken des Bestellbuttons das Angebot über die im Warenkorb enthaltenen Waren annehmen.
                            Unmittelbar nach dem Absenden der Bestellung erhalten Sie noch einmal eine Bestätigung per E-Mail.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">4. Bezahlung</h2>
                        <p>
                            Die Zahlung erfolgt sicher und verschlüsselt über unseren Zahlungsdienstleister Stripe.
                        </p>
                    </section>

                    <p className="text-sm opacity-60 italic mt-8 border-t pt-8">
                        Hinweis: Dies ist ein stark verkürzter Platzhalter für die AGB. Diese müssen vor Live-Schaltung
                        von einem Experten (oder via Generatoren wie der IT-Recht Kanzlei) vollständig und rechtssicher generiert werden.
                    </p>
                </div>
            </div>
        </div>
    );
}
