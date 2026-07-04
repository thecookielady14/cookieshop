'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';
import { useMounted } from '@/lib/useMounted';

export default function CookieBanner() {
    const mounted = useMounted();
    const [dismissed, setDismissed] = useState(false);

    const handleAccept = () => {
        localStorage.setItem('cookie_consent', 'accepted');
        setDismissed(true);
        // In a real scenario, you'd initialize Google Analytics / Pixel here
    };

    const handleDecline = () => {
        localStorage.setItem('cookie_consent', 'declined');
        setDismissed(true);
    };

    // Only render client-side and while no consent decision is stored
    if (!mounted || dismissed || localStorage.getItem('cookie_consent')) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-[100] p-4 lg:p-6 pointer-events-none">
            <div className="bg-white rounded-3xl shadow-2xl border border-neutral-200 p-6 lg:p-8 max-w-4xl mx-auto flex flex-col md:flex-row gap-6 items-center pointer-events-auto relative overflow-hidden">

                {/* Subtle background decoration */}
                <div className="absolute -top-12 -right-12 w-32 h-32 bg-[var(--color-brand-bg)] rounded-full opacity-50 blur-2xl"></div>

                <div className="flex-shrink-0 bg-[var(--color-brand-bg)] p-4 rounded-full border border-neutral-100">
                    <Cookie className="w-8 h-8 text-[var(--color-brand-primary)]" />
                </div>

                <div className="flex-1 text-center md:text-left z-10">
                    <h3 className="text-xl font-bold text-[var(--color-brand-text)] mb-2 font-serif">
                        Ja, wir nutzen wirklich Cookies 🍪
                    </h3>
                    <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">
                        Wir verwenden technisch notwendige Cookies, damit du einkaufen kannst (z.B. für unseren Warenkorb).
                        Zusätzlich würden wir gerne analysieren, wie viele Leute unseren Shop besuchen, um ihn noch besser zu machen.
                        Weitere Details findest du in unserer <Link href="/datenschutz" className="underline font-bold hover:text-[var(--color-brand-primary)]">Datenschutzerklärung</Link>.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto z-10">
                    <button
                        onClick={handleDecline}
                        className="px-6 py-3 rounded-xl font-bold border-2 border-neutral-200 text-[var(--color-brand-dark)] hover:bg-neutral-50 transition-colors whitespace-nowrap"
                    >
                        Nur notwendige
                    </button>
                    <button
                        onClick={handleAccept}
                        className="px-6 py-3 rounded-xl font-bold bg-[var(--color-brand-primary)] text-white hover:bg-[#4a3018] shadow-md transition-all hover:-translate-y-0.5 whitespace-nowrap"
                    >
                        Alle akzeptieren
                    </button>
                </div>

            </div>
        </div>
    );
}
