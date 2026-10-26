import { escapeHtml } from '@/lib/html';
import { siteUrl } from '@/lib/site';

/**
 * AGB und Widerrufsbelehrung als Daten statt als JSX.
 *
 * Beide Texte erscheinen an zwei Stellen: auf ihren Seiten und in der
 * Bestellbestätigung. Die Mail ist nicht Kür – § 312f Abs. 2 BGB verlangt, dass
 * die Kundschaft den Vertragsinhalt samt AGB und Widerrufsbelehrung auf einem
 * dauerhaften Datenträger erhält, ein Link genügt dafür nicht. Stünde der Text
 * zweimal im Code, wiche die Mail irgendwann von der Seite ab, und die
 * Kundschaft bekäme Bedingungen, die so nirgends veröffentlicht sind.
 *
 * Deshalb: Text nur hier ändern. Die Seiten rendern ihn über
 * `LegalSections`, die Mail über `legalTextsEmailHtml()`.
 */

/** Ein Stück Fließtext: schlicht, fett oder als Link. */
export type Inline = string | { strong: string } | { text: string; href: string };

export type LegalBlock =
    | { p: Inline[] }
    | { list: Inline[][] };

export interface LegalSection {
    heading: string;
    /** Unterüberschrift (h3) statt Abschnittsüberschrift (h2). */
    sub?: boolean;
    /** Hervorgehobener Kasten – nur für den Ausschluss des Widerrufsrechts. */
    warning?: boolean;
    blocks: LegalBlock[];
}

export interface LegalText {
    title: string;
    /** Steht vor dem ersten Abschnitt, ohne eigene Überschrift. */
    intro?: Inline[];
    sections: LegalSection[];
}

const seller = 'Tanja Lux – The Cookie Lady';
const sellerAddress = 'Kissinger Straße 17, 86415 Mering';

