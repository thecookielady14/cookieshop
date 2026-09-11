import Link from 'next/link';
import { supabaseAdmin } from '@/lib/supabase-admin';
import LineForm, { EMPTY_LINE, type LineFormValues } from '../../LineForm';

export const dynamic = 'force-dynamic';

const text = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export default async function EditLine({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data } = await supabaseAdmin.from('product_lines').select('*').eq('id', id).maybeSingle();

    if (!data) {
        return (
            <div className="max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Linie nicht gefunden</h1>
                <p className="text-gray-500 mb-8">Diese Linie gibt es nicht mehr.</p>
                <Link href="/admin/lines" className="text-[var(--color-brand-primary)] underline">
                    Zurück zur Übersicht
                </Link>
            </div>
        );
    }

    const initial: LineFormValues = {
        ...EMPTY_LINE,
        id: data.id,
        slug: text(data.slug),
        name: text(data.name),
        tagline: text(data.tagline),
        description: text(data.description),
        image_url: text(data.image_url),
        sort_order: text(data.sort_order ?? 0),
        is_active: data.is_active !== false,
    };

    return <LineForm initial={initial} />;
}
