import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export const metadata = {
    title: 'Seite nicht gefunden',
};

export default function NotFound() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12 flex items-center justify-center">
            <div className="bg-white p-8 lg:p-16 rounded-3xl shadow-xl max-w-2xl text-center border border-neutral-100">
                <div className="flex justify-center mb-6 text-8xl" aria-hidden="true">
                    🍪
                </div>

                <p className="text-sm font-bold tracking-widest text-[var(--color-brand-accent)] uppercase mb-3">
                    Fehler 404
                </p>

                <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 text-[var(--color-brand-text)] font-serif">
                    Ups – dieser Keks wurde schon aufgegessen!
                </h1>

                <div className="bg-[var(--color-brand-bg)] p-6 rounded-2xl mb-10 inline-block w-full max-w-sm">
                    <p className="text-sm text-[var(--color-brand-dark)] text-center">
                        Die Seite, die du suchst, gibt es nicht (mehr). Aber keine Sorge – im Shop warten genug frische Kekse auf dich.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] px-8 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-brand-primary)]/10 transition-all"
                    >
                        Zur Startseite
                    </Link>
                    <Link
                        href="/shop"
                        className="inline-flex items-center justify-center gap-2 bg-[var(--color-brand-primary)] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#c29160] transition-transform hover:-translate-y-1 shadow-md"
                    >
                        Zum Shop <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
