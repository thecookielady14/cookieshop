import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Datenschutzerklärung",
    description: "Datenschutzerklärung gemäß DSGVO für den Online-Shop The Cookie Lady. Informationen zu Datenverarbeitung, Cookies, Supabase und Stripe.",
};

export default function Datenschutz() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-4xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="font-serif text-3xl font-bold mb-8">Datenschutzerklärung</h1>

                <div className="space-y-8 text-neutral-700 leading-relaxed">
                    <section>
                        <h2 className="font-bold text-xl mb-3">1. Datenschutz auf einen Blick</h2>
                        <h3 className="font-bold text-lg mb-2">Allgemeine Hinweise</h3>
                        <p className="mb-4">
                            Die folgenden Hinweise geben einen einfachen Überblick darüber, was mit Ihren personenbezogenen Daten passiert, wenn Sie diese Website besuchen. Personenbezogene Daten sind alle Daten, mit denen Sie persönlich identifiziert werden können. Ausführliche Informationen zum Thema Datenschutz entnehmen Sie unserer unter diesem Text aufgeführten Datenschutzerklärung.
                        </p>
                        <h3 className="font-bold text-lg mb-2">Datenerfassung auf dieser Website</h3>
                        <h4 className="font-semibold mb-1">Wer ist verantwortlich für die Datenerfassung auf dieser Website?</h4>
                        <p className="mb-4">
                            Die Datenverarbeitung auf dieser Website erfolgt durch den Websitebetreiber. Dessen Kontaktdaten können Sie dem Abschnitt „Hinweis zur Verantwortlichen Stelle“ in dieser Datenschutzerklärung entnehmen.
                        </p>
                        <h4 className="font-semibold mb-1">Wie erfassen wir Ihre Daten?</h4>
                        <p className="mb-4">
                            Ihre Daten werden zum einen dadurch erhoben, dass Sie uns diese mitteilen. Hierbei kann es sich z. B. um Daten handeln, die Sie im Rahmen des Bestellvorgangs eingeben.
                            Andere Daten werden automatisch oder nach Ihrer Einwilligung beim Besuch der Website durch unsere IT-Systeme erfasst. Das sind vor allem technische Daten (z. B. Internetbrowser, Betriebssystem oder Uhrzeit des Seitenaufrufs).
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">2. Hosting und Content Delivery Networks (CDN)</h2>
                        <h3 className="font-bold text-lg mb-2">Netlify</h3>
                        <p>
                            Wir hosten die Inhalte unserer Website bei Netlify. Anbieter ist die Netlify, Inc., 512 2nd Street, Suite 200, San Francisco, CA 94107, USA (nachfolgend Netlify). Wenn Sie unsere Website besuchen, erfasst Netlify verschiedene Logfiles inklusive Ihrer IP-Adressen. Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO – wir haben ein berechtigtes Interesse an einer möglichst zuverlässigen Darstellung unserer Website. Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission gestützt. Details entnehmen Sie der Datenschutzerklärung von Netlify: <a href="https://www.netlify.com/privacy/" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-primary)] hover:underline">https://www.netlify.com/privacy/</a>.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">3. Allgemeine Hinweise und Pflichtinformationen</h2>
                        <h3 className="font-bold text-lg mb-2">Datenschutz</h3>
                        <p className="mb-4">
                            Die Betreiber dieser Seiten nehmen den Schutz Ihrer persönlichen Daten sehr ernst. Wir behandeln Ihre personenbezogenen Daten vertraulich und entsprechend den gesetzlichen Datenschutzvorschriften sowie dieser Datenschutzerklärung.
                        </p>
                        <h3 className="font-bold text-lg mb-2">Hinweis zur verantwortlichen Stelle</h3>
                        <p className="mb-2">Die verantwortliche Stelle für die Datenverarbeitung auf dieser Website ist:</p>
                        <p className="bg-neutral-50 p-4 rounded-lg border border-neutral-100">
                            Tanja Lux - The Cookie Lady<br />
                            Kissinger Straße 17<br />
                            86415 Mering<br /><br />
                            Telefon: +49 151 29786411<br />
                            E-Mail: kontakt@thecookielady.de
                        </p>
                        <p className="mt-4 mb-4">
                            Verantwortliche Stelle ist die natürliche oder juristische Person, die allein oder gemeinsam mit anderen über die Zwecke und Mittel der Verarbeitung von personenbezogenen Daten (z. B. Namen, E-Mail-Adressen o. Ä.) entscheidet.
                        </p>
                        <h3 className="font-bold text-lg mb-2">Speicherdauer</h3>
                        <p>
                            Soweit innerhalb dieser Datenschutzerklärung keine speziellere Speicherdauer genannt wurde, verbleiben Ihre personenbezogenen Daten bei uns, bis der Zweck für die Datenverarbeitung entfällt. Wenn Sie ein berechtigtes Löschersuchen geltend machen oder eine Einwilligung zur Datenverarbeitung widerrufen, werden Ihre Daten gelöscht, sofern wir keine anderen rechtlich zulässigen Gründe für die Speicherung Ihrer personenbezogenen Daten haben (z. B. steuer- oder handelsrechtliche Aufbewahrungsfristen); im letztgenannten Fall erfolgt die Löschung nach Fortfall dieser Gründe.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">4. Datenerfassung auf dieser Website</h2>
                        <h3 className="font-bold text-lg mb-2">Cookies und lokaler Speicher (Local Storage)</h3>
                        <p className="mb-4">
                            Unsere Internetseiten verwenden so genannte „Cookies“ und ähnliche Technologien (z.B. Local Storage). Diese Technologien richten auf Ihrem Rechner keinen Schaden an und enthalten keine Viren. Sie dienen dazu, unser Angebot nutzerfreundlicher, effektiver und sicherer zu machen.
                        </p>
                        <p className="mb-4">
                            Zum Speichern Ihres aktuellen Warenkorbs nutzen wir den sogenannten &bdquo;Local Storage&ldquo; Ihres Browsers. Diese Daten verbleiben lokal auf Ihrem Endgerät und werden erst an unsere Server übertragen, wenn Sie aktiv eine Bestellung aufgeben.
                        </p>
                        <p className="mb-4">
                            Wir setzen ausschließlich technisch notwendige Cookies und Speichertechniken ein. Analyse-, Tracking- oder Marketing-Werkzeuge verwenden wir nicht, weshalb auch keine Einwilligung eingeholt werden muss. Grundlage für die Speicherung technisch notwendiger Daten ist Art. 6 Abs. 1 lit. f DSGVO, da wir ein berechtigtes Interesse an der fehlerfreien und sicheren Bereitstellung unseres Online-Shops haben.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">5. Datenbank und Kundenverwaltung</h2>
                        <h3 className="font-bold text-lg mb-2">Supabase</h3>
                        <p className="mb-4">
                            Zur Verwaltung unserer Produktdaten und zur Speicherung von Bestellungen nutzen wir den Cloud-Datenbank-Dienst Supabase. Anbieter ist Supabase, Inc., 970 N FWY, Houston, TX 77002, USA.
                        </p>
                        <p>
                            Wenn Sie eine Bestellung aufgeben, werden Ihre Bestelldaten (z.B. Name, Adresse, gekaufte Artikel) in der Supabase-Datenbank sicher und verschlüsselt gespeichert, um den Vertrag mit Ihnen zu erfüllen (Art. 6 Abs. 1 lit. b DSGVO). Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission gestützt.
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-3">6. eCommerce und Zahlungsanbieter</h2>
                        <h3 className="font-bold text-lg mb-2">Verarbeiten von Kunden- und Vertragsdaten</h3>
                        <p className="mb-4">
                            Wir erheben, verarbeiten und nutzen personenbezogene Daten nur, soweit sie für die Begründung, inhaltliche Ausgestaltung oder Änderung des Rechtsverhältnisses erforderlich sind (Bestandsdaten). Dies erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO, der die Verarbeitung von Daten zur Erfüllung eines Vertrags oder vorvertraglicher Maßnahmen gestattet.
                        </p>
                        <h3 className="font-bold text-lg mb-2">Resend (E-Mail-Versand)</h3>
                        <p className="mb-4">
                            Für den Versand von Bestell- und Versandbestätigungen nutzen wir den E-Mail-Versanddienst Resend. Anbieter ist die Resend, Inc., USA.
                        </p>
                        <p className="mb-4">
                            Wenn Sie eine Bestellung aufgeben, werden Ihr Name, Ihre E-Mail-Adresse und die Angaben zu Ihrer Bestellung an Resend übermittelt, damit Ihnen die Bestätigungen zugestellt werden können. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO (Erfüllung des Vertrags). Die Datenübertragung in die USA wird auf die Standardvertragsklauseln der EU-Kommission gestützt. Mit Resend besteht ein Vertrag zur Auftragsverarbeitung.
                        </p>
                        <p className="mb-4">
                            Weitere Informationen entnehmen Sie der Datenschutzerklärung von Resend unter: <a href="https://resend.com/legal/privacy-policy" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-primary)] hover:underline">https://resend.com/legal/privacy-policy</a>.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg mb-2">Stripe</h3>
                        <p className="mb-4">
                            Wir bieten die Möglichkeit an, den Zahlungsvorgang über den Zahlungsdienstleister Stripe abzuwickeln. Anbieter für Kunden innerhalb der EU ist die Stripe Payments Europe, Ltd., 1 Grand Canal Street Lower, Grand Canal Dock, Dublin, Irland (nachfolgend „Stripe“).
                        </p>
                        <p className="mb-4">
                            Wenn Sie sich für eine Zahlungsart von Stripe entscheiden, werden die von Ihnen eingegebenen Zahlungsdaten an Stripe übermittelt. Die Übermittlung Ihrer Daten an Stripe erfolgt auf Grundlage von Art. 6 Abs. 1 lit. b DSGVO (Vertragsabwicklung) sowie auf Grundlage unseres berechtigten Interesses an einer reibungslosen, bequemen und sicheren Zahlungsabwicklung gemäß Art. 6 Abs. 1 lit. f DSGVO.
                        </p>
                        <p>
                            Weitere Informationen entnehmen Sie der Datenschutzerklärung von Stripe unter: <a href="https://stripe.com/de/privacy" target="_blank" rel="noopener noreferrer" className="text-[var(--color-brand-primary)] hover:underline">https://stripe.com/de/privacy</a>.
                        </p>
                    </section>
                </div>
            </div>
        </div>
    );
}
