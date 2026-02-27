export default function AGB() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-4xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold mb-8">Allgemeine Geschäftsbedingungen (AGB)</h1>

                <div className="space-y-8 text-neutral-700 leading-relaxed">
                    <section>
                        <h2 className="font-bold text-xl mb-3">1. Geltungsbereich</h2>
                        <p>
                            Für alle Bestellungen über unseren Online-Shop durch Verbraucher und Unternehmer gelten die nachfolgenden AGB.
                            Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder
                            ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">2. Vertragspartner, Vertragsschluss</h2>
                        <p className="mb-4">
                            Der Kaufvertrag kommt zustande mit Tanja Lux - The Cookie Lady.
                        </p>
                        <p>
                            Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot, sondern einen unverbindlichen
                            Online-Katalog dar. Sie können unsere Produkte zunächst unverbindlich in den Warenkorb legen und Ihre Eingaben vor
                            Absenden Ihrer verbindlichen Bestellung jederzeit korrigieren. Durch Anklicken des Bestellbuttons geben Sie eine
                            verbindliche Bestellung der im Warenkorb enthaltenen Waren ab. Die Bestätigung des Zugangs Ihrer Bestellung erfolgt
                            per E-Mail unmittelbar nach dem Absenden der Bestellung.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">3. Vertragssprache, Vertragstextspeicherung</h2>
                        <p>
                            Die für den Vertragsschluss zur Verfügung stehende Sprache ist Deutsch. Wir speichern den Vertragstext und senden
                            Ihnen die Bestelldaten und unsere AGB per E-Mail zu.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">4. Lieferbedingungen</h2>
                        <p>
                            Zuzüglich zu den angegebenen Produktpreisen kommen noch Versandkosten hinzu. Näheres zur Höhe der Versandkosten
                            erfahren Sie bei den Angeboten. Wir liefern nur im Versandweg. Eine Selbstabholung der Ware ist leider nicht möglich.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">5. Bezahlung</h2>
                        <p className="mb-4">
                            In unserem Shop stehen Ihnen grundsätzlich die folgenden Zahlungsarten zur Verfügung, welche über unseren Zahlungsdienstleister Stripe abgewickelt werden:
                        </p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Kreditkarte:</strong> Mit Abgabe der Bestellung übermitteln Sie Ihre Kreditkartendaten. Nach Ihrer Legitimation als rechtmäßiger Karteninhaber fordert Stripe unmittelbar nach der Bestellung Ihr Kreditkartenunternehmen zur Einleitung der Zahlungstransaktion auf.</li>
                            <li><strong>PayPal:</strong> Im Bestellprozess werden Sie auf die Webseite des Online-Anbieters PayPal weitergeleitet. Dort können Sie Ihre Zahlungsdaten angeben und die Zahlungsanweisung an PayPal bestätigen.</li>
                            <li><strong>Apple Pay / Google Pay:</strong> Um den Rechnungsbetrag über Apple Pay oder Google Pay bezahlen zu können, müssen Sie bei dem jeweiligen Dienstanbieter registriert sein und die Zahlungsanweisung bestätigen.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">6. Eigentumsvorbehalt</h2>
                        <p>
                            Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">7. Transportschäden</h2>
                        <p>
                            Werden Waren mit offensichtlichen Transportschäden angeliefert, so reklamieren Sie solche Fehler bitte möglichst
                            sofort beim Zusteller und nehmen Sie bitte unverzüglich Kontakt zu uns auf.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">8. Gewährleistung und Garantien</h2>
                        <p>
                            Soweit nicht nachstehend ausdrücklich anders vereinbart, gilt das gesetzliche Mängelhaftungsrecht. Bei unseren Cookies handelt es sich um schnell verderbliche frische Lebensmittel. Etwaige Mängel sind uns unter Beifügung von Beweisfotos umgehend nach Erhalt mitzuteilen.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">9. Streitbeilegung</h2>
                        <p>
                            Die Europäische Kommission stellt eine Plattform zur Online-Streitbeilegung (OS) bereit, die Sie hier finden:
                            <a href="https://ec.europa.eu/consumers/odr/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-primary)] hover:underline ml-1">https://ec.europa.eu/consumers/odr/</a>.
                            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                        </p>
                    </section>

                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-8">
                        <p className="text-sm text-amber-800 font-medium italic">
                            Hinweis: Diese AGB wurden auf Basis von Standard-Vorlagen für den elektronischen Geschäftsverkehr erstellt. Bitte prüfen Sie diese als Gewerbetreibende dennoch sorgfältig oder lassen Sie sie im Zweifel kurz von einem Anwalt absegnen.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
