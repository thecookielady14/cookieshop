export default function Widerruf() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-4xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold mb-8">Widerrufsrecht & Ausschluss</h1>

                <div className="space-y-8 text-neutral-700 leading-relaxed">
                    <section>
                        <p className="text-lg mb-6">
                            Als Verbraucher haben Sie bei Fernabsatzverträgen grundsätzlich ein gesetzliches Widerrufsrecht.
                            <strong>Für unsere frisch gebackenen Cookies greift jedoch eine wichtige gesetzliche Ausnahme.</strong>
                        </p>
                    </section>

                    <section className="bg-red-50 border-l-4 border-red-500 p-6 rounded-r-xl my-8">
                        <h2 className="font-bold text-xl mb-3 text-red-700">Ausschluss des Widerrufsrechts</h2>
                        <p className="mb-4 font-medium text-red-900">
                            Das Widerrufsrecht besteht nicht bei Verträgen zur Lieferung von Waren, die schnell verderben können oder deren Verfallsdatum schnell überschritten würde (§ 312g Abs. 2 Nr. 2 BGB).
                        </p>
                        <p className="text-red-800">
                            <strong>Was bedeutet das für Sie?</strong><br />
                            Da es sich bei unseren Cookies um frische, individuell für Ihre Bestellung gebackene Lebensmittel ohne lange Haltbarkeitsdauer handelt, sind diese von Rückgabe und Umtausch komplett ausgeschlossen. Lebensmittel, die unser Haus verlassen haben, können wir aus hygienischen und lebensmittelrechtlichen Gründen nicht mehr zurücknehmen oder weiterverkaufen.
                        </p>
                    </section>

                    <hr className="border-neutral-200" />

                    <section>
                        <h2 className="font-bold text-xl mb-3">Widerrufsbelehrung (für Nicht-Lebensmittel, z.B. Gutscheine oder Gutscheinkarten)</h2>
                        <h3 className="font-bold text-lg mb-2">Widerrufsrecht</h3>
                        <p className="mb-4">
                            Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen. Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat.
                        </p>
                        <p className="mb-4">
                            Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (Tanja Lux - The Cookie Lady, Kissinger Straße 17, 86415 Mering, E-Mail: kontakt@thecookielady.de) mittels einer eindeutigen Erklärung (z. B. ein mit der Post versandter Brief oder eine E-Mail) über Ihren Entschluss, diesen Vertrag zu widerrufen, informieren.
                        </p>
                        <p>
                            Zur Wahrung der Widerrufsfrist reicht es aus, dass Sie die Mitteilung über die Ausübung des Widerrufsrechts vor Ablauf der Widerrufsfrist absenden.
                        </p>
                    </section>

                    <section>
                        <h3 className="font-bold text-lg mb-2">Folgen des Widerrufs</h3>
                        <p className="mb-4">
                            Wenn Sie diesen Vertrag widerrufen, haben wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme der zusätzlichen Kosten, die sich daraus ergeben, dass Sie eine andere Art der Lieferung als die von uns angebotene, günstigste Standardlieferung gewählt haben), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurückzuzahlen, an dem die Mitteilung über Ihren Widerruf dieses Vertrags bei uns eingegangen ist.
                            Für diese Rückzahlung verwenden wir dasselbe Zahlungsmittel, das Sie bei der ursprünglichen Transaktion eingesetzt haben, es sei denn, mit Ihnen wurde ausdrücklich etwas anderes vereinbart.
                        </p>
                        <p>
                            Wir können die Rückzahlung verweigern, bis wir die Waren wieder zurückerhalten haben oder bis Sie den Nachweis erbracht haben, dass Sie die Waren zurückgesandt haben, je nachdem, welches der frühere Zeitpunkt ist.
                            Sie haben die Waren unverzüglich und in jedem Fall spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf dieses Vertrags unterrichten, an uns zurückzusenden oder zu übergeben. Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.
                        </p>
                    </section>

                    <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl mt-8">
                        <p className="text-sm text-amber-800 font-medium italic">
                            Hinweis: Diese Belehrung wurde auf Basis des BGB formuliert. Bitte prüfen Sie diese als Gewerbetreibende dennoch sorgfältig auf Fehler.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
