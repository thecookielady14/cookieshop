'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { ScanBarcode, Plus, AlertTriangle, Check, Trash2, Search } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { assertWritten } from '@/lib/admin-write';
import BarcodeScanner from '@/components/BarcodeScanner';

interface Lot {
    id: string;
    lot_number: string;
    best_before: string | null;
    received_on: string;
    is_used_up: boolean;
    bake_batch_lots: { batch_id: string }[];
}

interface Ingredient {
    id: string;
    name: string;
    supplier: string | null;
    ean: string | null;
    ingredient_lots: Lot[];
}

const today = () => format(new Date(), 'yyyy-MM-dd');
const datum = (d: string | null) => (d ? format(parseISO(d), 'dd.MM.yyyy', { locale: de }) : '—');

/**
 * Zutaten und Wareneingang auf einer Seite: wer eine neue Packung Mehl
 * erfasst, braucht die Zutat ohnehin daneben. Eine Charge ist hier immer
 * „Los-Nummer des Herstellers + MHD" – genau das, was auf der Packung steht.
 */
export default function AdminZutaten() {
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [notice, setNotice] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [scanning, setScanning] = useState(false);
    const [showUsedUp, setShowUsedUp] = useState(false);
    const [suche, setSuche] = useState('');

    // Wareneingang
    const [ingredientId, setIngredientId] = useState('');
    const [lotNumber, setLotNumber] = useState('');
    const [bestBefore, setBestBefore] = useState('');
    const [receivedOn, setReceivedOn] = useState(today);

    // Neue Zutat (eingeblendet, wenn der Scan nichts findet oder per Knopf)
    const [newMode, setNewMode] = useState(false);
    const [newName, setNewName] = useState('');
    const [newSupplier, setNewSupplier] = useState('');
    const [newEan, setNewEan] = useState('');

    const load = useCallback(async () => {
        const { data, error: loadError } = await supabase
            .from('ingredients')
            .select('id, name, supplier, ean, ingredient_lots(id, lot_number, best_before, received_on, is_used_up, bake_batch_lots(batch_id))')
            .order('name');
        if (loadError) {
            setError(
                'Die Tabellen für die Rückverfolgung fehlen noch. Führe die Datei rueckverfolgung.sql im Supabase SQL Editor aus. (' +
                loadError.message + ')'
            );
        } else {
            setIngredients((data ?? []) as Ingredient[]);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        load();
    }, [load]);

    const handleScan = (code: string) => {
        setScanning(false);
        setError(null);
        const treffer = ingredients.filter((i) => i.ean === code);
        if (treffer.length === 1) {
            setNewMode(false);
            setIngredientId(treffer[0].id);
            setNotice(`Erkannt: ${treffer[0].name}. Jetzt Los-Nummer und MHD von der Packung eintragen.`);
        } else if (treffer.length > 1) {
            setNewMode(false);
            setIngredientId('');
            setNotice(`Der Barcode ${code} passt zu mehreren Zutaten – bitte unten auswählen.`);
        } else {
            setNewMode(true);
            setIngredientId('');
            setNewEan(code);
            setNotice(`Barcode ${code} ist noch unbekannt. Lege die Zutat einmalig an – beim nächsten Scan wird sie erkannt.`);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setNotice(null);

        if (newMode && !newName.trim()) return setError('Bitte gib der neuen Zutat einen Namen.');
        if (!newMode && !ingredientId) return setError('Bitte wähle eine Zutat aus oder scanne die Packung.');
        if (!lotNumber.trim()) return setError('Bitte trage die Los-Nummer von der Packung ein.');

        setSaving(true);
        try {
            let id = ingredientId;
            let name = ingredients.find((i) => i.id === id)?.name ?? '';
            if (newMode) {
                const { data, error: insertError } = await supabase
                    .from('ingredients')
                    .insert({
                        name: newName.trim(),
                        supplier: newSupplier.trim() || null,
                        ean: newEan.trim() || null,
                    })
                    .select('id');
                if (insertError) throw insertError;
                assertWritten(data, 'Die Zutat');
                id = data![0].id;
                name = newName.trim();
            }

            const { data, error: lotError } = await supabase
                .from('ingredient_lots')
                .insert({
                    ingredient_id: id,
                    lot_number: lotNumber.trim(),
                    best_before: bestBefore || null,
                    received_on: receivedOn || today(),
                })
                .select('id');
            if (lotError) {
                if (lotError.code === '23505') {
                    throw new Error(`Die Los-Nummer ${lotNumber.trim()} ist für ${name} bereits erfasst.`);
                }
                throw lotError;
            }
            assertWritten(data, 'Die Charge');

            setNotice(`Gespeichert: ${name}, Los ${lotNumber.trim()}.`);
            setLotNumber('');
            setBestBefore('');
            setNewMode(false);
            setNewName('');
            setNewSupplier('');
            setNewEan('');
            setIngredientId(id);
            await load();
        } catch (err) {
            setError('Fehler beim Speichern: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const toggleUsedUp = async (lot: Lot) => {
        setError(null);
        const { data, error: updateError } = await supabase
            .from('ingredient_lots')
            .update({ is_used_up: !lot.is_used_up })
            .eq('id', lot.id)
            .select('id');
        try {
            if (updateError) throw updateError;
            assertWritten(data, 'Die Änderung');
            setIngredients((prev) => prev.map((i) => ({
                ...i,
                ingredient_lots: i.ingredient_lots.map((l) => (l.id === lot.id ? { ...l, is_used_up: !l.is_used_up } : l)),
            })));
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const deleteLot = async (ing: Ingredient, lot: Lot) => {
        setError(null);
        if (lot.bake_batch_lots.length > 0) {
            setError(`Los ${lot.lot_number} wurde bereits verbacken und muss für die Rückverfolgung erhalten bleiben. Markiere es stattdessen als aufgebraucht.`);
            return;
        }
        if (!confirm(`Los ${lot.lot_number} von ${ing.name} wirklich löschen? Nur sinnvoll bei einem Tippfehler.`)) return;
        const { data, error: deleteError } = await supabase
            .from('ingredient_lots').delete().eq('id', lot.id).select('id');
        try {
            if (deleteError) throw deleteError;
            assertWritten(data, 'Das Löschen');
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const deleteIngredient = async (ing: Ingredient & { lotCount: number }) => {
        setError(null);
        if (ing.lotCount > 0) {
            setError(`${ing.name} hat bereits erfasste Chargen und bleibt deshalb erhalten.`);
            return;
        }
        if (!confirm(`Zutat „${ing.name}" wirklich löschen?`)) return;
        const { data, error: deleteError } = await supabase
            .from('ingredients').delete().eq('id', ing.id).select('id');
        try {
            if (deleteError) throw deleteError;
            assertWritten(data, 'Das Löschen');
            await load();
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const sichtbar = useMemo(() => {
        const begriff = suche.trim().toLowerCase();
        return ingredients
            .map((i) => ({
                ...i,
                // Vor dem Filtern zählen: gelöscht werden darf nur eine Zutat ganz ohne Chargen.
                lotCount: i.ingredient_lots.length,
                ingredient_lots: [...i.ingredient_lots]
                    .filter((l) => showUsedUp || !l.is_used_up)
                    .sort((a, b) => b.received_on.localeCompare(a.received_on)),
            }))
            .filter((i) => !begriff || [i.name, i.supplier, i.ean, ...i.ingredient_lots.map((l) => l.lot_number)]
                .filter(Boolean).join(' ').toLowerCase().includes(begriff));
    }, [ingredients, showUsedUp, suche]);

    const inputClass =
        'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all bg-white';

    if (loading) return <p className="text-gray-500">Zutaten werden geladen …</p>;

    return (
        <div className="max-w-4xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Zutaten &amp; Wareneingang</h1>
            <p className="text-gray-500 mb-8 max-w-2xl">
                Jede neue Packung bekommt hier ihre <strong className="text-gray-700">Los-Nummer und ihr MHD</strong>.
                Beim Backen wählst du dann aus, welche Packungen du benutzt hast – so lässt sich jeder Keks
                bis zum Lieferanten zurückverfolgen.
            </p>

            {error && (
                <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl mb-6 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}
            {notice && !error && (
                <div className="flex gap-3 bg-green-50 border border-green-200 text-green-900 p-4 rounded-2xl mb-6 text-sm">
                    <Check className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{notice}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8 space-y-4">
                <div className="flex items-center justify-between gap-4">
                    <h2 className="text-lg font-bold text-gray-900">Neue Packung erfassen</h2>
                    <button type="button" onClick={() => { setNotice(null); setScanning(true); }}
                        className="flex items-center gap-2 bg-[var(--color-brand-primary)] text-white px-4 py-3 rounded-xl font-bold hover:opacity-90">
                        <ScanBarcode className="w-5 h-5" /> Scannen
                    </button>
                </div>

                {newMode ? (
                    <div className="grid md:grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50">
                        <label className="block text-sm">
                            <span className="text-gray-600">Neue Zutat *</span>
                            <input className={inputClass} value={newName} onChange={(e) => setNewName(e.target.value)}
                                placeholder="z. B. Dinkelmehl Typ 630" autoFocus />
                        </label>
                        <label className="block text-sm">
                            <span className="text-gray-600">Lieferant / Marke</span>
                            <input className={inputClass} value={newSupplier} onChange={(e) => setNewSupplier(e.target.value)}
                                placeholder="z. B. Mühle Meier" />
                        </label>
                        <label className="block text-sm">
                            <span className="text-gray-600">Barcode (EAN)</span>
                            <input className={inputClass} value={newEan} onChange={(e) => setNewEan(e.target.value)}
                                inputMode="numeric" placeholder="optional" />
                        </label>
                        <button type="button" onClick={() => setNewMode(false)}
                            className="text-sm text-gray-500 hover:underline text-left md:col-span-3">
                            Doch eine vorhandene Zutat wählen
                        </button>
                    </div>
                ) : (
                    <div className="flex gap-2 items-end">
                        <label className="block text-sm flex-1">
                            <span className="text-gray-600">Zutat *</span>
                            <select className={inputClass} value={ingredientId} onChange={(e) => setIngredientId(e.target.value)}>
                                <option value="">– bitte wählen –</option>
                                {ingredients.map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {i.name}{i.supplier ? ` (${i.supplier})` : ''}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <button type="button" onClick={() => { setNewMode(true); setIngredientId(''); }}
                            className="flex items-center gap-1 px-4 py-3 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50 whitespace-nowrap">
                            <Plus className="w-4 h-4" /> Neue Zutat
                        </button>
                    </div>
                )}

                <div className="grid md:grid-cols-3 gap-3">
                    <label className="block text-sm">
                        <span className="text-gray-600">Los-Nummer *</span>
                        <input className={inputClass} value={lotNumber} onChange={(e) => setLotNumber(e.target.value)}
                            placeholder="steht neben dem MHD" />
                    </label>
                    <label className="block text-sm">
                        <span className="text-gray-600">MHD</span>
                        <input type="date" className={inputClass} value={bestBefore} onChange={(e) => setBestBefore(e.target.value)} />
                    </label>
                    <label className="block text-sm">
                        <span className="text-gray-600">Eingang am</span>
                        <input type="date" className={inputClass} value={receivedOn} onChange={(e) => setReceivedOn(e.target.value)} />
                    </label>
                </div>

                <button type="submit" disabled={saving}
                    className="w-full md:w-auto bg-[var(--color-brand-primary)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50">
                    {saving ? 'Speichert …' : 'Packung speichern'}
                </button>
            </form>

            <div className="flex flex-col md:flex-row md:items-center gap-3 mb-4">
                <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">Zutaten</h2>
                <label className="flex items-center gap-2 text-sm text-gray-600 md:ml-4">
                    <input type="checkbox" checked={showUsedUp} onChange={(e) => setShowUsedUp(e.target.checked)} />
                    Aufgebrauchte Chargen zeigen
                </label>
                <div className="relative md:ml-auto md:w-64">
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input type="search" value={suche} onChange={(e) => setSuche(e.target.value)}
                        placeholder="Zutat, Lieferant, Los …" aria-label="Zutaten durchsuchen"
                        className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-200 rounded-xl outline-none focus:border-[var(--color-brand-primary)]" />
                </div>
            </div>

            {sichtbar.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500">
                    {ingredients.length === 0 ? 'Noch keine Zutaten erfasst. Scanne deine erste Packung!' : 'Nichts gefunden.'}
                </div>
            ) : (
                <div className="space-y-4">
                    {sichtbar.map((ing) => (
                        <div key={ing.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-5">
                            <div className="flex items-start justify-between gap-3 mb-3">
                                <div>
                                    <span className="font-bold text-gray-900">{ing.name}</span>
                                    <span className="block text-xs text-gray-500">
                                        {[ing.supplier, ing.ean && `EAN ${ing.ean}`].filter(Boolean).join(' · ') || 'kein Lieferant hinterlegt'}
                                    </span>
                                </div>
                                {ing.lotCount === 0 && (
                                    <button type="button" onClick={() => deleteIngredient(ing)} aria-label={`${ing.name} löschen`}
                                        className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            {ing.ingredient_lots.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Keine offenen Chargen.</p>
                            ) : (
                                <ul className="divide-y divide-gray-50">
                                    {ing.ingredient_lots.map((lot) => (
                                        <li key={lot.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 py-2 text-sm">
                                            <span className={`font-mono font-bold ${lot.is_used_up ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                                                {lot.lot_number}
                                            </span>
                                            <span className="text-gray-500">MHD {datum(lot.best_before)}</span>
                                            <span className="text-gray-400">Eingang {datum(lot.received_on)}</span>
                                            {lot.bake_batch_lots.length > 0 && (
                                                <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold">
                                                    in {lot.bake_batch_lots.length} {lot.bake_batch_lots.length === 1 ? 'Backcharge' : 'Backchargen'}
                                                </span>
                                            )}
                                            <span className="flex gap-1 ml-auto">
                                                <button type="button" onClick={() => toggleUsedUp(lot)}
                                                    className="text-xs px-3 py-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50">
                                                    {lot.is_used_up ? 'Wieder öffnen' : 'Aufgebraucht'}
                                                </button>
                                                {lot.bake_batch_lots.length === 0 && (
                                                    <button type="button" onClick={() => deleteLot(ing, lot)} aria-label={`Los ${lot.lot_number} löschen`}
                                                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {scanning && <BarcodeScanner onDetected={handleScan} onClose={() => setScanning(false)} />}
        </div>
    );
}
