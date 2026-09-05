'use client';

import { useCartStore } from "@/lib/store";
import { CopyMinus, CopyPlus, Trash2, ArrowRight, ShieldCheck, Loader2, AlertCircle, CalendarClock } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useMounted } from "@/lib/useMounted";
import { calculateShipping, formatEuro, DEFAULT_ORDERS_CLOSED_MESSAGE, type ShopSettings } from "@/lib/shop-settings";

export default function CartClient({ settings }: { settings: ShopSettings }) {
    const { items, removeItem, updateQuantity, getCartTotal, getCartCount } = useCartStore();
    const mounted = useMounted();
    const [loading, setLoading] = useState(false);
    const [acceptedTerms, setAcceptedTerms] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    const handleCheckout = async () => {
        setCheckoutError(null);

        if (!settings.ordersOpen) {
            setCheckoutError(settings.ordersClosedMessage || DEFAULT_ORDERS_CLOSED_MESSAGE);
            return;
        }
        if (!acceptedTerms) {
            setCheckoutError("Bitte akzeptiere die AGB und Widerrufsbelehrung.");
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

            // Antwort defensiv lesen: liefert die Route wider Erwarten kein JSON,
            // darf das die konkrete Fehlermeldung nicht verschlucken.
            const raw = await response.text();
            let data: { url?: string; error?: string } = {};
            try {
                data = raw ? JSON.parse(raw) : {};
            } catch {
                data = { error: raw || undefined };
            }

            if (response.ok && data.url) {
                window.location.href = data.url; // Weiter zu Stripe Checkout
                return;
            }

            setCheckoutError(
                data.error || "Die Bezahlung konnte nicht gestartet werden. Bitte versuche es noch einmal."
            );
            setLoading(false);
        } catch (error) {
            console.error('Checkout error:', error);
            setCheckoutError(
                "Wir konnten den Shop gerade nicht erreichen. Bitte prüfe deine Internetverbindung und versuche es noch einmal."
            );
            setLoading(false);
        }
    };

    if (!mounted) return null;

    const total = getCartTotal();
    const count = getCartCount();
    const shipping = calculateShipping(total, settings);

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-36 pb-20 px-6 lg:px-12">
            <div className="max-w-5xl mx-auto">
                <h1 className="text-4xl font-extrabold mb-2 text-[var(--color-brand-text)]">Dein Warenkorb</h1>
                <p className="text-[var(--color-brand-dark)] mb-12">
                    {count > 0 ? `Du hast ${count} leckere Kekse im Korb.` : 'Dein Warenkorb ist noch hungrig!'}
                </p>

                {!settings.ordersOpen && (
                    <div
                        role="status"
                        className="bg-white border-2 border-[var(--color-brand-accent)] rounded-3xl p-6 lg:p-8 mb-10 flex flex-col sm:flex-row gap-5 items-center shadow-sm"
                    >
                        <div className="flex-shrink-0 bg-[var(--color-brand-bg)] p-4 rounded-full">
                            <CalendarClock className="w-8 h-8 text-[var(--color-brand-primary)]" />
                        </div>
                        <div className="text-center sm:text-left">
                            <h2 className="font-serif text-xl font-bold text-[var(--color-brand-text)] mb-1">
                                Zurzeit keine Bestellannahme
                            </h2>
                            <p className="text-[var(--color-brand-dark)] leading-relaxed">
                                {settings.ordersClosedMessage || DEFAULT_ORDERS_CLOSED_MESSAGE}
                            </p>
                            <p className="text-sm text-neutral-500 mt-2">
                                Dein Warenkorb bleibt gespeichert – du kannst später einfach weitermachen.
                            </p>
                        </div>
                    </div>
                )}

                {items.length === 0 ? (
                    <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-neutral-100">
                        <svg className="w-28 h-28 mx-auto mb-6" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M16 70 L23 95 Q23 99 28 99 L72 99 Q77 99 77 95 L84 70 Z" fill="#A06428"/>
                            <path d="M16 70 L23 93 Q23 97 28 97 L72 97 Q77 97 77 93 L84 70 Z" fill="#C8873A"/>
                            <line x1="18" y1="79" x2="82" y2="79" stroke="#8B5520" strokeWidth="2" opacity="0.45"/>
                            <line x1="20" y1="89" x2="80" y2="89" stroke="#8B5520" strokeWidth="2" opacity="0.45"/>
                            <rect x="13" y="64" width="74" height="10" rx="5" fill="#7A4A1F"/>
<path d="M22 69 Q50 6 78 69" stroke="#6B3F1F" strokeWidth="6" strokeLinecap="round" fill="none"/>
                            <path d="M22 69 Q50 6 78 69" stroke="#9B6030" strokeWidth="3" strokeLinecap="round" fill="none"/>
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
                                            {formatEuro(item.price)} / Stück
                                        </p>

                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-3 bg-[var(--color-brand-bg)] px-3 py-1 rounded-full border border-neutral-200">
                                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`Menge von ${item.name} verringern`} className="hover:text-[var(--color-brand-primary)] p-1">
                                                    <CopyMinus className="w-4 h-4" />
                                                </button>
                                                <span className="font-bold w-4 text-center">{item.quantity}</span>
                                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`Menge von ${item.name} erhöhen`} className="hover:text-[var(--color-brand-primary)] p-1">
                                                    <CopyPlus className="w-4 h-4" />
                                                </button>
                                            </div>

                                            <button onClick={() => removeItem(item.id)} aria-label={`${item.name} aus dem Warenkorb entfernen`} className="text-neutral-400 hover:text-red-500 transition-colors p-2">
                                                <Trash2 className="w-5 h-5" />
                                            </button>
                                        </div>
                                    </div>

                                    <div className="text-xl font-bold text-right hidden sm:block">
                                        {formatEuro(item.price * item.quantity)}
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
                                        <span>{formatEuro(total)}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Versand:</span>
                                        <span>{shipping === 0 ? 'Kostenlos' : formatEuro(shipping)}</span>
                                    </div>
                                    {settings.freeShippingThreshold !== null && (
                                        <p className="text-xs text-neutral-400 text-right">
                                            Kostenloser Versand ab {formatEuro(settings.freeShippingThreshold)}
                                        </p>
                                    )}
                                </div>

                                <div className="flex justify-between text-2xl font-black mb-8 border-t pt-4 text-[var(--color-brand-text)]">
                                    <span>Gesamt:</span>
                                    <span>{formatEuro(total + shipping)}</span>
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

                                {checkoutError && (
                                    <div
                                        role="alert"
                                        className="flex gap-3 items-start bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-4 text-sm"
                                    >
                                        <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                        <span>{checkoutError}</span>
                                    </div>
                                )}

                                <button
                                    onClick={handleCheckout}
                                    disabled={loading || !acceptedTerms || !settings.ordersOpen}
                                    className="w-full flex items-center justify-center gap-2 bg-[var(--color-brand-primary)] text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#c29160] transition-transform hover:-translate-y-1 shadow-md mb-4 disabled:opacity-50 disabled:hover:translate-y-0 disabled:cursor-not-allowed"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Einen Moment...
                                        </>
                                    ) : (
                                        <>
                                            {settings.ordersOpen ? 'Zur Kasse' : 'Bestellannahme pausiert'}
                                            {settings.ordersOpen && <ArrowRight className="w-5 h-5" />}
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
