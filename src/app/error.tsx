'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { RotateCcw, ArrowRight } from 'lucide-react';

/**
 * Auffangnetz für Serverfehler (z.B. wenn Supabase kurz nicht erreichbar ist).
 * Ohne diese Datei sähe der Kunde die nackte Next.js-Fehlerseite.
 */
export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12 flex items-center justify-center">
            <div className="bg-white p-8 lg:p-16 rounded-3xl shadow-xl max-w-2xl text-center border border-neutral-100">
                <div className="flex justify-center mb-6 text-8xl" aria-hidden="true">
                    🍪
                </div>

                <p className="text-sm font-bold tracking-widest text-[var(--color-brand-accent)] uppercase mb-3">
                    Da ist etwas angebrannt
                </p>

                <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 text-[var(--color-brand-text)] font-serif">
                    Ups, das hat nicht geklappt
                </h1>

                <p className="text-[var(--color-brand-dark)] mb-10">
                    Leider ist gerade ein technisches Problem aufgetreten. Versuch es bitte noch einmal –
                    meistens hilft das schon. Bleibt es dabei, schreib mir gerne an{' '}
                    <a
                        href="mailto:kontakt@thecookielady.de"
                        className="text-[var(--color-brand-primary)] underline"
                    >
                        kontakt@thecookielady.de
                    </a>
                    .
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={reset}
                        className="inline-flex items-center justify-center gap-2 bg-[var(--color-brand-primary)] text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-opacity"
                    >
                        <RotateCcw className="w-5 h-5" /> Nochmal versuchen
                    </button>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] px-8 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-brand-primary)]/10 transition-all"
                    >
                        Zur Startseite <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
