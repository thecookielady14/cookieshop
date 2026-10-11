'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { AlertTriangle, ChevronRight, Tag } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import LotPicker, { toOpenLots, type OpenLot } from './LotPicker';

interface Variety {
    id: string;
    name: string;
}

interface Batch {
    id: string;
    code: string;
    variety_id: string | null;
    variety_name: string;
    baked_on: string;
    piece_count: number | null;
    is_closed: boolean;
    bake_batch_lots: { lot_id: string }[];
    order_item_variety_batches: { order_item_variety_id: string }[];
}

const today = () => format(new Date(), 'yyyy-MM-dd');

/**
 * Backchargen: jede Backrunde einer Sorte bekommt eine fortlaufende Nummer
 * (L001, L002 …), die von Hand auf die Etiketten geschrieben wird. Dazu wird
 * festgehalten, welche Zutatenpackungen verbacken wurden.
 */
export default function AdminBackchargen() {
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [varieties, setVarieties] = useState<Variety[]>([]);
    const [lots, setLots] = useState<OpenLot[]>([]);
    const [batches, setBatches] = useState<Batch[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [created, setCreated] = useState<{ id: string; code: string; variety: string } | null>(null);
    const [prefillHinweis, setPrefillHinweis] = useState<string | null>(null);
    const [showClosed, setShowClosed] = useState(false);

    const [varietyId, setVarietyId] = useState('');
    const [bakedOn, setBakedOn] = useState(today);
    const [pieceCount, setPieceCount] = useState('');
    const [notes, setNotes] = useState('');
    const [selectedLots, setSelectedLots] = useState<string[]>([]);

    const load = useCallback(async () => {
        const [v, l, b] = await Promise.all([
            supabase.from('varieties').select('id, name').order('sort_order'),
            supabase.from('ingredient_lots')
                .select('id, lot_number, best_before, ingredients(id, name, ean)')
                .eq('is_used_up', false)
                .order('received_on'),
            supabase.from('bake_batches')
                .select('id, code, variety_id, variety_name, baked_on, piece_count, is_closed, bake_batch_lots(lot_id), order_item_variety_batches(order_item_variety_id)')
                .order('batch_number', { ascending: false })
                .limit(300),
        ]);
        const loadError = v.error ?? l.error ?? b.error;
        if (loadError) {
            setError(
                'Die Tabellen für die Rückverfolgung fehlen noch. Führe die Datei rueckverfolgung.sql im Supabase SQL Editor aus. (' +
                loadError.message + ')'
            );
        } else {
            setVarieties(v.data ?? []);
            setLots(toOpenLots(l.data ?? []));
            setBatches((b.data ?? []) as Batch[]);
        }
        setLoading(false);
    }, [supabase]);

    useEffect(() => {
        load();
    }, [load]);

    /**
     * Meist wird mit denselben Packungen weitergebacken wie beim letzten Mal.
     * Deshalb übernimmt die Auswahl einer Sorte die noch offenen Lose der
     * letzten Charge dieser Sorte – solange noch nichts angehakt ist.
     */
    const handleVarietyChange = (id: string) => {
        setVarietyId(id);
        setPrefillHinweis(null);
        if (!id || selectedLots.length > 0) return;
        const letzte = batches.find((b) => b.variety_id === id);
        if (!letzte) return;
        const offen = new Set(lots.map((l) => l.id));
        const uebernommen = letzte.bake_batch_lots.map((x) => x.lot_id).filter((x) => offen.has(x));
        if (uebernommen.length > 0) {
            setSelectedLots(uebernommen);
            setPrefillHinweis(`Zutaten von ${letzte.code} übernommen – bitte prüfen und anpassen.`);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        if (!varietyId) return setError('Bitte wähle die Sorte aus.');
        if (selectedLots.length === 0 && !confirm('Es sind keine Zutatenchargen ausgewählt. Trotzdem anlegen?')) return;

        const stueck = pieceCount.trim() ? parseInt(pieceCount, 10) : null;
        if (stueck !== null && (isNaN(stueck) || stueck <= 0)) return setError('Die Stückzahl muss eine positive Zahl sein.');

        setSaving(true);
        try {
            const { data, error: rpcError } = await supabase.rpc('create_bake_batch', {
                p_variety_id: varietyId,
                p_baked_on: bakedOn || today(),
                p_piece_count: stueck,
                p_notes: notes,
                p_lot_ids: selectedLots,
            });
            if (rpcError) throw rpcError;
            const row = Array.isArray(data) ? data[0] : data;
            if (!row?.batch_id) {
                throw new Error('Die Backcharge wurde nicht gespeichert – vermutlich ist die Anmeldung abgelaufen. Bitte neu anmelden.');
            }
            setCreated({
                id: row.batch_id,
                code: row.batch_code,
                variety: varieties.find((v) => v.id === varietyId)?.name ?? '',
            });
            setVarietyId('');
            setPieceCount('');
            setNotes('');
            setSelectedLots([]);
            setPrefillHinweis(null);
            await load();
            window.scrollTo({ top: 0, behavior: 'smooth' });
        } catch (err) {
            setError('Fehler beim Speichern: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setSaving(false);
        }
    };

    const sichtbar = useMemo(
        () => batches.filter((b) => showClosed || !b.is_closed),
        [batches, showClosed]
    );

    const inputClass =
        'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all bg-white';

    if (loading) return <p className="text-gray-500">Backchargen werden geladen …</p>;

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Backchargen</h1>
            <p className="text-gray-500 mb-8 max-w-2xl">
                Jede Backrunde einer Sorte bekommt eine <strong className="text-gray-700">fortlaufende Losnummer</strong>.
                Die schreibst du auf die Etiketten der Kekse – damit ist jeder Keks bis zur Mehlpackung rückverfolgbar.
            </p>

            {created && (
                <div className="bg-[var(--color-brand-primary)] text-white rounded-3xl p-6 mb-8 text-center">
                    <p className="text-sm opacity-80 mb-1">Auf die Etiketten schreiben ({created.variety}):</p>
                    <p className="font-mono font-black text-6xl md:text-7xl tracking-wider my-2">{created.code}</p>
                    <Link href={`/admin/backchargen/${created.id}`} className="text-sm underline opacity-80 hover:opacity-100">
                        Charge öffnen
                    </Link>
                </div>
            )}

            {error && (
                <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl mb-6 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <form onSubmit={handleSave} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-8 space-y-4">
                <h2 className="text-lg font-bold text-gray-900">Neue Backcharge</h2>
                <div className="grid md:grid-cols-3 gap-3">
                    <label className="block text-sm">
                        <span className="text-gray-600">Sorte *</span>
                        <select className={inputClass} value={varietyId} onChange={(e) => handleVarietyChange(e.target.value)}>
                            <option value="">– bitte wählen –</option>
                            {varieties.map((v) => <option key={v.id} value={v.id}>{v.name}</option>)}
                        </select>
                    </label>
                    <label className="block text-sm">
                        <span className="text-gray-600">Gebacken am</span>
                        <input type="date" className={inputClass} value={bakedOn} onChange={(e) => setBakedOn(e.target.value)} />
                    </label>
                    <label className="block text-sm">
                        <span className="text-gray-600">Stückzahl</span>
                        <input className={inputClass} value={pieceCount} onChange={(e) => setPieceCount(e.target.value)}
                            inputMode="numeric" placeholder="optional" />
                    </label>
                </div>
                {varieties.length === 0 && (
                    <p className="text-sm text-amber-800 bg-amber-50 p-3 rounded-xl">
                        Es sind noch keine Sorten angelegt. Lege sie zuerst unter{' '}
                        <Link href="/admin/varieties" className="font-medium underline">Sorten</Link> an.
                    </p>
                )}

                {prefillHinweis && <p className="text-sm text-[var(--color-brand-accent)] font-medium">{prefillHinweis}</p>}
                <LotPicker lots={lots} selected={selectedLots} onChange={setSelectedLots} />

                <label className="block text-sm">
                    <span className="text-gray-600">Notiz</span>
                    <input className={inputClass} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="optional" />
                </label>

                <button type="submit" disabled={saving}
                    className="w-full md:w-auto bg-[var(--color-brand-primary)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50">
                    {saving ? 'Speichert …' : 'Charge anlegen & Nummer vergeben'}
                </button>
            </form>

            <div className="flex items-center gap-4 mb-4">
                <h2 className="text-lg font-bold text-gray-900">Bisherige Chargen</h2>
                <label className="flex items-center gap-2 text-sm text-gray-600">
                    <input type="checkbox" checked={showClosed} onChange={(e) => setShowClosed(e.target.checked)} />
                    Abgeschlossene zeigen
                </label>
            </div>

            {sichtbar.length === 0 ? (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500">
                    Noch keine offenen Backchargen.
                </div>
            ) : (
                <div className="bg-white rounded-3xl shadow-sm border border-gray-100 divide-y divide-gray-50">
                    {sichtbar.map((b) => (
                        <Link key={b.id} href={`/admin/backchargen/${b.id}`}
                            className="flex items-center gap-4 p-4 hover:bg-gray-50 transition-colors">
                            <span className={`font-mono font-black text-xl w-20 ${b.is_closed ? 'text-gray-400' : 'text-gray-900'}`}>{b.code}</span>
                            <span className="flex-1 min-w-0">
                                <span className="font-medium text-gray-900 block truncate">{b.variety_name}</span>
                                <span className="text-xs text-gray-500">
                                    {format(parseISO(b.baked_on), 'EEE, dd.MM.yyyy', { locale: de })}
                                    {b.piece_count ? ` · ${b.piece_count} Stück` : ''}
                                    {` · ${b.bake_batch_lots.length} Zutatenchargen`}
                                </span>
                            </span>
                            {b.order_item_variety_batches.length > 0 && (
                                <span className="hidden sm:inline-flex items-center gap-1 text-xs bg-green-100 text-green-800 px-2 py-0.5 rounded-full font-bold">
                                    <Tag className="w-3 h-3" /> {b.order_item_variety_batches.length}× verpackt
                                </span>
                            )}
                            {b.is_closed && <span className="text-xs text-gray-400">abgeschlossen</span>}
                            <ChevronRight className="w-5 h-5 text-gray-300" />
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
