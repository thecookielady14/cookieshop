'use client';

import { useCartStore } from "@/lib/store";
import { CopyMinus, CopyPlus, Trash2, ArrowRight, ShieldCheck, Loader2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Cart() {
    const { items, removeItem, updateQuantity, getCartTotal, getCartCount } = useCartStore();
    const [mounted, setMounted] = useState(false);
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleCheckout = async () => {
        if (!acceptedTerms) {
            alert("Bitte akzeptiere die AGB und Widerrufsbelehrung.");
            return;
        }

        try {
            setLoading(true);
            const response = await fetch('/api/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ items }),
            });

            const data = await response.json();

            if (data.url) {
                window.location.href = data.url; // Redirect to Stripe Checkout Let's go!
            } else if (data.error) {
                alert(data.error);
                setLoading(false);
            }
        } catch (error) {
            console.error('Checkout error:', error);
            alert("Ein Fehler ist aufgetreten. Bitte versuche es später noch einmal.");
            setLoading(false);
        }
    };

    if (!mounted) return null;

    const total = getCartTotal();
    const count = getCartCount();
    const shipping = total > 30 ? 0 : 4.90;

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-36 pb-20 px-6 lg:px-12">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-extrabold mb-2 text-[var(--color-brand-text)]">Dein Warenkorb</h1>
                <p className="text-[var(--color-brand-dark)] mb-12">
                    {count > 0 ? `Du hast ${count} leckere Kekse im Korb.` : 'Dein Warenkorb ist noch hungrig!'}
                </p>

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-neutral-100">
                        <svg className="w-24 h-24 mx-auto mb-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {/* handle */}
                            <path d="M30 42 Q50 18 70 42" stroke="#8B5E3C" strokeWidth="5" strokeLinecap="round" fill="none"/>
                            {/* basket body */}
                            <path d="M18 48 L25 82 L75 82 L82 48 Z" fill="#C8914A" stroke="#8B5E3C" strokeWidth="2"/>
                            {/* basket weave lines horizontal */}
                            <line x1="19" y1="58" x2="81" y2="58" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
                            <line x1="21" y1="68" x2="79" y2="68" stroke="#8B5E3C" strokeWidth="1.5" opacity="0.5"/>
                            {/* basket weave lines vertical */}
                            <line x1="35" y1="48" x2="30" y2="82" stroke="#8B5E3C" strokeWidth="1.2" opacity="0.4"/>
                            <line x1="50" y1="48" x2="50" y2="82" stroke="#8B5E3C" strokeWidth="1.2" opacity="0.4"/>
                            <line x1="65" y1="48" x2="70" y2="82" stroke="#8B5E3C" strokeWidth="1.2" opacity="0.4"/>
                            {/* basket rim */}
                            <rect x="16" y="44" width="68" height="8" rx="4" fill="#A0682A" stroke="#7A4E20" strokeWidth="1.5"/>
                            {/* cookie left */}
                            <circle cx="36" cy="40" r="10" fill="#E6B840" stroke="#C8914A" strokeWidth="1.5"/>
                            <circle cx="33" cy="38" r="1.5" fill="#8B5E3C"/>
                            <circle cx="38" cy="41" r="1.5" fill="#8B5E3C"/>
                            <circle cx="36" cy="36" r="1.2" fill="#8B5E3C"/>
                            {/* cookie right */}
                            <circle cx="64" cy="40" r="10" fill="#E6B840" stroke="#C8914A" strokeWidth="1.5"/>
                            <circle cx="61" cy="38" r="1.5" fill="#8B5E3C"/>
                            <circle cx="66" cy="41" r="1.5" fill="#8B5E3C"/>
                            <circle cx="64" cy="36" r="1.2" fill="#8B5E3C"/>
                            {/* cookie middle (slightly higher) */}
                            <circle cx="50" cy="35" r="11" fill="#E6B840" stroke="#C8914A" strokeWidth="1.5"/>
                            <circle cx="47" cy="33" r="1.5" fill="#8B5E3C"/>
                            <circle cx="53" cy="36" r="1.5" fill="#8B5E3C"/>
                            <circle cx="50" cy="30" r="1.2" fill="#8B5E3C"/>
                            <circle cx="50" cy="40" r="1.2" fill="#8B5E3C"/>
                        </svg>
                        <p className="text-xl mb-8">Dein Korb ist noch leer – stöber doch mal im Shop!</p>
                        <Link
                            href="/shop"
                            className="inline-flex items-center gap-2 bg-[var(--color-brand-primary)] text-white px-8 py-4 rounded-full font-bold hover:bg-[#c29160] transition-transform hover:-translate-y-1"
                        >
                            Zum Shop <ArrowRight className="w-5 h-5" />
                        </Link>
                    </div>
                ) : (
                    <div className="flex flex-col lg:flex-row gap-12">
                        {/* Cart Items List */}
                        <div className="lg:w-2/3 space-y-6">
                            {items.map((item) => (
                                <div key={item.id} className="bg-white p-6 rounded-3xl shadow-sm border border-neutral-100 flex items-center gap-6">
                                    {/* Product Image */}
                                    <div className="w-24 h-24 bg-[var(--color-brand-secondary)] rounded-2xl flex items-center justify-center text-4xl flex-shrink-0 overflow-hidden relative">
                                        {item.imageUrl ? (
                                            <Image
                                                src={item.imageUrl}
                                                alt={item.name}
                                                fill
                                                className="object-cover"
                                                sizes="96px"
                                            />
                                        ) : (
                                            <span>🍪</span>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold mb-1">{item.name}</h3>
                                        <p className="text-[var(--color-brand-dark)] font-medium mb-4">
                                            {item.price.toFixed(2).replace('.', ',')} € / Stück
                                        </p>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-3 bg-[var(--color-brand-bg)] px-3 py-1 rounded-full border border-neutral-200">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="hover:text-[var(--color-brand-primary)] p-1">
                                                    <CopyMinus className="w-4 h-4" />
                                                </button>
                                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="hover:text-[var(--color-brand-primary)] p-1">
                                                    <CopyPlus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <button onClick={() => removeItem(item.id)} className="text-neutral-400 hover:text-red-500 transition-colors p-2">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-xl font-bold text-right hidden sm:block">
                                        {(item.price * item.quantity).toFixed(2).replace('.', ',')} €
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Checkout Summary Sidebar */}
                        <div className="lg:w-1/3">
                            <div className="bg-white p-8 rounded-3xl shadow-sm border border-neutral-100 sticky top-32">
                                <h2 className="text-2xl font-bold mb-6 border-b pb-4">Zusammenfassung</h2>

                                <div className="space-y-3 mb-6 font-medium text-[var(--color-brand-dark)]">
                                    <div className="flex justify-between">
                                        <span>Zwischensumme:</span>
                                        <span>{total.toFixed(2).replace('.', ',')} €</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Versand:</span>
                                        <span>{shipping === 0 ? 'Kostenlos' : `${shipping.toFixed(2).replace('.', ',')} €`}</span>
                                    </div>
                                    <p className="text-xs text-neutral-400 text-right">
                                        Kostenloser Versand ab 30 €
                                    </p>
                                </div>

                                <div className="flex justify-between text-2xl font-black mb-8 border-t pt-4 text-[var(--color-brand-text)]">
                                    <span>Gesamt:</span>
                                    <span>{(total + shipping).toFixed(2).replace('.', ',')} €</span>
                                </div>

                                <div className="mb-6 space-y-4">
                                    <label className="flex items-start gap-3 text-sm text-[var(--color-brand-dark)] cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={acceptedTerms}
                                            onChange={(e) => setAcceptedTerms(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-neutral-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)] cursor-pointer"
                                        />
                                        <span>
                                            Ich habe die <Link href="/agb" className="underline hover:text-[var(--color-brand-primary)]">AGB</Link> und die <Link href="/widerruf" className="underline hover:text-[var(--color-brand-primary)]">Widerrufsbelehrung</Link> gelesen und stimme zu.
                                        </span>
                                    </label>
                                </div>

                                <button
                                    onClick={handleCheckout}
                                    disabled={loading || !acceptedTerms}
                                    className="w-full flex items-center justify-center gap-2 bg-[var(--color-brand-primary)] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#c29160] transition-transform hover:-translate-y-1 shadow-md mb-4 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Einen Moment...
                                        </>
                                    ) : (
                                        <>
                                            Zur Kasse <ArrowRight className="w-5 h-5" />
                                        </>
                                    )}
                                </button>

                                <p className="text-xs text-center text-neutral-400 flex items-center justify-center gap-1">
                                    <ShieldCheck className="w-4 h-4" />
                                    Sichere Bezahlung via Stripe
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
