import type { Metadata } from "next";
import Link from "next/link";
import { Truck, Clock, Package, CreditCard } from "lucide-react";
import { getShopSettings, formatEuro } from "@/lib/shop-settings";
import { VAT_PERCENTAGE } from "@/lib/site";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Versand & Lieferung",
    description: "Versandkosten, Lieferzeiten und Zahlungsarten bei The Cookie Lady – frisch gebackene Kekse, sorgfältig verpackt und deutschlandweit versendet.",
};

export default async function Versand() {
    const settings = await getShopSettings();

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-4xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="font-serif text-3xl font-bold mb-8">Versand & Lieferung</h1>

                <div className="space-y-10 text-neutral-700 leading-relaxed">

                    <section>
                        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                            <Truck className="w-5 h-5 text-[var(--color-brand-primary)]" />
                            Versandkosten
                        </h2>
                        <div className="bg-[var(--color-brand-secondary)] rounded-2xl overflow-hidden">
                            <table className="w-full text-left">
                                <tbody>
                                    <tr className="border-b border-black/5">
                                        <td className="p-4 font-medium">Standardversand innerhalb Deutschlands</td>
                                        <td className="p-4 text-right font-bold whitespace-nowrap">
                                            {formatEuro(settings.shippingCost)}
                                        </td>
                                    </tr>
                                    {settings.freeShippingThreshold !== null && (
                                        <tr>
                                            <td className="p-4 font-medium">
                                                Ab einem Bestellwert von {formatEuro(settings.freeShippingThreshold)}
                                            </td>
                                            <td className="p-4 text-right font-bold whitespace-nowrap text-green-700">
                                                versandkostenfrei
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <p className="text-sm text-neutral-500 mt-3">
                            Alle Preise verstehen sich inklusive {VAT_PERCENTAGE} % Mehrwertsteuer – Lebensmittel unterliegen dem ermäßigten Steuersatz, die Versandkosten als Nebenleistung ebenfalls. Die Versandkosten
                            fallen einmalig pro Bestellung an, unabhängig von der Anzahl der Kekse.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                            <Clock className="w-5 h-5 text-[var(--color-brand-primary)]" />
                            Lieferzeit
                        </h2>
                        <p className="mb-4">
                            Ich backe als kleines Einzelunternehmen <strong>einmal pro Woche</strong> frisch.
                            Bestellungen, die bis <strong>Dienstag 12:00 Uhr</strong> eingehen, werden in derselben
                            Woche gebacken und verschickt.
                        </p>
                        <p>
                            Sobald dein Paket unterwegs ist, bekommst du automatisch eine Versandbestätigung per
                            E-Mail. Ab Versand dauert die Zustellung in der Regel{' '}
                            <strong>{settings.deliveryDaysMin}–{settings.deliveryDaysMax} Werktage</strong>.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                            <Package className="w-5 h-5 text-[var(--color-brand-primary)]" />
                            Versandgebiet & Verpackung
                        </h2>
                        <p className="mb-4">
                            Wir versenden derzeit ausschließlich <strong>innerhalb Deutschlands</strong> mit DHL.
                            Eine Selbstabholung ist leider nicht möglich.
                        </p>
                        <p>
                            Deine Kekse werden bruchsicher und frischegeschützt verpackt. Sollte trotzdem einmal
                            etwas nicht in Ordnung sein, melde dich bitte umgehend unter{' '}
                            <a href="mailto:kontakt@thecookielady.de" className="text-[var(--color-brand-primary)] hover:underline">
                                kontakt@thecookielady.de
                            </a>{' '}
                            – wir finden eine Lösung.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-4 flex items-center gap-2">
                            <CreditCard className="w-5 h-5 text-[var(--color-brand-primary)]" />
                            Zahlungsarten
                        </h2>
                        <p>
                            Die Bezahlung läuft sicher über unseren Zahlungsdienstleister Stripe. Zur Verfügung
                            stehen <strong>Kredit- und Debitkarte</strong> sowie <strong>PayPal</strong>. Deine
                            Rechnung erhältst du automatisch als PDF per E-Mail.
                        </p>
                    </section>

                    <section className="border-t border-neutral-200 pt-8 text-sm text-neutral-500">
                        Weitere Informationen findest du in unseren{' '}
                        <Link href="/agb" className="text-[var(--color-brand-primary)] hover:underline">AGB</Link>{' '}
                        und in der{' '}
                        <Link href="/widerruf" className="text-[var(--color-brand-primary)] hover:underline">
                            Widerrufsbelehrung
                        </Link>.
                    </section>

                </div>
            </div>
        </div>
    );
}
