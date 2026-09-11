'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Plus, Minus, Check } from 'lucide-react';
import AddToCartButton from './AddToCartButton';
import { formatEuro } from '@/lib/shop-settings';

/**
 * Karton zum Selbstzusammenstellen.
 *
 * Der Preis hängt nicht von der Auswahl ab – er steht fest am Karton. Was sich
 * mit der Auswahl ändert, ist die Nettofüllmenge und damit der Grundpreis je
 * Kilogramm, weil die Sorten unterschiedlich schwer sein können.
 *
 * Die Pflichtangaben je Sorte rendert die Seite serverseitig darunter; hier
 * geht es nur um die Auswahl.
 */

export interface ConfiguratorVariety {
    id: string;
    name: string;
    description: string | null;
    imageUrl: string | null;
    pieceWeightGrams: number | null;
}

export default function BoxConfigurator({
    productId,
    productName,
    price,
    pieceCount,
    imageUrl,
    varieties,
    ordersOpen,
}: {
    productId: string;
    productName: string;
    price: number;
    pieceCount: number;
    imageUrl: string | null;
    varieties: ConfiguratorVariety[];
    ordersOpen: boolean;
}) {
    const [counts, setCounts] = useState<Record<string, number>>({});

    const total = useMemo(
        () => Object.values(counts).reduce((sum, n) => sum + n, 0),
        [counts]
    );
    const remaining = pieceCount - total;
    const complete = remaining === 0;

    const selection = useMemo(
        () =>
            varieties
                .filter((v) => (counts[v.id] ?? 0) > 0)
                .map((v) => ({ varietyId: v.id, name: v.name, quantity: counts[v.id] })),
        [varieties, counts]
    );

    // Nettofüllmenge der aktuellen Auswahl. Fehlt bei einer Sorte das
    // Stückgewicht, wird gar nichts angezeigt statt einer zu kleinen Zahl.
    const netWeight = useMemo(() => {
        let grams = 0;
        for (const entry of selection) {
            const variety = varieties.find((v) => v.id === entry.varietyId);
            if (!variety || variety.pieceWeightGrams === null) return null;
            grams += variety.pieceWeightGrams * entry.quantity;
        }
        return grams > 0 ? Math.round(grams * 10) / 10 : null;
    }, [selection, varieties]);

    const step = (id: string, delta: number) => {
        if (delta > 0 && remaining <= 0) return;
        setCounts((current) => {
            const next = Math.max(0, (current[id] ?? 0) + delta);
            if (next === 0) {
                const { [id]: _removed, ...rest } = current;
                return rest;
            }
            return { ...current, [id]: next };
        });
    };

    if (varieties.length === 0) {
        return (
            <p className="text-sm text-[var(--color-brand-dark)] bg-[var(--color-brand-secondary)] rounded-2xl p-4">
                Für diesen Karton ist zurzeit keine Sorte freigegeben. Schau bald wieder vorbei.
            </p>
        );
    }

    return (
        <div>
            {/* Fortschritt – bleibt beim Scrollen sichtbar */}
            <div className="sticky top-24 z-10 mb-5 rounded-2xl border-2 border-[var(--color-brand-primary)] bg-white px-5 py-4 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                    <span className="font-bold text-[var(--color-brand-text)]">
                        {complete ? (
                            <span className="flex items-center gap-2 text-green-700">
                                <Check className="w-5 h-5" /> Karton ist komplett
                            </span>
                        ) : (
                            `Noch ${remaining} ${remaining === 1 ? 'Keks' : 'Kekse'} wählen`
                        )}
                    </span>
                    <span className="text-sm text-[var(--color-brand-dark)] whitespace-nowrap">
                        {total} von {pieceCount}
                    </span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[var(--color-brand-bg)] overflow-hidden">
                    <div
                        className="h-full bg-[var(--color-brand-primary)] transition-all duration-300"
                        style={{ width: `${Math.min(100, (total / pieceCount) * 100)}%` }}
                    />
                </div>
            </div>

            <div className="space-y-3 mb-6">
                {varieties.map((variety) => {
                    const count = counts[variety.id] ?? 0;
                    return (
                        <div
                            key={variety.id}
                            className={`flex items-center gap-4 p-3 rounded-2xl border transition-colors ${
                                count > 0
                                    ? 'border-[var(--color-brand-primary)]/40 bg-[var(--color-brand-secondary)]/50'
                                    : 'border-neutral-200 bg-white'
                            }`}
                        >
                            <div className="w-14 h-14 rounded-xl bg-[var(--color-brand-secondary)] overflow-hidden relative flex-shrink-0">
                                {variety.imageUrl ? (
                                    <Image src={variety.imageUrl} alt="" fill className="object-cover" sizes="56px" />
                                ) : (
                                    <span className="absolute inset-0 flex items-center justify-center text-2xl">🍪</span>
                                )}
                            </div>

                            <div className="flex-1 min-w-0">
                                <span className="font-bold text-[var(--color-brand-text)] block truncate">
                                    {variety.name}
                                </span>
                                {variety.description && (
                                    <span className="text-sm text-[var(--color-brand-dark)] block line-clamp-1">
                                        {variety.description}
                                    </span>
                                )}
                            </div>

                            <div className="flex items-center gap-2 flex-shrink-0">
                                <button
                                    type="button"
                                    onClick={() => step(variety.id, -1)}
                                    disabled={count === 0}
                                    aria-label={`Ein ${variety.name} weniger`}
                                    className="p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 transition-colors"
                                >
                                    <Minus className="w-4 h-4" />
                                </button>
                                <span className="w-7 text-center font-bold" aria-live="polite">
                                    {count}
                                </span>
                                <button
                                    type="button"
                                    onClick={() => step(variety.id, 1)}
                                    disabled={remaining <= 0}
                                    aria-label={`Ein ${variety.name} mehr`}
                                    className="p-2 rounded-lg border border-neutral-200 bg-white hover:bg-neutral-50 disabled:opacity-30 transition-colors"
                                >
                                    <Plus className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    );
                })}
            </div>

            {netWeight !== null && (
                <p className="text-sm text-neutral-500 mb-4">
                    Deine Auswahl wiegt {String(netWeight).replace('.', ',')} g
                    {' · '}
                    Grundpreis {formatEuro(price / (netWeight / 1000))} / kg
                </p>
            )}

            <AddToCartButton
                product={{ id: productId, name: productName, price, imageUrl }}
                selection={selection}
                disabled={!complete || !ordersOpen}
                disabledLabel={
                    !ordersOpen
                        ? 'Zurzeit keine Bestellannahme'
                        : `Noch ${remaining} ${remaining === 1 ? 'Keks' : 'Kekse'} wählen`
                }
            />
        </div>
    );
}
