'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Pencil, Trash2, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { assertWritten } from '@/lib/admin-write';

interface VarietyRow {
    id: string;
    name: string;
    legal_name: string | null;
    piece_weight_grams: number | null;
    image_url: string | null;
    is_available: boolean;
    line_name: string;
    used_by: { id: string; name: string; is_available: boolean }[];
}

export default function ClientVarietyTable({ initial }: { initial: VarietyRow[] }) {
    const [rows, setRows] = useState(initial);
    const [busyId, setBusyId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const handleDelete = async (row: VarietyRow) => {
        setError(null);

        if (row.used_by.length > 0) {
            setError(
                `„${row.name}" steckt noch in ${row.used_by.length === 1 ? 'einem Produkt' : row.used_by.length + ' Produkten'}: ` +
                row.used_by.map((p) => p.name).join(', ') +
                '. Nimm die Sorte dort erst heraus.'
            );
            return;
        }
        if (!confirm(`„${row.name}" wirklich löschen?`)) return;

        setBusyId(row.id);
        const { data: deleted, error: deleteError } = await supabase
            .from('varieties').delete().eq('id', row.id).select('id');
        setBusyId(null);

        if (deleteError) {
            setError('Löschen nicht möglich: ' + deleteError.message);
            return;
        }
        try {
            assertWritten(deleted, `Die Sorte „${row.name}"`);
        } catch (e) {
            setError(e instanceof Error ? e.message : String(e));
            return;
        }
        setRows((r) => r.filter((x) => x.id !== row.id));
    };

    if (rows.length === 0) {
        return (
            <div className="p-12 text-center">
                <p className="text-gray-500 mb-6">
                    Noch keine Sorten angelegt. Eine Sorte ist das Rezept – Kartons und Tüten
                    werden anschließend daraus zusammengestellt.
                </p>
                <Link href="/admin/varieties/new"
                    className="bg-[var(--color-brand-primary)] text-white px-6 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                    Erste Sorte anlegen
                </Link>
            </div>
        );
    }

    return (
        <>
            {error && (
                <div role="alert" className="flex gap-3 bg-amber-50 border-b border-amber-200 text-amber-900 p-4 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}
            <table className="w-full text-left">
                <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                    <tr>
                        <th className="p-4 font-semibold">Sorte</th>
                        <th className="p-4 font-semibold">Linie</th>
                        <th className="p-4 font-semibold">Gewicht</th>
                        <th className="p-4 font-semibold">Status</th>
                        <th className="p-4 font-semibold">Verwendet in</th>
                        <th className="p-4 font-semibold text-right">Aktionen</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map((row) => (
                        <tr key={row.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                                        {row.image_url
                                            ? <Image src={row.image_url} alt="" fill className="object-cover" sizes="40px" />
                                            : <span className="absolute inset-0 flex items-center justify-center text-lg">🍪</span>}
                                    </div>
                                    <div className="min-w-0">
                                        <span className="font-bold text-gray-900 block truncate">{row.name}</span>
                                        {row.legal_name && (
                                            <span className="text-xs text-gray-500 block truncate">{row.legal_name}</span>
                                        )}
                                    </div>
                                </div>
                            </td>
                            <td className="p-4 text-gray-600">{row.line_name}</td>
                            <td className="p-4 text-gray-600 whitespace-nowrap">
                                {row.piece_weight_grams !== null ? `${row.piece_weight_grams} g` : '—'}
                            </td>
                            <td className="p-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                    row.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {row.is_available ? 'Freigegeben' : 'Entwurf'}
                                </span>
                            </td>
                            <td className="p-4 text-sm text-gray-600">
                                {row.used_by.length === 0
                                    ? <span className="text-gray-400">—</span>
                                    : row.used_by.map((p) => p.name).join(', ')}
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <Link href={`/admin/varieties/${row.id}/edit`}
                                        aria-label={`${row.name} bearbeiten`}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                                        <Pencil className="w-4 h-4 text-gray-500" />
                                    </Link>
                                    <button onClick={() => handleDelete(row)} disabled={busyId === row.id}
                                        aria-label={`${row.name} löschen`}
                                        className="p-2 border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-200 transition-colors disabled:opacity-50">
                                        <Trash2 className="w-4 h-4 text-gray-500" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}
