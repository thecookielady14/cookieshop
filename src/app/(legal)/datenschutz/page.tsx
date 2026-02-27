export default function Datenschutz() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-3xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold mb-8">Datenschutzerklärung</h1>

                <div className="space-y-6 text-neutral-700">
                    <section>
                        <h2 className="font-bold text-xl mb-2">1. Datenschutz auf einen Blick</h2>
                        <h3 className="font-bold text-lg mb-1">Allgemeine Hinweise</h3>
                        <p>
                            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert,
                            wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">2. Hosting</h2>
                        <p>
                            Wir hosten die Inhalte unserer Website bei Vercel. Anbieter ist die Vercel Inc., 340 S Lemon Ave #4133, Walnut, CA 91789, USA.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">3. Zahlungsanbieter (Stripe)</h2>
                        <p>
                            Wir binden auf dieser Website keine eigenen Zahlungsformulare ein, sondern leiten zur Zahlungsabwicklung
                            auf die Server des Dienstleisters Stripe weiter. Anbieter ist Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland.
                            Weitere Details zur Datenverarbeitung finden Sie in der Datenschutzerklärung von Stripe.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">4. Ihre Rechte</h2>
                        <p>
                            Sie haben jederzeit das Recht, unentgeltlich Auskunft über Herkunft, Empfänger und Zweck Ihrer gespeicherten
                            personenbezogenen Daten zu erhalten. Sie haben außerdem ein Recht, die Berichtigung oder Löschung dieser Daten zu verlangen.
                        </p>
                    </section>

                    <p className="text-sm opacity-60 italic mt-8 border-t pt-8">
                        Hinweis: Dies ist ein stark verkürzter Platzhalter für die Datenschutzerklärung gemäß DSGVO. Diese muss vor Live-Schaltung
                        von einem Experten (oder via Generatoren wie e-recht24) vollständig und rechtssicher generiert werden.
                    </p>
                </div>
            </div>
        </div>
    );
}
