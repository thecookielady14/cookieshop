'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, Plus, Minus, AlertCircle, Phone } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { formatEuro, calculateShipping, DEFAULT_SHIPPING_SETTINGS, type ShippingSettings } from '@/lib/shipping';
import { VAT_PERCENTAGE } from '@/lib/site';

interface Product {
    id: string;
    name: string;
    price: number;
    stock_count: number | null;
}

export default function NewPhoneOrder() {
    const router = useRouter();
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [products, setProducts] = useState<Product[]>([]);
    const [settings, setSettings] = useState<ShippingSettings>(DEFAULT_SHIPPING_SETTINGS);
    const [quantities, setQuantities] = useState<Record<string, number>>({});

    const [customerName, setCustomerName] = useState('');
    const [customerEmail, setCustomerEmail] = useState('');
    const [invoiceReference, setInvoiceReference] = useState('');
    const [notes, setNotes] = useState('');
    const [status, setStatus] = useState<'pending' | 'paid'>('pending');
    const [overrideShipping, setOverrideShipping] = useState(false);
    const [shippingInput, setShippingInput] = useState('');

    const [street, setStreet] = useState('');
    const [postalCode, setPostalCode] = useState('');
    const [city, setCity] = useState('');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const [{ data: prods }, { data: cfg }] = await Promise.all([
                supabase.from('products').select('id, name, price, stock_count').order('name'),
                supabase.from('shop_settings').select('*').eq('id', 1).maybeSingle(),
            ]);
            setProducts(prods ?? []);
            if (cfg) {
                setSettings({
                    shippingCost: Number(cfg.shipping_cost),
                    freeShippingThreshold:
                        cfg.free_shipping_threshold === null ? null : Number(cfg.free_shipping_threshold),
                    deliveryDaysMin: cfg.delivery_days_min,
                    deliveryDaysMax: cfg.delivery_days_max,
                });
            }
            setLoading(false);
        };
        load();
    }, [supabase]);

    const selected = useMemo(
        () => products.filter((p) => (quantities[p.id] ?? 0) > 0),
        [products, quantities]
    );
    const goodsTotal = useMemo(
        () => selected.reduce((sum, p) => sum + p.price * (quantities[p.id] ?? 0), 0),
        [selected, quantities]
    );

    const parsedShipping = parseFloat(shippingInput.replace(',', '.'));
    const shippingCost = overrideShipping && !isNaN(parsedShipping)
        ? parsedShipping
        : calculateShipping(goodsTotal, settings);
    const totalAmount = goodsTotal + shippingCost;

    const changeQuantity = (id: string, delta: number) => {
        setQuantities((prev) => {
            const next = Math.max(0, (prev[id] ?? 0) + delta);
            return { ...prev, [id]: next };
        });
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (selected.length === 0) {
            setError('Bitte mindestens ein Produkt auswählen.');
            return;
        }
        if (!customerName.trim()) {
            setError('Bitte einen Namen eintragen.');
            return;
        }

        setSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                setError('Deine Sitzung ist abgelaufen. Bitte melde dich neu an.');
                setSaving(false);
                return;
            }

            const hasAddress = street.trim() || postalCode.trim() || city.trim();
            const response = await fetch('/api/admin/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${session.access_token}`,
                },
                body: JSON.stringify({
                    items: selected.map((p) => ({ id: p.id, quantity: quantities[p.id] })),
                    customerName,
                    customerEmail,
                    invoiceReference,
                    notes,
                    status,
                    shippingCost,
                    shippingAddress: hasAddress
                        ? { name: customerName, line1: street, postal_code: postalCode, city, country: 'DE' }
                        : null,
                }),
            });

            const data = await response.json().catch(() => ({}));
            if (!response.ok) {
                setError(data.error || 'Die Bestellung konnte nicht gespeichert werden.');
                setSaving(false);
                return;
            }

            router.push('/admin/orders');
            router.refresh();
        } catch {
            setError('Der Server war nicht erreichbar. Bitte noch einmal versuchen.');
            setSaving(false);
        }
    };

    const inputClass =
        'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all';

    if (loading) return <p className="text-gray-500">Wird geladen …</p>;

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/admin/orders" className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Telefonbestellung erfassen</h1>
            </div>
            <p className="text-gray-500 mb-8 ml-14">
                Die Rechnung schreibst du wie gewohnt in Lexware. Hier wird nur der Lagerbestand
                abgezogen, damit der Shop dieselben Kekse nicht noch einmal online verkauft.
            </p>

            {error && (
                <div role="alert" className="flex gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-6 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Produkte */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Produkte</h2>
                    {products.length === 0 ? (
                        <p className="text-gray-500 text-sm">
                            Es sind noch keine Produkte angelegt.{' '}
                            <Link href="/admin/products/new" className="text-[var(--color-brand-primary)] underline">
                                Jetzt eins anlegen
                            </Link>
                        </p>
                    ) : (
                        <div className="space-y-3">
                            {products.map((p) => {
                                const qty = quantities[p.id] ?? 0;
                                const stock = p.stock_count ?? 0;
                                return (
                                    <div key={p.id} className={`flex items-center gap-4 p-3 rounded-2xl border ${qty > 0 ? 'border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-secondary)]/40' : 'border-gray-100'}`}>
                                        <div className="flex-1 min-w-0">
                                            <span className="font-medium text-gray-900 block truncate">{p.name}</span>
                                            <span className="text-sm text-gray-500">
                                                {formatEuro(p.price)} · Lager: {stock}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                type="button"
                                                onClick={() => changeQuantity(p.id, -1)}
                                                disabled={qty === 0}
                                                aria-label={`Menge von ${p.name} verringern`}
                                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                                            >
                                                <Minus className="w-4 h-4" />
                                            </button>
                                            <span className="w-8 text-center font-bold">{qty}</span>
                                            <button
                                                type="button"
                                                onClick={() => changeQuantity(p.id, 1)}
                                                disabled={qty >= stock}
                                                aria-label={`Menge von ${p.name} erhöhen`}
                                                className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
                                            >
                                                <Plus className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Kundendaten */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                        <Phone className="w-5 h-5 text-[var(--color-brand-primary)]" />
                        Kundin oder Kunde
                    </h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">Name</label>
                            <input id="name" type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className={inputClass} required />
                        </div>
                        <div>
                            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                E-Mail <span className="text-gray-400 font-normal">– optional</span>
                            </label>
                            <input id="email" type="email" value={customerEmail} onChange={(e) => setCustomerEmail(e.target.value)} className={inputClass} />
                            <p className="text-xs text-gray-400 mt-2">
                                Nur nötig, wenn eine Versandbenachrichtigung rausgehen soll. Legst du die
                                Rechnung ausgedruckt bei, lass das Feld leer.
                            </p>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            <div className="sm:col-span-3">
                                <label htmlFor="street" className="block text-sm font-medium text-gray-700 mb-2">Straße und Hausnummer</label>
                                <input id="street" type="text" value={street} onChange={(e) => setStreet(e.target.value)} className={inputClass} />
                            </div>
                            <div>
                                <label htmlFor="plz" className="block text-sm font-medium text-gray-700 mb-2">PLZ</label>
                                <input id="plz" type="text" value={postalCode} onChange={(e) => setPostalCode(e.target.value)} className={inputClass} />
                            </div>
                            <div className="sm:col-span-2">
                                <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-2">Ort</label>
                                <input id="city" type="text" value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Abwicklung */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Abwicklung</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="invoice" className="block text-sm font-medium text-gray-700 mb-2">
                                Rechnungsnummer aus Lexware <span className="text-gray-400 font-normal">– optional</span>
                            </label>
                            <input id="invoice" type="text" value={invoiceReference} onChange={(e) => setInvoiceReference(e.target.value)} placeholder="z.B. TEL-2026-0001" className={inputClass} />
                            <p className="text-xs text-gray-400 mt-2">
                                Damit findest du später zu jeder Bestellung die passende Rechnung.
                            </p>
                        </div>
                        <div>
                            <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">Zahlungsstatus</label>
                            <select id="status" value={status} onChange={(e) => setStatus(e.target.value as 'pending' | 'paid')} className={inputClass}>
                                <option value="pending">Noch offen</option>
                                <option value="paid">Bezahlt</option>
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-3 cursor-pointer mb-3">
                                <input type="checkbox" checked={overrideShipping} onChange={(e) => setOverrideShipping(e.target.checked)} className="w-4 h-4 rounded border-gray-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]" />
                                <span className="text-sm font-medium text-gray-700">Abweichende Versandkosten</span>
                            </label>
                            {overrideShipping && (
                                <input type="number" step="0.01" min="0" value={shippingInput} onChange={(e) => setShippingInput(e.target.value)} placeholder="0.00" className={inputClass} aria-label="Abweichende Versandkosten in Euro" />
                            )}
                        </div>
                        <div>
                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-2">
                                Notiz <span className="text-gray-400 font-normal">– optional</span>
                            </label>
                            <textarea id="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="z.B. Abholung am Samstag" className={inputClass} />
                        </div>
                    </div>
                </div>

                {/* Summe */}
                <div className="bg-[var(--color-brand-secondary)] p-8 rounded-3xl border border-gray-100">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">Summe</h2>
                    <ul className="space-y-2 text-sm text-gray-700">
                        {selected.map((p) => (
                            <li key={p.id} className="flex justify-between">
                                <span>{quantities[p.id]}× {p.name}</span>
                                <span>{formatEuro(p.price * quantities[p.id])}</span>
                            </li>
                        ))}
                        <li className="flex justify-between border-t border-black/10 pt-2">
                            <span>Versand</span>
                            <span>{shippingCost === 0 ? 'Kostenlos' : formatEuro(shippingCost)}</span>
                        </li>
                        <li className="flex justify-between font-bold text-base text-gray-900 border-t border-black/10 pt-2">
                            <span>Gesamt</span>
                            <span>{formatEuro(totalAmount)}</span>
                        </li>
                        <li className="flex justify-between text-xs text-gray-500">
                            <span>darin enthalten {VAT_PERCENTAGE} % MwSt.</span>
                            <span>{formatEuro(totalAmount - totalAmount / (1 + VAT_PERCENTAGE / 100))}</span>
                        </li>
                    </ul>
                </div>

                <button
                    type="submit"
                    disabled={saving || selected.length === 0}
                    className="flex items-center gap-2 bg-[var(--color-brand-primary)] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                >
                    <Save className="w-5 h-5" />
                    {saving ? 'Wird gespeichert …' : 'Bestellung anlegen'}
                </button>
            </form>
        </div>
    );
}