export const agb: LegalText = {
    title: 'Allgemeine Geschäftsbedingungen (AGB)',
    sections: [
        {
            heading: '1. Geltungsbereich',
            blocks: [{
                p: ['Für alle Bestellungen über unseren Online-Shop durch Verbraucher und Unternehmer gelten die nachfolgenden AGB. Verbraucher ist jede natürliche Person, die ein Rechtsgeschäft zu Zwecken abschließt, die überwiegend weder ihrer gewerblichen noch ihrer selbständigen beruflichen Tätigkeit zugerechnet werden können.'],
            }],
        },
        {
            heading: '2. Vertragspartner, Vertragsschluss',
            blocks: [
                { p: [`Der Kaufvertrag kommt zustande mit ${seller}.`] },
                { p: ['Die Darstellung der Produkte im Online-Shop stellt kein rechtlich bindendes Angebot, sondern einen unverbindlichen Online-Katalog dar. Sie können unsere Produkte zunächst unverbindlich in den Warenkorb legen und Ihre Eingaben vor Absenden Ihrer verbindlichen Bestellung jederzeit korrigieren. Durch Anklicken des Bestellbuttons geben Sie eine verbindliche Bestellung der im Warenkorb enthaltenen Waren ab. Die Bestätigung des Zugangs Ihrer Bestellung erfolgt per E-Mail unmittelbar nach dem Absenden der Bestellung.'] },
            ],
        },
        {
            heading: '3. Vertragssprache, Vertragstextspeicherung',
            blocks: [{
                p: ['Die für den Vertragsschluss zur Verfügung stehende Sprache ist Deutsch. Wir speichern den Vertragstext. Mit der Bestellbestätigung erhalten Sie per E-Mail Ihre Bestelldaten, diese AGB und die Widerrufsbelehrung. Die AGB können Sie außerdem jederzeit auf dieser Seite einsehen.'],
            }],
        },
        {
            heading: '4. Lieferbedingungen',
            blocks: [{
                p: [
                    'Zuzüglich zu den angegebenen Produktpreisen kommen noch Versandkosten hinzu. Die genaue Höhe der Versandkosten sowie die Lieferzeiten entnehmen Sie unserer Seite ',
                    { text: 'Versand & Lieferung', href: '/versand' },
                    '. Wir liefern nur im Versandweg und nur innerhalb Deutschlands. Eine Selbstabholung der Ware ist leider nicht möglich.',
                ],
            }],
        },
        {
            heading: '5. Bezahlung',
            blocks: [
                { p: ['Die Zahlung wird über unseren Zahlungsdienstleister Stripe abgewickelt. Welche Zahlungsarten Ihnen zur Verfügung stehen, sehen Sie im Bestellprozess. Dazu gehören:'] },
                {
                    list: [
                        [{ strong: 'Kredit- oder Debitkarte:' }, ' Mit Abgabe der Bestellung übermitteln Sie Ihre Kartendaten. Nach Ihrer Legitimation als rechtmäßiger Karteninhaber fordert Stripe unmittelbar nach der Bestellung Ihr Kartenunternehmen zur Einleitung der Zahlungstransaktion auf.'],
                        [{ strong: 'Apple Pay / Google Pay:' }, ' Um den Rechnungsbetrag über Apple Pay oder Google Pay bezahlen zu können, müssen Sie bei dem jeweiligen Dienstanbieter registriert sein und die Zahlungsanweisung bestätigen.'],
                        [{ strong: 'Amazon Pay:' }, ' Im Bestellprozess melden Sie sich mit Ihrem Amazon-Konto an und bestätigen die Zahlung mit einer dort hinterlegten Zahlungsart.'],
                        [{ strong: 'PayPal:' }, ' Im Bestellprozess werden Sie auf die Webseite des Online-Anbieters PayPal weitergeleitet. Dort können Sie Ihre Zahlungsdaten angeben und die Zahlungsanweisung an PayPal bestätigen.'],
                        [{ strong: 'Banküberweisung:' }, ' Nach Abschluss der Bestellung erhalten Sie eine Bankverbindung (IBAN) und einen Verwendungszweck. Bitte überweisen Sie den Rechnungsbetrag innerhalb von 7 Tagen. Wir backen Ihre Bestellung, sobald die Zahlung bei uns eingegangen ist.'],
                    ],
                },
            ],
        },
        {
            heading: '6. Eigentumsvorbehalt',
            blocks: [{ p: ['Die Ware bleibt bis zur vollständigen Bezahlung unser Eigentum.'] }],
        },
        {
            heading: '7. Transportschäden',
            blocks: [{
                p: ['Werden Waren mit offensichtlichen Transportschäden angeliefert, so reklamieren Sie solche Fehler bitte möglichst sofort beim Zusteller und nehmen Sie bitte unverzüglich Kontakt zu uns auf. Ihre gesetzlichen Gewährleistungsrechte bleiben davon unberührt.'],
            }],
        },
        {
            heading: '8. Gewährleistung und Garantien',
            blocks: [{
                p: ['Soweit nicht nachstehend ausdrücklich anders vereinbart, gilt das gesetzliche Mängelhaftungsrecht. Bei unseren Cookies handelt es sich um frische Lebensmittel. Bitte teilen Sie uns etwaige Mängel möglichst bald nach Erhalt mit, gern mit Fotos – so können wir am schnellsten helfen.'],
            }],
        },
        {
            heading: '9. Streitbeilegung',
            blocks: [{
                p: ['Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.'],
            }],
        },
    ],
};

