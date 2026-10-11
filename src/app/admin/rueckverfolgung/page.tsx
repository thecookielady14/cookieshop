'use client';

import { useState } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { Search, AlertTriangle, ArrowRight, Users } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

interface OrderRef {
    id: string;
    order_number: number | null;
    customer_name: string | null;
    customer_email: string | null;
    created_at: string;
}

interface BatchRef {
    id: string;
    code: string;
    variety_name: string;
    baked_on: string;
    orders: OrderRef[];
}

interface LotHit {
    id: string;
    lot_number: string;
    best_before: string | null;
    ingredient: string;
    supplier: string | null;
    batches: BatchRef[];
}

interface OrderHit {
    order: OrderRef;
    varieties: {
        variety_name: string;
        batches: { id: string; code: string; lots: { ingredient: string; lot_number: string; supplier: string | null }[] }[];
    }[];
}

const datum = (d: string | null) => (d ? format(parseISO(d), 'dd.MM.yyyy', { locale: de }) : '—');

const ORDER_SELECT = 'id, order_number, customer_name, customer_email, created_at';
const BATCH_WITH_ORDERS = `id, code, variety_name, baked_on,
    order_item_variety_batches(order_item_varieties(order_items(orders(${ORDER_SELECT}))))`;

/** Bestellungen aus der verschachtelten Antwort ziehen, doppelte entfernen. */
function ordersOf(batch: any): OrderRef[] {
    const map = new Map<string, OrderRef>();
    for (const x of batch.order_item_variety_batches ?? []) {
        const o = x.order_item_varieties?.order_items?.orders;
        if (o) map.set(o.id, o);
    }
    return [...map.values()].sort((a, b) => (b.order_number ?? 0) - (a.order_number ?? 0));
}

function toBatchRef(b: any): BatchRef {
    return { id: b.id, code: b.code, variety_name: b.variety_name, baked_on: b.baked_on, orders: ordersOf(b) };
}

/**
 * Rückverfolgung in beide Richtungen, für den Ernstfall:
 * - Los einer Zutat (oder Zutatenname) → Backchargen → Kunden (Rückruf)
 * - Losnummer L042 → Zutaten und Kunden
 * - Bestellnummer → Backchargen → Zutatenlose (Reklamation)
 */
