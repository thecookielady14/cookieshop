import Link from 'next/link';
import Image from 'next/image';
import { Plus, Pencil, Cookie } from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase-admin';

export const dynamic = 'force-dynamic';

export default async function AdminLines() {
    // Mit Zählern, damit sichtbar ist, was an einer Linie hängt, bevor man sie
    // ausblendet.
    const { data, error } = await supabaseAdmin
        .from('product_lines')
        .select('*, varieties(id), products(id)')
        .order('sort_order');

    if (error) console.error('Linien konnten nicht geladen werden:', error);

    const lines = (data ?? []) as unknown as {
        id: string; slug: string; name: string; tagline: string | null;
        image_url: string | null; sort_order: number; is_active: boolean;
        varieties: { id: string }[] | null; products: { id: string }[] | null;
    }[];

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Produktlinien</h1>
                <Link href="/admin/lines/new"
                    className="flex items-center gap-2 bg-[var(--color-brand-primary)] text-white px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" />
                    Neue Linie
                </Link>
            </div>
            <p className="text-gray-500 mb-8 max-w-2xl">
                Eine Linie bündelt Sorten und Verkaufsartikel und bekommt im Shop eine eigene
                Seite mit Bild und Text. Hier legst du auch das Bild fest, das auf der
                Shop-Übersicht erscheint.
            </p>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {lines.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">Noch keine Linien angelegt.</div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 text-xs uppercase tracking-wider text-gray-500">
                            <tr>
                                <th className="p-4 font-semibold">Linie</th>
                                <th className="p-4 font-semibold">Adresse</th>
                                <th className="p-4 font-semibold">Inhalt</th>
                                <th className="p-4 font-semibold">Reihenfolge</th>
                                <th className="p-4 font-semibold">Status</th>
                                <th className="p-4 font-semibold text-right">Aktionen</th>
                            </tr>
                        </thead>
                        <tbody>
                            {lines.map((line) => (
                                <tr key={line.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-16 aspect-[4/3] rounded-lg bg-gray-100 overflow-hidden relative flex-shrink-0">
                                                {line.image_url ? (
                                                    <Image src={line.image_url} alt="" fill className="object-cover" sizes="64px" />
                                                ) : (
                                                    <span className="absolute inset-0 flex items-center justify-center">
                                                        <Cookie className="w-5 h-5 text-gray-300" />
                                                    </span>
                                                )}
                                            </div>
                                            <div className="min-w-0">
                                                <span className="font-bold text-gray-900 block truncate">{line.name}</span>
                                                {line.tagline && (
                                                    <span className="text-xs text-gray-500 block truncate">{line.tagline}</span>
                                                )}
                                                {!line.image_url && (
                                                    <span className="text-xs text-amber-700">kein Bild hinterlegt</span>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-4 text-gray-600 text-sm whitespace-nowrap">/shop/{line.slug}</td>
                                    <td className="p-4 text-gray-600 text-sm whitespace-nowrap">
                                        {(line.varieties ?? []).length} Sorten · {(line.products ?? []).length} Artikel
                                    </td>
                                    <td className="p-4 text-gray-600">{line.sort_order}</td>
                                    <td className="p-4">
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap ${
                                            line.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                            {line.is_active ? 'Sichtbar' : 'Ausgeblendet'}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <Link href={`/admin/lines/${line.id}/edit`}
                                            aria-label={`${line.name} bearbeiten`}
                                            className="inline-block p-2 border border-gray-200 rounded-lg hover:bg-white transition-colors">
                                            <Pencil className="w-4 h-4 text-gray-500" />
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            <p className="text-sm text-gray-500 mt-6">
                Löschen ist bewusst nicht vorgesehen: an einer Linie hängen Sorten und Artikel.
                Nimm den Haken bei &bdquo;Im Shop sichtbar&ldquo; heraus, um sie auszublenden.
            </p>
        </div>
    );
}
