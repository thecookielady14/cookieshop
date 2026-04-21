import Image from "next/image";
import { Gem, PackageCheck, HeartHandshake } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Über mich – The Cookie Lady | Die Geschichte hinter den Cookies",
    description: "Lern The Cookie Lady kennen! Ich backe mit Leidenschaft handgemachte Cookies aus echten Zutaten – ohne Kompromisse, dafür mit ganz viel Liebe.",
};

export default function About() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-4xl mx-auto">
                <h1 className="text-4xl lg:text-5xl font-extrabold mb-12 text-center text-[var(--color-brand-text)]">
                    Meine Geschichte
                </h1>

                <div className="flex flex-col md:flex-row gap-12 items-center">
                    <div className="w-full md:w-1/2 relative">
                        {/* Decorative background blob */}
                        <div className="absolute top-[-10%] left-[-10%] w-[120%] h-[120%] bg-[var(--color-brand-secondary)] rounded-full blur-3xl opacity-60 -z-10"></div>

                        <Image
                            src="/logo.jpeg"
                            alt="The Cookie Lady"
                            width={500}
                            height={500}
                            className="w-full aspect-square object-cover"
                        />
                    </div>

                    <div className="w-full md:w-1/2 flex flex-col justify-center space-y-6 text-lg text-[var(--color-brand-text)]">
                        <h2 className="text-3xl font-bold text-[var(--color-brand-primary)]">
                            Hallo, ich bin Tanja, auch bekannt als The Cookie Lady!
                        </h2>
                        <p>
                            Schon als Kind stand ich am liebsten in der Küche und habe die Teigschüssel ausgekratzt.
                            Die Leidenschaft fürs Backen hat mich seitdem nie losgelassen.
                        </p>
                        <p>
                            Nach unzähligen Experimenten, verbrannten Blechen und hunderten von probierten Rezepten
                            habe ich endlich die perfekten Cookies kreiert: Außen leicht knusprig, innen unverschämt
                            weich und "chewy" – genau so, wie ein echter amerikanischer Cookie sein muss.
                        </p>
                        <p>
                            Ich verwende für meine Kekse nur die besten, natürlichen Zutaten: Echte Butter,
                            hochwertige belgische Schokolade und feine Bourbon-Vanille. Keine künstlichen
                            Zusatzstoffe, einfach nur purer Genuss.
                        </p>
                        <p className="font-medium text-xl italic mt-4 text-[var(--color-brand-dark)]">
                            "Jeder Keks, der meine Küche verlässt, ist ein kleines Kunstwerk und wird mit
                            ganz viel Liebe von Hand geformt."
                        </p>
                    </div>
                </div>

                {/* Quality Banner */}
                <div className="mt-24 bg-[var(--color-brand-primary)] rounded-3xl p-8 lg:p-12 shadow-sm">
                    <h3 className="text-2xl font-bold mb-10 text-center text-white">Mein Qualitätsversprechen</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--color-brand-accent)]/20 flex items-center justify-center mb-4">
                                <Gem className="w-8 h-8 text-[var(--color-brand-accent)]" />
                            </div>
                            <h4 className="font-bold mb-2 text-white">Beste Zutaten</h4>
                            <p className="text-sm text-white/70">Nur echte Butter und hochwertige Schokolade.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--color-brand-accent)]/20 flex items-center justify-center mb-4">
                                <HeartHandshake className="w-8 h-8 text-[var(--color-brand-accent)]" />
                            </div>
                            <h4 className="font-bold mb-2 text-white">100% Handgemacht</h4>
                            <p className="text-sm text-white/70">Jeder Teigling wird von mir persönlich geformt.</p>
                        </div>
                        <div className="flex flex-col items-center">
                            <div className="w-16 h-16 rounded-full bg-[var(--color-brand-accent)]/20 flex items-center justify-center mb-4">
                                <PackageCheck className="w-8 h-8 text-[var(--color-brand-accent)]" />
                            </div>
                            <h4 className="font-bold mb-2 text-white">Frisch verschickt</h4>
                            <p className="text-sm text-white/70">Heute gebacken, in wenigen Tagen schon bei dir.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
