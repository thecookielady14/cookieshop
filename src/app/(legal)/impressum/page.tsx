export default function Impressum() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-3xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <h1 className="text-3xl font-bold mb-8">Impressum</h1>

                <div className="space-y-6 text-neutral-700">
                    <section>
                        <h2 className="font-bold text-xl mb-2">Angaben gemäß § 5 TMG</h2>
                        <p>
                            Tanja Lux - The Cookie Lady<br />
                            Kissinger Straße 17<br />
                            86415 Mering
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">Kontakt</h2>
                        <p>
                            Telefon: +49 159 02193895<br />
                            E-Mail: kontakt@thecookielady.de
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">Umsatzsteuer-ID</h2>
                        <p>
                            Umsatzsteuer-Identifikationsnummer gemäß § 27 a Umsatzsteuergesetz:<br />
                            DE460296346
                        </p>
                    </section>

                    <section>
                        <h2 className="font-bold text-xl mb-2">Verbraucherstreitbeilegung/Universalschlichtungsstelle</h2>
                        <p>
                            Wir sind stets bemüht, eventuelle Meinungsverschiedenheiten einvernehmlich beizulegen. Zur Teilnahme an einem Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle sind wir jedoch nicht verpflichtet und nehmen daran auch nicht teil.
                        </p>
                    </section>


                </div>
            </div>
        </div>
    );
}
