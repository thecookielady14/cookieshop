import Link from "next/link";
import type { Metadata } from "next";
import FaqAccordion, { FaqItem } from "@/components/FaqAccordion";

export const metadata: Metadata = {
    title: "FAQ – The Cookie Lady | Häufige Fragen zu Bestellung & Versand",
    description: "Hier findest du Antworten auf die häufigsten Fragen: Haltbarkeit, Versand, Rückgabe, Allergene und Sonderbestellungen für Hochzeiten & Events.",
};

const faqItems: FaqItem[] = [
    {
        question: "Wie lange sind die Cookies haltbar?",
        answer: (
            <p>
                Da wir komplett auf künstliche Konservierungsstoffe verzichten und unsere Cookies frisch backen, empfehlen wir, sie innerhalb von <strong>5–7 Tagen</strong> zu genießen. Für den perfekten Geschmack wie frisch aus dem Ofen: Kurz vor dem Verzehr für 1–2 Minuten bei 150°C in den Backofen legen!
            </p>
        ),
    },
    {
        question: "Sind die Cookies vegan oder glutenfrei?",
        answer: (
            <p>
                Aktuell können wir in unserer Backstube Kreuzkontaminationen leider nicht zu 100% ausschließen. Daher bieten wir momentan noch keine zertifizierten veganen oder glutenfreien Cookies an. Wir arbeiten aber fleißig an neuen Rezepten! Bitte achte immer auf die Allergenhinweise bei den einzelnen Produkten.
            </p>
        ),
    },
    {
        question: "Wie funktioniert der Versand?",
        answer: (
            <p>
                Wir backen deine Cookies frisch auf Bestellung. In der Regel verlässt dein Paket <strong>1–2 Werktage</strong> nach Bestelleingang unsere Backstube. Der Versand erfolgt sicher verpackt per DHL, sodass die Cookies spätestens nach 2–4 Werktagen duftend bei dir ankommen sollten.
            </p>
        ),
    },
    {
        question: "Kann ich meine Bestellung zurückgeben?",
        answer: (
            <p>
                Da es sich bei unseren Cookies um frische, schnell verderbliche Lebensmittel handelt, ist ein gesetzlicher <Link href="/widerruf" className="text-[var(--color-brand-primary)] hover:underline font-medium">Widerruf bzw. eine Rückgabe</Link> leider ausgeschlossen. Sollte aber doch mal etwas mit einer Lieferung nicht in Ordnung sein, kontaktiere uns bitte sofort – wir finden eine Lösung!
            </p>
        ),
    },
    {
        question: "Backt ihr auch für Hochzeiten oder Firmenevents?",
        answer: (
            <p>
                Super gerne! Für größere Bestellungen, individuelle Cookie-Designs oder besondere Anlässe schreib mir einfach über Instagram oder per E-Mail an{" "}
                <a href="mailto:kontakt@thecookielady.de" className="text-[var(--color-brand-primary)] hover:underline font-medium">kontakt@thecookielady.de</a>.
                Wir planen dann gemeinsam das perfekte süße Highlight für dein Event!
            </p>
        ),
    },
];

export default function FAQ() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-3xl font-bold mb-4 text-center text-[var(--color-brand-primary)] font-serif">
                    Häufig gestellte Fragen
                </h1>
                <p className="text-center text-[var(--color-brand-dark)] mb-12">
                    Alles was du wissen musst – auf einen Blick.
                </p>

                <FaqAccordion items={faqItems} />

                <div className="mt-12 text-center">
                    <p className="text-gray-500 mb-6">Deine Frage war nicht dabei?</p>
                    <a
                        href="mailto:kontakt@thecookielady.de"
                        className="inline-block bg-[var(--color-brand-primary)] hover:bg-[var(--color-brand-dark)] text-white font-bold py-3 px-8 rounded-full transition-all shadow-sm hover:-translate-y-0.5 hover:shadow-md"
                    >
                        Schreib mir eine Nachricht
                    </a>
                </div>
            </div>
        </div>
    );
}
