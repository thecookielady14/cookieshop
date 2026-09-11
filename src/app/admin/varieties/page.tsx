import Link from 'next/link';
import { Plus } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';
import ClientVarietyTable from './ClientVarietyTable';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

export default async function AdminVarieties() {
    // Mit den Produkten, in denen die Sorte steckt: nur so sieht man vor dem
    // Sperren oder Löschen, was davon betroffen wäre.
    const { data, error } = await supabase
        .from('varieties')
        .select('*, product_lines(name), product_varieties(products(id, name, is_available))')
        .order('sort_order');

    if (error) console.error('Sorten konnten nicht geladen werden:', error);

    const rows = (data ?? []).map((v: any) => ({
        id: v.id,
        name: v.name,
        legal_name: v.legal_name ?? null,
        piece_weight_grams: v.piece_weight_grams ?? null,
        image_url: v.image_url ?? null,
        is_available: v.is_available === true,
        line_name: v.product_lines?.name ?? '—',
        used_by: (v.product_varieties ?? [])
            .map((pv: any) => pv.products)
            .filter(Boolean)
            .map((p: any) => ({ id: p.id, name: p.name, is_available: p.is_available === true })),
    }));

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Sorten</h1>
                <Link href="/admin/varieties/new"
                    className="flex items-center gap-2 bg-[var(--color-brand-primary)] text-white px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
                    <Plus className="w-4 h-4" />
                    Neue Sorte
                </Link>
            </div>
            <p className="text-gray-500 mb-8">
                Hier liegen die Rezepte mit allen Pflichtangaben. Eine Sorte wird nie einzeln
                verkauft – sie steckt in Kartons, Tüten und Packungen.
            </p>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <ClientVarietyTable initial={rows} />
            </div>
        </div>
    );
}