export default function Rueckverfolgung() {
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [query, setQuery] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searched, setSearched] = useState<string | null>(null);
    const [batchHits, setBatchHits] = useState<BatchRef[]>([]);
    const [lotHits, setLotHits] = useState<LotHit[]>([]);
    const [orderHits, setOrderHits] = useState<OrderHit[]>([]);

    const search = async (e: React.FormEvent) => {
        e.preventDefault();
        // Zeichen entfernen, die im PostgREST-Filter eine Bedeutung haben.
        const q = query.trim().replace(/[,()*%\\]/g, '');
        if (!q) return;
        setLoading(true);
        setError(null);

        try {
            const batchMatch = q.match(/^l\s*0*(\d+)$/i);
            const orderMatch = q.match(/^#?\s*(\d+)$/);

            // 1. Backcharge per Losnummer L042
            const batchPromise = batchMatch
                ? supabase.from('bake_batches').select(BATCH_WITH_ORDERS).eq('batch_number', parseInt(batchMatch[1], 10))
                : null;

            // 2. Zutatenlose: Los-Nummer oder Name der Zutat
            const { data: ings, error: ingError } = await supabase
                .from('ingredients').select('id').ilike('name', `%${q}%`);
            if (ingError) throw ingError;
            const ingIds = (ings ?? []).map((i) => i.id);
            const lotFilter = ingIds.length > 0
                ? `lot_number.ilike.%${q}%,ingredient_id.in.(${ingIds.join(',')})`
                : `lot_number.ilike.%${q}%`;
            const lotPromise = supabase.from('ingredient_lots')
                .select(`id, lot_number, best_before, ingredients(name, supplier), bake_batch_lots(bake_batches(${BATCH_WITH_ORDERS}))`)
                .or(lotFilter)
                .order('received_on', { ascending: false })
                .limit(50);

            // 3. Bestellung per Bestellnummer
            const orderPromise = orderMatch
                ? supabase.from('orders')
                    .select(`${ORDER_SELECT}, order_items(order_item_varieties(variety_name,
                        order_item_variety_batches(bake_batches(id, code,
                            bake_batch_lots(ingredient_lots(lot_number, ingredients(name, supplier)))))))`)
                    .eq('order_number', parseInt(orderMatch[1], 10))
                : null;

            const [b, l, o] = await Promise.all([batchPromise, lotPromise, orderPromise]);
            const err = b?.error ?? l.error ?? o?.error;
            if (err) throw err;

            setBatchHits(((b?.data ?? []) as any[]).map(toBatchRef));

            setLotHits(((l.data ?? []) as any[]).map((lot) => ({
                id: lot.id,
                lot_number: lot.lot_number,
                best_before: lot.best_before,
                ingredient: lot.ingredients?.name ?? '?',
                supplier: lot.ingredients?.supplier ?? null,
                batches: (lot.bake_batch_lots ?? [])
                    .map((x: any) => x.bake_batches).filter(Boolean).map(toBatchRef),
            })));

            setOrderHits(((o?.data ?? []) as any[]).map((order) => ({
                order,
                varieties: (order.order_items ?? []).flatMap((i: any) => i.order_item_varieties ?? []).map((v: any) => ({
                    variety_name: v.variety_name,
                    batches: (v.order_item_variety_batches ?? []).map((x: any) => x.bake_batches).filter(Boolean).map((bb: any) => ({
                        id: bb.id,
                        code: bb.code,
                        lots: (bb.bake_batch_lots ?? []).map((x: any) => x.ingredient_lots).filter(Boolean).map((il: any) => ({
                            ingredient: il.ingredients?.name ?? '?',
                            supplier: il.ingredients?.supplier ?? null,
                            lot_number: il.lot_number,
                        })),
                    })),
                })),
            })));

            setSearched(q);
        } catch (err) {
            const msg = err instanceof Error ? err.message : (err as { message?: string })?.message ?? String(err);
            setError('Suche fehlgeschlagen: ' + msg);
        } finally {
            setLoading(false);
        }
    };

    const nichts = searched && batchHits.length === 0 && lotHits.length === 0 && orderHits.length === 0;

    return (
        <div className="max-w-4xl">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">Rückverfolgung</h1>
            <p className="text-gray-500 mb-8 max-w-2xl">
                Für den Ernstfall: Gib eine <strong className="text-gray-700">Los-Nummer einer Zutat</strong> (Rückruf beim
                Lieferanten), eine <strong className="text-gray-700">Losnummer wie L042</strong> (vom Keks-Etikett) oder
                eine <strong className="text-gray-700">Bestellnummer</strong> (Reklamation) ein.
            </p>

            <form onSubmit={search} className="flex gap-2 mb-8">
                <div className="relative flex-1">
                    <Search className="w-5 h-5 text-gray-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                        type="search"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        placeholder="z. B. L042, 1023, Dinkelmehl oder Los 4711"
                        aria-label="Suchbegriff"
                        className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 bg-white outline-none focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)]"
                    />
                </div>
                <button type="submit" disabled={loading}
                    className="bg-[var(--color-brand-primary)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 disabled:opacity-50">
                    {loading ? 'Sucht …' : 'Suchen'}
                </button>
            </form>

            {error && (
                <div className="flex gap-3 bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl mb-6 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>{error}</p>
                </div>
            )}

            {nichts && (
                <div className="bg-white rounded-3xl border border-gray-100 p-12 text-center text-gray-500">
                    Nichts gefunden zu „{searched}“.
                </div>
            )}

            <div className="space-y-6">
                {batchHits.map((b) => (
                    <section key={b.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Backcharge</p>
                        <div className="flex items-center gap-3 mb-3">
                            <span className="font-mono font-black text-3xl whitespace-nowrap">{b.code}</span>
                            <span className="text-gray-700">{b.variety_name}, gebacken am {datum(b.baked_on)}</span>
                        </div>
                        <OrderList orders={b.orders} />
                        <Link href={`/admin/backchargen/${b.id}`}
                            className="inline-flex items-center gap-1 text-sm font-medium text-[var(--color-brand-primary)] hover:underline mt-3">
                            Zutaten dieser Charge ansehen <ArrowRight className="w-4 h-4" />
                        </Link>
                    </section>
                ))}

                {lotHits.map((lot) => {
                    const kunden = new Map<string, OrderRef>();
                    lot.batches.forEach((b) => b.orders.forEach((o) => kunden.set(o.id, o)));
                    return (
                        <section key={lot.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                            <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Zutatencharge</p>
                            <p className="text-lg font-bold text-gray-900">
                                {lot.ingredient} · <span className="font-mono">{lot.lot_number}</span>
                            </p>
                            <p className="text-sm text-gray-500 mb-4">
                                {lot.supplier ?? 'kein Lieferant hinterlegt'} · MHD {datum(lot.best_before)}
                            </p>
                            {lot.batches.length === 0 ? (
                                <p className="text-sm text-gray-400 italic">Noch in keiner Backcharge verbacken.</p>
                            ) : (
                                <>
                                    <p className="text-sm font-semibold text-gray-700 mb-2">Verbacken in:</p>
                                    <div className="flex flex-wrap gap-2 mb-4">
                                        {lot.batches.map((b) => (
                                            <Link key={b.id} href={`/admin/backchargen/${b.id}`}
                                                className="bg-[var(--color-brand-secondary)] border border-[var(--color-brand-accent)]/40 px-3 py-1 rounded-full text-sm hover:bg-amber-100">
                                                <span className="font-mono font-bold">{b.code}</span> {b.variety_name} · {datum(b.baked_on)}
                                            </Link>
                                        ))}
                                    </div>
                                    <p className="text-sm font-semibold text-gray-700 mb-2 flex items-center gap-1">
                                        <Users className="w-4 h-4" /> Betroffene Bestellungen ({kunden.size})
                                    </p>
                                    <OrderList orders={[...kunden.values()]} />
                                </>
                            )}
                        </section>
                    );
                })}

                {orderHits.map(({ order, varieties }) => (
                    <section key={order.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
                        <p className="text-xs uppercase tracking-wide text-gray-400 mb-1">Bestellung</p>
                        <p className="text-lg font-bold text-gray-900 mb-4">
                            #{order.order_number} · {order.customer_name || order.customer_email || 'Ohne Namen'} · {datum(order.created_at.substring(0, 10))}
                        </p>
                        {varieties.length === 0 ? (
                            <p className="text-sm text-gray-400 italic">Keine Sorten erfasst.</p>
                        ) : (
                            <ul className="space-y-3">
                                {varieties.map((v, i) => (
                                    <li key={i} className="text-sm">
                                        <span className="font-semibold text-gray-900">{v.variety_name}</span>
                                        {v.batches.length === 0 ? (
                                            <span className="text-amber-700"> – beim Packen keine Charge zugeordnet</span>
                                        ) : v.batches.map((b) => (
                                            <div key={b.id} className="ml-4 mt-1">
                                                <Link href={`/admin/backchargen/${b.id}`} className="font-mono font-bold hover:underline">{b.code}</Link>
                                                <span className="text-gray-500">
                                                    {': '}
                                                    {b.lots.length === 0
                                                        ? 'keine Zutatenchargen erfasst'
                                                        : b.lots.map((l) => `${l.ingredient} (Los ${l.lot_number}${l.supplier ? `, ${l.supplier}` : ''})`).join(' · ')}
                                                </span>
                                            </div>
                                        ))}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </section>
                ))}
            </div>
        </div>
    );
}

function OrderList({ orders }: { orders: OrderRef[] }) {
    if (orders.length === 0) {
        return <p className="text-sm text-gray-400 italic">Noch keiner Bestellung zugeordnet.</p>;
    }
    return (
        <ul className="divide-y divide-gray-50 text-sm">
            {orders.map((o) => (
                <li key={o.id} className="py-1.5 flex flex-wrap gap-x-4">
                    <span className="font-bold text-gray-900">#{o.order_number ?? o.id.substring(0, 8)}</span>
                    <span className="text-gray-700">{o.customer_name || 'Ohne Namen'}</span>
                    <span className="text-gray-500">{o.customer_email ?? 'keine E-Mail'}</span>
                    <span className="text-gray-400 ml-auto">{datum(o.created_at.substring(0, 10))}</span>
                </li>
            ))}
        </ul>
    );
}