export const widerruf: LegalText = {
    title: 'Widerrufsrecht & Ausschluss',
    intro: [
        'Als Verbraucher haben Sie bei Fernabsatzverträgen grundsätzlich ein gesetzliches Widerrufsrecht. ',
        { strong: 'Für unsere frisch gebackenen Cookies greift jedoch eine wichtige gesetzliche Ausnahme.' },
    ],
    sections: [
        {
            heading: 'Ausschluss des Widerrufsrechts',
            warning: true,
            blocks: [
                { p: [{ strong: 'Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, die schnell verderben können oder deren Verfallsdatum schnell überschritten würde (§ 312g Abs. 2 Nr. 2 BGB).' }] },
                { p: [{ strong: 'Was bedeutet das für Sie?' }, ' Da es sich bei unseren Cookies um frische, individuell für Ihre Bestellung gebackene Lebensmittel ohne lange Haltbarkeitsdauer handelt, sind diese von Rückgabe und Umtausch komplett ausgeschlossen. Lebensmittel, die unser Haus verlassen haben, können wir aus hygienischen und lebensmittelrechtlichen Gründen nicht mehr zurücknehmen oder weiterverkaufen.'] },
            ],
        },
        {
            heading: 'Widerrufsbelehrung (für Nicht-Lebensmittel, z. B. Gutscheine oder Gutscheinkarten)',
            blocks: [],
        },
        {
            heading: 'Widerrufsrecht',
            sub: true,
            blocks: [
                { p: ['Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.'] },
                { p: [`Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (${seller}, ${sellerAddress}, Telefon: +49 151 29786411, E-Mail: kontakt@thecookielady.de) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren. Sie können dafür das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.`] },
                { p: ['Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.'] },
            ],
        },
        {
            heading: 'Folgen des Widerrufs',
            sub: true,
            blocks: [
                { p: ['Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist. Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart; in keinem Fall werden Ihnen wegen dieser Rückzahlung Entgelte berechnet.'] },
                { p: ['Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist. Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der Frist von vierzehn Tagen absenden. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren. Sie müssen für einen etwaigen Wertverlust der Waren nur aufkommen, wenn dieser Wertverlust auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise der Waren nicht notwendigen Umgang mit ihnen zurückzuführen ist.'] },
            ],
        },
        {
            heading: 'Muster-Widerrufsformular',
            sub: true,
            blocks: [
                { p: ['(Wenn Sie den Vertrag widerrufen wollen, dann füllen Sie bitte dieses Formular aus und senden Sie es zurück.)'] },
                {
                    list: [
                        [`An ${seller}, ${sellerAddress}, E-Mail: kontakt@thecookielady.de`],
                        ['Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren (*) / die Erbringung der folgenden Dienstleistung (*)'],
                        ['Bestellt am (*) / erhalten am (*)'],
                        ['Name des/der Verbraucher(s)'],
                        ['Anschrift des/der Verbraucher(s)'],
                        ['Unterschrift des/der Verbraucher(s) (nur bei Mitteilung auf Papier)'],
                        ['Datum'],
                    ],
                },
                { p: ['(*) Unzutreffendes streichen.'] },
            ],
        },
    ],
};

/* ------------------------------------------------------------------ */
/* Ausgabe für E-Mails                                                  */
/* ------------------------------------------------------------------ */

const linkStyle = 'color:#b0813b;';

function inlineHtml(parts: Inline[]): string {
    return parts.map((part) => {
        if (typeof part === 'string') return escapeHtml(part);
        if ('strong' in part) return `<strong>${escapeHtml(part.strong)}</strong>`;
        // Relative Links funktionieren in einer Mail nicht.
        const href = part.href.startsWith('/') ? `${siteUrl}${part.href}` : part.href;
        return `<a href="${escapeHtml(href)}" style="${linkStyle}">${escapeHtml(part.text)}</a>`;
    }).join('');
}

function legalTextHtml(text: LegalText): string {
    const p = 'margin:0 0 10px;';
    const body = text.sections.map((section) => {
        const heading = section.sub
            ? `<h4 style="font-size:13px;margin:14px 0 6px;color:#331f16;">${escapeHtml(section.heading)}</h4>`
            : `<h3 style="font-size:14px;margin:18px 0 6px;color:#331f16;">${escapeHtml(section.heading)}</h3>`;
        const blocks = section.blocks.map((block) =>
            'p' in block
                ? `<p style="${p}">${inlineHtml(block.p)}</p>`
                : `<ul style="margin:0 0 10px;padding-left:18px;">${block.list.map((item) => `<li style="margin-bottom:4px;">${inlineHtml(item)}</li>`).join('')}</ul>`
        ).join('');
        return heading + blocks;
    }).join('');

    return `<h2 style="font-size:16px;margin:24px 0 8px;color:#331f16;">${escapeHtml(text.title)}</h2>`
        + (text.intro ? `<p style="${p}">${inlineHtml(text.intro)}</p>` : '')
        + body;
}

/**
 * AGB und Widerrufsbelehrung als HTML-Block für die Bestellbestätigung.
 * Kleingedruckt, aber vollständig – siehe Kommentar oben.
 */
export function legalTextsEmailHtml(): string {
    return `<div style="border-top:1px solid #f0e8d8;margin-top:32px;padding-top:8px;font-size:12px;line-height:1.55;color:#7a6a5a;">
<p style="margin:16px 0 0;">Für deine Bestellung gelten die folgenden Bedingungen. Bitte bewahre diese E-Mail auf.</p>
${legalTextHtml(agb)}
${legalTextHtml(widerruf)}
</div>`;
}
