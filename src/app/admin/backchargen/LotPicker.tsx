'use client';

import { useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { ScanBarcode, X, AlertTriangle } from 'lucide-react';
import BarcodeScanner from '@/components/BarcodeScanner';
import { mhdStatus } from '@/lib/mhd';

export interface OpenLot {
    id: string;
    lot_number: string;
    best_before: string | null;
    ingredient_id: string;
    ingredient_name: string;
    ingredient_ean: string | null;
}

/**
 * Auswahl der Zutatenchargen für eine Backcharge.
 *
 * Mehrere Chargen derselben Zutat sind ausdrücklich erlaubt: wird mitten im
 * Backen eine neue Packung Mehl angebrochen, kommen einfach beide Lose hinein.
 * Bei einem Rückruf ist dann die ganze Backcharge betroffen – vorsichtiger als
 * nötig, aber ohne Rechnerei am Backblech.
 */
export default function LotPicker({
    lots,
    selected,
    onChange,
}: {
    lots: OpenLot[];
    selected: string[];
    onChange: (ids: string[]) => void;
}) {
    const [scanning, setScanning] = useState(false);
    const [hinweis, setHinweis] = useState<string | null>(null);
    /** Nach einem Scan mit mehreren offenen Losen: aus welcher Zutat wählen. */
    const [auswahlZutat, setAuswahlZutat] = useState<string | null>(null);

    const byIngredient = useMemo(() => {
        const map = new Map<string, { name: string; lots: OpenLot[] }>();
        for (const lot of lots) {
            const entry = map.get(lot.ingredient_id) ?? { name: lot.ingredient_name, lots: [] };
            entry.lots.push(lot);
            map.set(lot.ingredient_id, entry);
        }
        return [...map.entries()].sort((a, b) => a[1].name.localeCompare(b[1].name, 'de'));
    }, [lots]);

    const toggle = (id: string) =>
        onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);

    const handleScan = (code: string) => {
        setScanning(false);
        setAuswahlZutat(null);
        const passend = lots.filter((l) => l.ingredient_ean === code);
        const zutaten = new Set(passend.map((l) => l.ingredient_id));
        if (passend.length === 0) {
            setHinweis(`Zum Barcode ${code} gibt es keine offene Charge. Erfasse die Packung zuerst unter „Zutaten“.`);
        } else if (passend.length === 1) {
            if (!selected.includes(passend[0].id)) onChange([...selected, passend[0].id]);
            setHinweis(`${passend[0].ingredient_name}, Los ${passend[0].lot_number} hinzugefügt.`);
        } else if (zutaten.size === 1) {
            setAuswahlZutat(passend[0].ingredient_id);
            setHinweis(`${passend[0].ingredient_name} hat mehrere offene Lose – tippe das an, das auf der Packung steht.`);
        } else {
            setHinweis(`Der Barcode ${code} passt zu mehreren Zutaten – bitte unten auswählen.`);
        }
    };

    const selectedLots = lots.filter((l) => selected.includes(l.id));

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <span className="text-sm text-gray-600">Verwendete Zutatenchargen</span>
                <button type="button" onClick={() => { setHinweis(null); setScanning(true); }}
                    className="flex items-center gap-2 whitespace-nowrap bg-[var(--color-brand-primary)] text-white px-4 py-2.5 rounded-xl font-bold hover:opacity-90">
                    <ScanBarcode className="w-5 h-5 flex-shrink-0" /> Packung scannen
                </button>
            </div>

            {hinweis && (
                <div className="flex gap-2 bg-amber-50 text-amber-900 p-3 rounded-xl text-sm">
                    <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p>{hinweis}</p>
                </div>
            )}

            {selectedLots.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {selectedLots.map((l) => (
                        <span key={l.id} className="inline-flex items-center gap-1 bg-[var(--color-brand-secondary)] border border-[var(--color-brand-accent)]/40 text-gray-900 pl-3 pr-1 py-1 rounded-full text-sm">
                            {l.ingredient_name} · <span className="font-mono">{l.lot_number}</span>
                            <button type="button" onClick={() => toggle(l.id)} aria-label={`${l.ingredient_name} Los ${l.lot_number} entfernen`}
                                className="p-1 rounded-full hover:bg-black/10">
                                <X className="w-3.5 h-3.5" />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {lots.length === 0 ? (
                <p className="text-sm text-gray-400 italic">
                    Keine offenen Zutatenchargen. Erfasse deine Packungen zuerst unter „Zutaten“.
                </p>
            ) : (
                <div className="grid md:grid-cols-2 gap-3">
                    {byIngredient.map(([id, { name, lots: eigene }]) => (
                        <fieldset key={id}
                            className={`rounded-2xl border p-3 ${auswahlZutat === id ? 'border-[var(--color-brand-accent)] bg-amber-50/50' : 'border-gray-100'}`}>
                            <legend className="px-1 text-sm font-bold text-gray-900">{name}</legend>
                            {eigene.map((l) => (
                                <label key={l.id} className="flex items-center gap-2 py-1 text-sm cursor-pointer">
                                    <input type="checkbox" checked={selected.includes(l.id)} onChange={() => toggle(l.id)} />
                                    <span className="font-mono">{l.lot_number}</span>
                                    {l.best_before && (mhdStatus(l.best_before, null) === 'abgelaufen' ? (
                                        <span className="text-xs font-bold text-red-700 bg-red-100 px-1.5 py-0.5 rounded">
                                            MHD {format(parseISO(l.best_before), 'dd.MM.yy')} abgelaufen
                                        </span>
                                    ) : (
                                        <span className="text-xs text-gray-400">MHD {format(parseISO(l.best_before), 'dd.MM.yy')}</span>
                                    ))}
                                </label>
                            ))}
                        </fieldset>
                    ))}
                </div>
            )}

            {scanning && <BarcodeScanner onDetected={handleScan} onClose={() => setScanning(false)} />}
        </div>
    );
}

/** Rohdaten aus Supabase (ingredient_lots mit eingebetteter Zutat) in OpenLot umformen. */
export function toOpenLots(rows: any[]): OpenLot[] {
    return rows
        .filter((r) => r.ingredients)
        .map((r) => ({
            id: r.id,
            lot_number: r.lot_number,
            best_before: r.best_before,
            ingredient_id: r.ingredients.id,
            ingredient_name: r.ingredients.name,
            ingredient_ean: r.ingredients.ean,
        }));
}
