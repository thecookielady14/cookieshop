import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import VarietyForm, { EMPTY_VARIETY, type VarietyFormValues } from '../../VarietyForm';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const dynamic = 'force-dynamic';

/** Zahlenfelder kommen als Zahl oder null aus der DB, das Formular will Text. */
const text = (v: unknown) => (v === null || v === undefined ? '' : String(v));

export default async function EditVariety({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const { data } = await supabase.from('varieties').select('*').eq('id', id).maybeSingle();

    if (!data) {
        return (
            <div className="max-w-3xl">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Sorte nicht gefunden</h1>
                <p className="text-gray-500 mb-8">
                    Diese Sorte gibt es nicht mehr – vielleicht wurde sie gelöscht.
                </p>
                <Link href="/admin/varieties" className="text-[var(--color-brand-primary)] underline">
                    Zurück zur Übersicht
                </Link>
            </div>
        );
    }

    const initial: VarietyFormValues = {
        ...EMPTY_VARIETY,
        id: data.id,
        line_id: data.line_id ?? '',
        name: data.name ?? '',
        legal_name: text(data.legal_name),
        description: text(data.description),
        ingredients: text(data.ingredients),
        allergens: text(data.allergens),
        consumer_info: text(data.consumer_info),
        piece_weight_grams: text(data.piece_weight_grams),
        image_url: text(data.image_url),
        sort_order: text(data.sort_order ?? 0),
        is_available: data.is_available === true,
        energy_kj: text(data.energy_kj),
        energy_kcal: text(data.energy_kcal),
        fat_g: text(data.fat_g),
        saturated_fat_g: text(data.saturated_fat_g),
        carbs_g: text(data.carbs_g),
        sugar_g: text(data.sugar_g),
        protein_g: text(data.protein_g),
        salt_g: text(data.salt_g),
    };

    return <VarietyForm initial={initial} />;
}
