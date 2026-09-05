'use client';

import { useEffect, useState } from 'react';
import { Save, Truck, AlertTriangle, Check } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { DEFAULT_SHIPPING_SETTINGS, calculateShipping, formatEuro } from '@/lib/shipping';

export default function AdminSettings() {
    // createBrowserClient liest die Admin-Session aus den Cookies – nötig, damit
    // das UPDATE die RLS-Policy passiert.
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [shippingCost, setShippingCost] = useState(String(DEFAULT_SHIPPING_SETTINGS.shippingCost));
    const [freeShippingEnabled, setFreeShippingEnabled] = useState(true);
    const [freeShippingThreshold, setFreeShippingThreshold] = useState('30');
    const [deliveryMin, setDeliveryMin] = useState('2');
    const [deliveryMax, setDeliveryMax] = useState('4');

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const load = async () => {
            const { data, error: loadError } = await supabase
                .from('shop_settings')
                .select('*')
                .eq('id', 1)
                .maybeSingle();

            if (loadError) {
                setError(
                    'Die Tabelle "shop_settings" wurde noch nicht angelegt. Führe dafür die Datei shop_settings.sql im Supabase SQL Editor aus. Bis dahin gelten die Standardwerte (4,90 € Versand, kostenlos ab 30 €).'
                );
            } else if (data) {
                setShippingCost(String(Number(data.shipping_cost)));
                setFreeShippingEnabled(data.free_shipping_threshold !== null);
                if (data.free_shipping_threshold !== null) {
                    setFreeShippingThreshold(String(Number(data.free_shipping_threshold)));
                }
                setDeliveryMin(String(data.delivery_days_min));
                setDeliveryMax(String(data.delivery_days_max));
            }
            setLoading(false);
        };
        load();
    }, [supabase]);

    const parsedCost = parseFloat(shippingCost.replace(',', '.'));
    const parsedThreshold = parseFloat(freeShippingThreshold.replace(',', '.'));

    const previewSettings = {
        shippingCost: isNaN(parsedCost) ? 0 : parsedCost,
        freeShippingThreshold: freeShippingEnabled && !isNaN(parsedThreshold) ? parsedThreshold : null,
        deliveryDaysMin: parseInt(deliveryMin) || 0,
        deliveryDaysMax: parseInt(deliveryMax) || 0,
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setSaved(false);

        if (isNaN(parsedCost) || parsedCost < 0) {
            setError('Bitte gib gültige Versandkosten ein.');
            return;
        }
        if (freeShippingEnabled && (isNaN(parsedThreshold) || parsedThreshold < 0)) {
            setError('Bitte gib eine gültige Freigrenze ein.');
            return;
        }
        if (previewSettings.deliveryDaysMin > previewSettings.deliveryDaysMax) {
            setError('Die minimale Lieferzeit darf nicht größer als die maximale sein.');
            return;
        }

        setSaving(true);
        try {
            const { error: saveError } = await supabase
                .from('shop_settings')
                .update({
                    shipping_cost: parsedCost,
                    free_shipping_threshold: freeShippingEnabled ? parsedThreshold : null,
                    delivery_days_min: previewSettings.deliveryDaysMin,
                    delivery_days_max: previewSettings.deliveryDaysMax,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', 1);

            if (saveError) throw saveError;

            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch (err: any) {
            setError('Fehler beim Speichern: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all';

    if (loading) {
        return <p className="text-gray-500">Einstellungen werden geladen …</p>;
    }

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Einstellungen</h1>
            </div>
            <p className="text-gray-500 mb-8">
                Diese Werte gelten sofort im Warenkorb, beim Bezahlen und in den E-Mails – ein neuer Deploy ist nicht nötig.
            </p>

            {error && (
                <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl mb-6 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4 flex items-center gap-2">
                        <Truck className="w-5 h-5 text-[var(--color-brand-primary)]" />
                        Versand
                    </h2>

                    <div className="space-y-6">
                        <div>
                            <label htmlFor="shipping-cost" className="block text-sm font-medium text-gray-700 mb-2">
                                Versandkosten (€)
                            </label>
                            <input
                                id="shipping-cost"
                                type="number"
                                step="0.01"
                                min="0"
                                value={shippingCost}
                                onChange={(e) => setShippingCost(e.target.value)}
                                className={inputClass}
                                required
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Pauschale pro Bestellung. Wird bei Stripe als Versandposition angezeigt.
                            </p>
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <label className="flex items-center gap-3 cursor-pointer mb-4">
                                <input
                                    type="checkbox"
                                    checked={freeShippingEnabled}
                                    onChange={(e) => setFreeShippingEnabled(e.target.checked)}
                                    className="w-4 h-4 rounded border-gray-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)] cursor-pointer"
                                />
                                <span className="text-sm font-medium text-gray-700">
                                    Kostenlosen Versand ab einem bestimmten Warenwert anbieten
                                </span>
                            </label>

                            {freeShippingEnabled && (
                                <div>
                                    <label htmlFor="free-threshold" className="block text-sm font-medium text-gray-700 mb-2">
                                        Kostenlos ab (€)
                                    </label>
                                    <input
                                        id="free-threshold"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        value={freeShippingThreshold}
                                        onChange={(e) => setFreeShippingThreshold(e.target.value)}
                                        className={inputClass}
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-2">
                                        Gilt für den Warenwert ohne Versandkosten. Genau dieser Betrag zählt bereits als kostenlos.
                                    </p>
                                </div>
                            )}
                        </div>

                        <div className="border-t border-gray-100 pt-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Lieferzeit (Werktage)</label>
                            <div className="grid grid-cols-2 gap-6">
                                <div>
                                    <input
                                        type="number"
                                        min="1"
                                        value={deliveryMin}
                                        onChange={(e) => setDeliveryMin(e.target.value)}
                                        className={inputClass}
                                        aria-label="Lieferzeit von (Werktage)"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-2">von</p>
                                </div>
                                <div>
                                    <input
                                        type="number"
                                        min="1"
                                        value={deliveryMax}
                                        onChange={(e) => setDeliveryMax(e.target.value)}
                                        className={inputClass}
                                        aria-label="Lieferzeit bis (Werktage)"
                                        required
                                    />
                                    <p className="text-xs text-gray-400 mt-2">bis</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Vorschau, damit Tippfehler auffallen bevor sie live sind */}
                <div className="bg-[var(--color-brand-secondary)] p-8 rounded-3xl border border-gray-100">
                    <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 mb-4">
                        So sieht es der Kunde
                    </h2>
                    <ul className="space-y-2 text-sm text-gray-700">
                        <li className="flex justify-between border-b border-black/5 pb-2">
                            <span>Warenkorb 15,00 €</span>
                            <strong>
                                {calculateShipping(15, previewSettings) === 0
                                    ? 'Versand kostenlos'
                                    : `Versand ${formatEuro(calculateShipping(15, previewSettings))}`}
                            </strong>
                        </li>
                        {previewSettings.freeShippingThreshold !== null && (
                            <li className="flex justify-between border-b border-black/5 pb-2">
                                <span>Warenkorb {formatEuro(previewSettings.freeShippingThreshold)} (genau die Freigrenze)</span>
                                <strong>
                                    {calculateShipping(previewSettings.freeShippingThreshold, previewSettings) === 0
                                        ? 'Versand kostenlos'
                                        : `Versand ${formatEuro(calculateShipping(previewSettings.freeShippingThreshold, previewSettings))}`}
                                </strong>
                            </li>
                        )}
                        <li className="flex justify-between">
                            <span>Lieferzeit</span>
                            <strong>
                                {previewSettings.deliveryDaysMin}–{previewSettings.deliveryDaysMax} Werktage
                            </strong>
                        </li>
                    </ul>
                </div>

                <div className="flex items-center gap-4">
                    <button
                        type="submit"
                        disabled={saving}
                        className="flex items-center gap-2 bg-[var(--color-brand-primary)] text-white px-8 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                        <Save className="w-5 h-5" />
                        {saving ? 'Wird gespeichert …' : 'Speichern'}
                    </button>
                    {saved && (
                        <span className="flex items-center gap-2 text-green-700 font-medium text-sm">
                            <Check className="w-5 h-5" /> Gespeichert
                        </span>
                    )}
                </div>
            </form>
        </div>
    );
}
