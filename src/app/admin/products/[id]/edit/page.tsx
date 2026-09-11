import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import ProductForm, { EMPTY_PRODUCT, type ProductFormValues } from '../../ProductForm';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

const text = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data } = await supabase
        .from('products')
        .select('*, product_varieties(variety_id, quantity)')
        .eq('id', id)
        .maybeSingle();

    if (!data) {
        return (
            <div className="max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Produkt nicht gefunden</h1>
                <p className="text-gray-500 mb-8">Dieses Produkt gibt es nicht mehr.</p>
                <Link href="/admin/products" className="text-[var(--color-brand-primary)] underline">
                    Zurück zur Übersicht
                </Link>
            </div>
        );
    }

    const initial: ProductFormValues = {
        ...EMPTY_PRODUCT,
        id: data.id,
        line_id: data.line_id ?? '',
        name: data.name ?? '',
        legal_name: text(data.legal_name),
        description: text(data.description),
        price: text(data.price),
        kind: data.kind === 'configurable' ? 'configurable' : 'fixed',
        piece_count: text(data.piece_count),
        weight_grams: text(data.weight_grams),
        consumer_info: text(data.consumer_info),
        image_url: text(data.image_url),
        sort_order: text(data.sort_order ?? 0),
        is_bestseller: data.is_bestseller === true,
        is_available: data.is_available === true,
        varieties: (data.product_varieties ?? []).map((pv: { variety_id: string; quantity: number }) => ({
            variety_id: pv.variety_id,
            quantity: pv.quantity,
        })),
    };

    return <ProductForm initial={initial} />;
}
