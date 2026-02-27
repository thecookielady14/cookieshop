export default function Impressum() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-3xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold mb-8">Impressum</h1>

                <div className="space-y-6 text-neutral-700">
                    <section>
                        <h2 className="font-bold text-xl mb-2">Angaben gemäß § 5 TMG</h2>
                        <p>
                            Max Mustermann<br />
                            The Cookie Lady<br />
                            Musterstraße 1<br />
                            12345 Musterstadt
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">Kontakt</h2>
                        <p>
                            Telefon: +49 (0) 123 44 55 66<br />
                            E-Mail: hello@thecookielady.de
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">Umsatzsteuer-ID</h2>
                        <p>
                            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                            DE999999999
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
                        <p>
                            Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.
                        </p>
                    </section>

                    <p className="text-sm opacity-60 italic mt-8">
                        Hinweis: Dies ist ein Platzhalter-Impressum. Bitte ersetze diese Daten vor Live-Schaltung mit deinen echten, rechtsgültigen Angaben.
                    </p>
                </div>
            </div>
        </div>
    );
}
