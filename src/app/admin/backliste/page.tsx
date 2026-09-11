import Link from 'next/link';
import { ChefHat, Package } from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

/**
 * Was muss diese Woche gebacken werden?
 *
 * Zählt über alle offenen und bezahlten Bestellungen zusammen, wie oft jede
 * Sorte vorkommt. Bei Produktion auf Bestellung ist das die Liste, nach der
 * tatsächlich gearbeitet wird – sie fällt aus order_item_varieties praktisch
 * als Nebenprodukt ab.
 *
 * Versendete und stornierte Bestellungen bleiben draußen: die sind erledigt.
 */

interface Row {
    quantity: number;
    variety_name: string;
    order_items: {
        quantity: number;
        orders: { id: string; order_number: number | null; status: string; created_at: string } | null;
    } | null;
}

export default async function Backliste() {
    const { data, error } = await supabaseAdmin
        .from('order_item_varieties')
        .select('quantity, variety_name, order_items(quantity, orders(id, order_number, status, created_at))');

    if (error) console.error('Backliste konnte nicht geladen werden:', error);

    const rows = ((data ?? []) as unknown as Row[]).filter(
        (r) => r.order_items?.orders && ['pending', 'paid'].includes(r.order_items.orders.status)
    );

    // Menge je Sorte = Stück je Karton × Anzahl Kartons
    const perVariety = new Map<string, number>();
    const orderIds = new Set<string>();
    let totalPieces = 0;

    for (const row of rows) {
        const boxes = row.order_items?.quantity ?? 1;
        const pieces = row.quantity * boxes;
        perVariety.set(row.variety_name, (perVariety.get(row.variety_name) ?? 0) + pieces);
        totalPieces += pieces;
        if (row.order_items?.orders) orderIds.add(row.order_items.orders.id);
    }

    const sorted = [...perVariety.entries()].sort((a, b) => b[1] - a[1]);
    const maxCount = sorted[0]?.[1] ?? 0;

    const oldest = rows
        .map((r) => r.order_items?.orders?.created_at)
        .filter(Boolean)
        .sort()[0];

    return (
        <div className="max-w-3xl">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Backliste</h1>
            <p className="text-gray-500 mb-8 max-w-2xl">
                Alle offenen und bezahlten Bestellungen zusammengezählt – so oft brauchst du jede
                Sorte. Versendete und stornierte Bestellungen sind nicht dabei.
            </p>

            {sorted.length === 0 ? (
                <div className="bg-white p-12 rounded-3xl shadow-sm border border-gray-100 text-center">
                    <ChefHat className="w-12 h-12 mx-auto text-gray-300 mb-4" />
                    <p className="text-gray-500">
                        Zurzeit ist nichts zu backen – es gibt keine offenen Bestellungen.
                    </p>
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500">Kekse insgesamt</p>
                            <p className="text-2xl font-bold text-gray-900">{totalPieces}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500">Bestellungen</p>
                            <p className="text-2xl font-bold text-gray-900">{orderIds.size}</p>
                        </div>
                        <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100">
                            <p className="text-sm text-gray-500">Älteste offen seit</p>
                            <p className="text-2xl font-bold text-gray-900">
                                {oldest ? format(new Date(oldest), 'dd.MM.', { locale: de }) : '—'}
                            </p>
                        </div>
                    </div>

                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-100 flex items-center gap-2">
                            <ChefHat className="w-5 h-5 text-[var(--color-brand-primary)]" />
                            <h2 className="text-xl font-bold">Nach Sorte</h2>
                        </div>
                        <ul>
                            {sorted.map(([name, count]) => (
                                <li key={name} className="px-6 py-4 border-b border-gray-50 last:border-0">
                                    <div className="flex items-center justify-between gap-4 mb-2">
                                        <span className="font-medium text-gray-900">{name}</span>
                                        <span className="font-bold text-gray-900 whitespace-nowrap">
                                            {count} {count === 1 ? 'Keks' : 'Kekse'}
                                        </span>
                                    </div>
                                    {/* Balken, damit die Verhältnisse auf einen Blick stimmen */}
                                    <div className="h-2 rounded-full bg-gray-100 overflow-hidden">
                                        <div
                                            className="h-full bg-[var(--color-brand-primary)]"
                                            style={{ width: `${maxCount > 0 ? (count / maxCount) * 100 : 0}%` }}
                                        />
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <p className="text-sm text-gray-500 mt-6 flex items-start gap-2">
                        <Package className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            Welche Bestellung welche Sorten enthält, steht in der{' '}
                            <Link href="/admin/orders" className="text-[var(--color-brand-primary)] underline">
                                Bestellübersicht
                            </Link>.
                        </span>
                    </p>
                </>
            )}
        </div>
    );
}
