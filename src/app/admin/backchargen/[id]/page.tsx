'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { ArrowLeft, AlertTriangle, Pencil, Trash2, Lock, LockOpen } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { assertWritten } from '@/lib/admin-write';
import LotPicker, { toOpenLots, type OpenLot } from '../LotPicker';

interface BatchDetail {
    id: string;
    code: string;
    variety_name: string;
    baked_on: string;
    piece_count: number | null;
    is_closed: boolean;
    notes: string | null;
    bake_batch_lots: {
        ingredient_lots: {
            id: string;
            lot_number: string;
            best_before: string | null;
            ingredients: { id: string; name: string; supplier: string | null; ean: string | null } | null;
        } | null;
    }[];
    order_item_variety_batches: {
        order_item_varieties: {
            variety_name: string;
            quantity: number;
            order_items: {
                quantity: number;
                orders: { id: string; order_number: number | null; customer_name: string | null; customer_email: string | null; created_at: string; status: string } | null;
            } | null;
        } | null;
    }[];
}

const datum = (d: string | null) => (d ? format(parseISO(d), 'dd.MM.yyyy', { locale: de }) : '—');

export default function BackchargeDetail() {
    const { id } = useParams<{ id: string }>();
    const router = useRouter();
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [batch, setBatch] = useState<BatchDetail | null>(null);
    const [openLots, setOpenLots] = useState<OpenLot[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [selected, setSelected] = useState<string[]>([]);
    const [busy, setBusy] = useState(false);

    const load = useCallback(async () => {
        const [b, l] = await Promise.all([
            supabase.from('bake_batches')
                .select(`id, code, variety_name, baked_on, piece_count, is_closed, notes,
                    bake_batch_lots(ingredient_lots(id, lot_number, best_before, ingredients(id, name, supplier, ean))),
                    order_item_variety_batches(order_item_varieties(variety_name, quantity,
                        order_items(quantity, orders(id, order_number, customer_name, customer_email, created_at, status))))`)
                .eq('id', id)
                .maybeSingle(),
            supabase.from('ingredient_lots')
                .select('id, lot_number, best_before, ingredients(id, name, ean)')
                .eq('is_used_up', false)
                .order('received_on'),
        ]);
        if (b.error || l.error) {
            setError('Laden fehlgeschlagen: ' + (b.error ?? l.error)!.message);
        } else if (!b.data) {
            setError('Diese Backcharge gibt es nicht (mehr).');
        } else {
            setBatch(b.data as unknown as BatchDetail);
            setOpenLots(toOpenLots(l.data ?? []));
        }
        setLoading(false);
    }, [supabase, id]);

    useEffect(() => {
        load();
    }, [load]);

    if (loading) return <p className="text-gray-500">Backcharge wird geladen …</p>;
    if (!batch) {
        return (
            <div className="max-w-3xl">
                <Link href="/admin/backchargen" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
                    <ArrowLeft className="w-4 h-4" /> Alle Backchargen
                </Link>
                <p className="text-amber-900 bg-amber-50 p-4 rounded-2xl">{error}</p>
            </div>
        );
    }

    const lots = batch.bake_batch_lots.map((x) => x.ingredient_lots).filter((x): x is NonNullable<typeof x> => !!x);
    const orders = batch.order_item_variety_batches
        .map((x) => x.order_item_varieties)
        .filter((x): x is NonNullable<typeof x> => !!x?.order_items?.orders);

    // Für die Bearbeitung: offene Lose plus die schon zugeordneten, auch wenn
    // diese inzwischen als aufgebraucht markiert sind.
    const pickerLots: OpenLot[] = [
        ...openLots,
        ...lots
            .filter((l) => l.ingredients && !openLots.some((o) => o.id === l.id))
            .map((l) => ({
                id: l.id,
                lot_number: l.lot_number,
                best_before: l.best_before,
                ingredient_id: l.ingredients!.id,
                ingredient_name: l.ingredients!.name,
                ingredient_ean: l.ingredients!.ean,
            })),
    ];

    const startEdit = () => {
        setSelected(lots.map((l) => l.id));
        setEditing(true);
    };

    const saveLots = async () => {
        setError(null);
        setBusy(true);
        try {
            const vorher = new Set(lots.map((l) => l.id));
            const neu = selected.filter((x) => !vorher.has(x));
            const weg = [...vorher].filter((x) => !selected.includes(x));
            if (neu.length > 0) {
                const { data, error: e } = await supabase.from('bake_batch_lots')
                    .insert(neu.map((lot_id) => ({ batch_id: batch.id, lot_id }))).select('lot_id');
                if (e) throw e;
                assertWritten(data, 'Die Zutatenzuordnung');
            }
            if (weg.length > 0) {
                const { data, error: e } = await supabase.from('bake_batch_lots')
                    .delete().eq('batch_id', batch.id).in('lot_id', weg).select('lot_id');
                if (e) throw e;
                assertWritten(data, 'Die Zutatenzuordnung');
            }
            setEditing(false);
            await load();
        } catch (err) {
            setError('Fehler beim Speichern: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setBusy(false);
        }
    };

    const toggleClosed = async () => {
        setError(null);
        const { data, error: e } = await supabase.from('bake_batches')
            .update({ is_closed: !batch.is_closed }).eq('id', batch.id).select('id');
        try {
            if (e) throw e;
            assertWritten(data, 'Die Änderung');
            setBatch({ ...batch, is_closed: !batch.is_closed });
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    const deleteBatch = async () => {
        setError(null);
        if (orders.length > 0) {
            setError('Diese Charge ist bereits Bestellungen zugeordnet und muss für die Rückverfolgung erhalten bleiben.');
            return;
        }
        if (!confirm(`${batch.code} wirklich löschen? Die Nummer wird nicht erneut vergeben.`)) return;
        const { data, error: e } = await supabase.from('bake_batches').delete().eq('id', batch.id).select('id');
        try {
            if (e) throw e;
            assertWritten(data, 'Das Löschen');
            router.push('/admin/backchargen');
        } catch (err) {
            setError(err instanceof Error ? err.message : String(err));
        }
    };

    return (
        <div className="max-w-3xl">
            <Link href="/admin/backchargen" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-900 mb-6">
                <ArrowLeft className="w-4 h-4" /> Alle Backchargen
            </Link>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6 flex flex-col md:flex-row md:items-center gap-4">
                <span className="font-mono font-black text-5xl text-gray-900">{batch.code}</span>
                <div className="flex-1">
                    <span className="block text-xl font-bold text-gray-900">{batch.variety_name}</span>
                    <span className="text-sm text-gray-500">
                        Gebacken am {datum(batch.baked_on)}
                        {batch.piece_count ? ` · ${batch.piece_count} Stück` : ''}
                        {batch.is_closed ? ' · abgeschlossen' : ''}
                    </span>
                    {batch.notes && <p className="text-sm text-gray-600 mt-1">{batch.notes}</p>}
                </div>
                <div className="flex gap-2">
                    <button type="button" onClick={toggleClosed}
                        title={batch.is_closed ? 'Wieder öffnen' : 'Abschließen: alle Kekse sind verpackt'}
                        className="flex items-center gap-1 px-3 py-2 rounded-xl border border-gray-200 text-sm text-gray-700 hover:bg-gray-50">
                        {batch.is_closed ? <LockOpen className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                        {batch.is_closed ? 'Öffnen' : 'Abschließen'}
                    </button>
                    {orders.length === 0 && (
                        <button type="button" onClick={deleteBatch} aria-label="Charge löschen"
                            className="p-2 rounded-xl border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50">
                            <Trash2 className="w-4 h-4" />
                        </button>
                    )}
                </div>
            </div>

            {error && (
                <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl mb-6 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-bold text-gray-900">Zutatenchargen</h2>
                    {!editing && (
                        <button type="button" onClick={startEdit}
                            className="flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900">
                            <Pencil className="w-4 h-4" /> Bearbeiten
                        </button>
                    )}
                </div>
                {editing ? (
                    <div className="space-y-4">
                        <LotPicker lots={pickerLots} selected={selected} onChange={setSelected} />
                        <div className="flex gap-2">
                            <button type="button" onClick={saveLots} disabled={busy}
                                className="bg-[var(--color-brand-primary)] text-white px-5 py-2.5 rounded-xl font-bold hover:opacity-90 disabled:opacity-50">
                                {busy ? 'Speichert …' : 'Speichern'}
                            </button>
                            <button type="button" onClick={() => setEditing(false)}
                                className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                                Abbrechen
                            </button>
                        </div>
                    </div>
                ) : lots.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">Keine Zutatenchargen zugeordnet.</p>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-100">
                                <th className="py-2 font-semibold">Zutat</th>
                                <th className="py-2 font-semibold">Los</th>
                                <th className="py-2 font-semibold">MHD</th>
                                <th className="py-2 font-semibold hidden sm:table-cell">Lieferant</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lots
                                .sort((a, b) => (a.ingredients?.name ?? '').localeCompare(b.ingredients?.name ?? '', 'de'))
                                .map((l) => (
                                    <tr key={l.id} className="border-b border-gray-50">
                                        <td className="py-2 text-gray-900">{l.ingredients?.name}</td>
                                        <td className="py-2 font-mono">{l.lot_number}</td>
                                        <td className="py-2 text-gray-600">{datum(l.best_before)}</td>
                                        <td className="py-2 text-gray-600 hidden sm:table-cell">{l.ingredients?.supplier ?? '—'}</td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                )}
            </section>

            <section className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                <h2 className="text-lg font-bold text-gray-900 mb-4">Ausgeliefert in</h2>
                {orders.length === 0 ? (
                    <p className="text-sm text-gray-400 italic">
                        Noch keiner Bestellung zugeordnet. Das geschieht beim Packen unter „Bestellungen“.
                    </p>
                ) : (
                    <ul className="divide-y divide-gray-50">
                        {orders.map((oiv, i) => {
                            const o = oiv.order_items!.orders!;
                            return (
                                <li key={i} className="py-2 flex flex-wrap gap-x-4 text-sm">
                                    <span className="font-bold text-gray-900">#{o.order_number ?? o.id.substring(0, 8)}</span>
                                    <span className="text-gray-700">{o.customer_name || o.customer_email || 'Ohne Namen'}</span>
                                    <span className="text-gray-500">{oiv.quantity * (oiv.order_items!.quantity ?? 1)}× {oiv.variety_name}</span>
                                    <span className="text-gray-400 ml-auto">{format(parseISO(o.created_at), 'dd.MM.yyyy', { locale: de })}</span>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>
        </div>
    );
}
