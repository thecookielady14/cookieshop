import Link from "next/link";

export default function FAQ() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-4xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold mb-8 text-center text-[var(--color-brand-primary)] font-serif">Häufig gestellte Fragen (FAQ)</h1>

                <div className="space-y-6 text-neutral-700">
                    <div className="border border-neutral-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <h2 className="font-bold text-xl mb-3 text-gray-900">Wie lange sind die Cookies haltbar?</h2>
                        <p>
                            Da wir komplett auf künstliche Konservierungsstoffe verzichten und unsere Cookies frisch backen, empfehlen wir, sie innerhalb von <strong>5-7 Tagen</strong> zu genießen. Für den perfekten Geschmack wie frisch aus dem Ofen: Kurz vor dem Verzehr für 3-5 Minuten bei 150°C in den Backofen legen!
                        </p>
                    </div>

                    <div className="border border-neutral-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <h2 className="font-bold text-xl mb-3 text-gray-900">Sind die Cookies vegan oder glutenfrei?</h2>
                        <p>
                            Aktuell können wir in unserer Backstube Kreuzkontaminationen leider nicht zu 100% ausschließen. Daher bieten wir momentan noch keine zertifizierten veganen oder glutenfreien Cookies an. Wir arbeiten aber fleißig an neuen Rezepten! Bitte achte immer auf die Allergenhinweise bei den einzelnen Produkten.
                        </p>
                    </div>

                    <div className="border border-neutral-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <h2 className="font-bold text-xl mb-3 text-gray-900">Wie funktioniert der Versand?</h2>
                        <p>
                            Wir backen deine Cookies frisch auf Bestellung. In der Regel verlässt dein Paket 1-2 Werktage nach Bestelleingang unsere Backstube. Der Versand erfolgt sicher verpackt per DHL, sodass die Cookies spätestens nach 2-4 Werktagen duftend bei dir ankommen sollten.
                        </p>
                    </div>

                    <div className="border border-neutral-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <h2 className="font-bold text-xl mb-3 text-gray-900">Kann ich meine Bestellung zurückgeben?</h2>
                        <p>
                            Da es sich bei unseren Cookies um frische, schnell verderbliche Lebensmittel handelt, ist ein gesetzlicher <Link href="/widerruf" className="text-[var(--color-brand-primary)] hover:underline">Widerruf bzw. eine Rückgabe</Link> leider ausgeschlossen. Sollte aber doch mal etwas mit einer Lieferung nicht in Ordnung sein, kontaktiere uns bitte sofort – wir finden eine Lösung!
                        </p>
                    </div>

                    <div className="border border-neutral-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                        <h2 className="font-bold text-xl mb-3 text-gray-900">Backt ihr auch für Hochzeiten oder Firmenevents?</h2>
                        <p>
                            Super gerne! Für größere Bestellungen, individuelle Cookie-Designs oder besondere Anlässe schreib mir einfach über Instagram oder per E-Mail an <a href="mailto:kontakt@thecookielady.de" className="text-[var(--color-brand-primary)] hover:underline">kontakt@thecookielady.de</a>. Wir planen dann gemeinsam das perfekte süße Highlight für dein Event!
                        </p>
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <p className="text-gray-500 mb-6">Deine Frage war nicht dabei?</p>
                    <a
                        href="mailto:kontakt@thecookielady.de"
                        className="inline-block bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-accent)] text-white font-bold py-3 px-8 rounded-full transition-colors shadow-sm"
                    >
                        Schreib mir eine Nachricht
                    </a>
                </div>
            </div>
        </div>
    );
}
