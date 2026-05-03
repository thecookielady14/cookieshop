import Link from "next/link";
import type { Metadata } from "next";
import FaqAccordion, { FaqItem } from "@/components/FaqAccordion";

export const metadata: Metadata = {
    title: "FAQ – The Cookie Lady | Häufige Fragen zu Bestellung & Versand",
    description: "Alles was du wissen möchtest: Haltbarkeit, Versand, Dinkelmehl, Rückgabe und Events – hier beantworte ich die häufigsten Fragen.",
};

const faqItems: FaqItem[] = [
    {
        question: "Wie lange sind die Kekse haltbar?",
        answer: (
            <p>
                Da ich komplett auf künstliche Konservierungsstoffe verzichte und frisch backe, empfehle ich,
                die Kekse innerhalb von <strong>5–7 Tagen</strong> zu genießen. Für den perfekten Geschmack wie frisch aus dem Ofen:
                Kurz vor dem Verzehr für 1–2 Minuten bei 150 °C in den Backofen legen!
            </p>
        ),
    },
    {
        question: "Warum backst du nur mit Dinkelmehl – und was ist der Unterschied zu Weizen?",
        answer: (
            <div className="space-y-3">
                <p>
                    Dinkelmehl ist meine bewusste Entscheidung – und das aus gutem Grund: Im Vergleich zu herkömmlichem
                    Weizenmehl enthält Dinkel <strong>mehr Eiweiß, Ballaststoffe und Mineralstoffe</strong> wie Magnesium und Zink.
                    Außerdem wird Dinkel von vielen Menschen deutlich <strong>besser vertragen</strong> als Weizen,
                    da er einen anderen Klebereiweißanteil hat.
                </p>
                <p>
                    Das bedeutet nicht, dass meine Kekse glutenfrei sind – aber für Menschen mit leichter
                    Weizenempfindlichkeit (nicht Zöliakie) ist Dinkel oft eine angenehme Alternative.
                </p>
            </div>
        ),
    },
    {
        question: "Was macht die Kids-Kekse so besonders?",
        answer: (
            <div className="space-y-3">
                <p>
                    Als Mama ist es mir besonders wichtig, dass Kinder bewusst naschen können – ohne schlechtes Gewissen.
                    Meine <strong>Kids-Kekse kommen komplett ohne zugesetzten Zucker</strong> aus. Stattdessen süße ich
                    sie mit <strong>Fruchtpulver und echten Früchten</strong>, sodass der Geschmack natürlich und fruchtig ist.
                </p>
                <p>
                    Wie bei allen meinen Keksen verwende ich regionale Zutaten, von denen viele aus
                    <strong> biologischer Landwirtschaft</strong> stammen. So können die Kleinen bedenkenlos
                    zugreifen – und die Großen natürlich auch!
                </p>
            </div>
        ),
    },
    {
        question: "Wie und wann wird gebacken und versendet?",
        answer: (
            <div className="space-y-3">
                <p>
                    Als kleines Einzelunternehmen backe ich <strong>einmal pro Woche</strong> frisch – mit viel Sorgfalt
                    und ohne Abstriche bei der Qualität. Bestellungen, die bis <strong>Dienstag 12:00 Uhr</strong> eingehen,
                    werden in der gleichen Woche gebacken und noch in derselben Woche per DHL auf den Weg zu dir gebracht.
                </p>
                <p>
                    Du bekommst automatisch eine Versandbestätigung per E-Mail, sobald dein Paket unterwegs ist.
                </p>
            </div>
        ),
    },
    {
        question: "Warum backst du nur einmal pro Woche?",
        answer: (
            <p>
                Weil Qualität Zeit braucht. Ich backe jeden Keks mit der Hand, forme jeden Teigling einzeln
                Das ist kein Fließband – das ist Handwerk.
                Einmal pro Woche gibt mir die Zeit, wirklich sorgfältig zu arbeiten und dir etwas zu schicken,
                das es wert ist.
            </p>
        ),
    },
    {
        question: "Kann ich meine Bestellung zurückgeben?",
        answer: (
            <p>
                Da es sich bei meinen Keksen um frische, individuell hergestellte Lebensmittel handelt, ist ein gesetzlicher{" "}
                <Link href="/widerruf" className="text-[var(--color-brand-primary)] hover:underline font-medium">Widerruf bzw. eine Rückgabe</Link>{" "}
                leider ausgeschlossen. Sollte aber doch mal etwas mit einer Lieferung nicht stimmen,
                melde dich bitte sofort – wir finden eine Lösung!
            </p>
        ),
    },
    {
        question: "Backst du auch für Hochzeiten oder Firmenevents?",
        answer: (
            <p>
                Sehr gerne! Für größere Mengen, besondere Anlässe oder individuelle Wünsche schreib mir einfach
                per E-Mail an{" "}
                <a href="mailto:kontakt@thecookielady.de" className="text-[var(--color-brand-primary)] hover:underline font-medium">kontakt@thecookielady.de</a>.
                Ich plane dann mit dir gemeinsam das perfekte süße Highlight für dein Event!
            </p>
        ),
    },
];

export default function FAQ() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-36 pb-20 px-6 lg:px-12">
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
