'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, ArrowRight } from 'lucide-react';
import { useCartStore } from '@/lib/store';

function SuccessContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('session_id');
    const clearCart = useCartStore((state) => state.clearCart);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (sessionId) {
            // Clear the local cart because the order is complete
            clearCart();
        }
    }, [sessionId, clearCart]);

    if (!mounted) return null;

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12 flex items-center justify-center">
            <div className="bg-white p-8 lg:p-16 rounded-3xl shadow-xl max-w-2xl text-center border border-neutral-100">
                <div className="flex justify-center mb-6">
                    <CheckCircle2 className="w-24 h-24 text-[var(--color-brand-primary)]" />
                </div>

                <h1 className="text-4xl lg:text-5xl font-extrabold mb-6 text-[var(--color-brand-text)] font-serif">
                    Vielen Dank für deine Bestellung!
                </h1>

                <div className="bg-[var(--color-brand-bg)] p-6 rounded-2xl mb-10 inline-block w-full max-w-sm">
                    <p className="text-sm text-[var(--color-brand-dark)] text-center">
                        Deine Cookies werden jetzt mit viel Liebe gebacken und frisch für dich verpackt. 🍪
                    </p>
                    <p className="text-xs text-neutral-400 text-center mt-2">
                        Du erhältst in Kürze eine Bestätigungsemail mit deiner Rechnung von Stripe.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Link
                        href="/shop"
                        className="inline-flex items-center justify-center gap-2 border-2 border-[var(--color-brand-primary)] text-[var(--color-brand-primary)] px-8 py-4 rounded-full font-bold text-lg hover:bg-[var(--color-brand-primary)]/10 transition-all"
                    >
                        Weiter shoppen
                    </Link>
                    <Link
                        href="/"
                        className="inline-flex items-center justify-center gap-2 bg-[var(--color-brand-primary)] text-white px-8 py-4 rounded-full font-bold text-lg hover:bg-[#c29160] transition-transform hover:-translate-y-1 shadow-md"
                    >
                        Zur Startseite <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}

export default function SuccessPage() {
    return (
        <Suspense fallback={<div className="min-h-screen pt-32 flex items-center justify-center">Bestellung wird geladen...</div>}>
            <SuccessContent />
        </Suspense>
    );
}
