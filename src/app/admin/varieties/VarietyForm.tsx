'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Formular für eine Sorte – gemeinsam für Anlegen und Bearbeiten.
 *
 * Hier liegen die LMIV-Pflichtangaben. Eine Sorte lässt sich jederzeit als
 * Entwurf speichern; freigeben (is_available) lässt die Datenbank sie erst,
 * wenn Bezeichnung, Zutaten, Allergene und Stückgewicht gefüllt sind.
 */

interface Line {
    id: string;
    name: string;
}

export interface VarietyFormValues {
    id?: string;
    line_id: string;
    name: string;
    legal_name: string;
    description: string;
    ingredients: string;
    allergens: string;
    consumer_info: string;
    piece_weight_grams: string;
    image_url: string;
    sort_order: string;
    is_available: boolean;
    energy_kj: string;
    energy_kcal: string;
    fat_g: string;
    saturated_fat_g: string;
    carbs_g: string;
    sugar_g: string;
    protein_g: string;
    salt_g: string;
}

export const EMPTY_VARIETY: VarietyFormValues = {
    line_id: '', name: '', legal_name: '', description: '', ingredients: '',
    allergens: '', consumer_info: '', piece_weight_grams: '', image_url: '',
    sort_order: '0', is_available: false,
    energy_kj: '', energy_kcal: '', fat_g: '', saturated_fat_g: '',
    carbs_g: '', sugar_g: '', protein_g: '', salt_g: '',
};

const NUTRITION_FIELDS: { key: keyof VarietyFormValues; label: string; placeholder: string }[] = [
    { key: 'energy_kj', label: 'Energie (kJ)', placeholder: '1850' },
    { key: 'energy_kcal', label: 'Energie (kcal)', placeholder: '442' },
    { key: 'fat_g', label: 'Fett (g)', placeholder: '21.5' },
    { key: 'saturated_fat_g', label: 'davon gesättigte Fettsäuren (g)', placeholder: '13.0' },
    { key: 'carbs_g', label: 'Kohlenhydrate (g)', placeholder: '56.0' },
    { key: 'sugar_g', label: 'davon Zucker (g)', placeholder: '32.0' },
    { key: 'protein_g', label: 'Eiweiß (g)', placeholder: '6.0' },
    { key: 'salt_g', label: 'Salz (g)', placeholder: '0.65' },
];

const INPUT =
    'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all';

export default function VarietyForm({ initial }: { initial: VarietyFormValues }) {
    const router = useRouter();
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [values, setValues] = useState<VarietyFormValues>(initial);
    const [lines, setLines] = useState<Line[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = Boolean(initial.id);
    const set = (key: keyof VarietyFormValues, value: string | boolean) =>
        setValues((v) => ({ ...v, [key]: value }));

    useEffect(() => {
        const load = async () => {
            const { data } = await supabase
                .from('product_lines')
                .select('id, name')
                .order('sort_order');
            setLines(data ?? []);
            // Beim Anlegen die erste Linie vorauswählen, damit das Pflichtfeld
            // nicht versehentlich leer bleibt.
            if (!initial.line_id && data?.length) {
                setValues((v) => (v.line_id ? v : { ...v, line_id: data[0].id }));
            }
        };
        load();
    }, [supabase, initial.line_id]);

    // Leeres Feld heisst "nicht angegeben", nicht "0".
    const num = (v: string) => (v.trim() === '' ? null : parseFloat(v.replace(',', '.')));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!values.line_id) {
            setError('Bitte eine Produktlinie wählen.');
            return;
        }

        setSaving(true);
        try {
            let imageUrl = values.image_url;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `sorte-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(fileName, imageFile);
                if (uploadError) throw uploadError;

                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);
                imageUrl = publicUrl;
            }

            const row = {
                line_id: values.line_id,
                name: values.name,
                legal_name: values.legal_name || null,
                description: values.description || null,
                ingredients: values.ingredients || null,
                allergens: values.allergens || null,
                consumer_info: values.consumer_info || null,
                piece_weight_grams: num(values.piece_weight_grams),
                image_url: imageUrl || null,
                sort_order: parseInt(values.sort_order) || 0,
                is_available: values.is_available,
                energy_kj: num(values.energy_kj),
                energy_kcal: num(values.energy_kcal),
                fat_g: num(values.fat_g),
                saturated_fat_g: num(values.saturated_fat_g),
                carbs_g: num(values.carbs_g),
                sugar_g: num(values.sugar_g),
                protein_g: num(values.protein_g),
                salt_g: num(values.salt_g),
            };

            const { error: saveError } = initial.id
                ? await supabase.from('varieties').update(row).eq('id', initial.id)
                : await supabase.from('varieties').insert([row]);

            if (saveError) throw saveError;

            router.push('/admin/varieties');
            router.refresh();
        } catch (err: any) {
            // Die Datenbank verhindert das Freigeben unvollständiger Sorten.
            // Statt der Postgres-Meldung zeigen wir, was konkret fehlt.
            const msg: string = err?.message ?? '';
            if (msg.includes('varieties_lmiv_complete')) {
                setError(
                    'Zum Freigeben müssen Bezeichnung, Zutaten, Allergene und Stückgewicht ausgefüllt sein – ohne diese Angaben darf ein Lebensmittel nicht verkauft werden. Nimm den Haken bei „Freigegeben" heraus, um die Sorte als Entwurf zu speichern.'
                );
            } else {
                setError('Fehler beim Speichern: ' + msg);
            }
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/admin/varieties" className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                    {isEdit ? 'Sorte bearbeiten' : 'Neue Sorte anlegen'}
                </h1>
            </div>
            <p className="text-gray-500 mb-8 ml-14">
                Eine Sorte ist ein Rezept – eine Keksart, die du bäckst. Sie bekommt keinen
                Preis: verkauft wird sie später über einen Verkaufsartikel, also einen Karton,
                eine Tüte oder eine Packung.
            </p>

            {error && (
                <div role="alert" className="flex gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-6 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Allgemein */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Allgemein</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="line" className="block text-sm font-medium text-gray-700 mb-2">
                                Produktlinie <span className="text-red-500">*</span>
                            </label>
                            <select id="line" value={values.line_id} onChange={(e) => set('line_id', e.target.value)} className={INPUT} required>
                                {lines.length === 0 && <option value="">Wird geladen …</option>}
                                {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>

                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Name der Sorte <span className="text-red-500">*</span>
                            </label>
                            <input id="name" type="text" value={values.name} onChange={(e) => set('name', e.target.value)}
                                placeholder="z.B. Double Choc Fudge" className={INPUT} required />
                        </div>

                        <div>
                            <label htmlFor="legal" className="block text-sm font-medium text-gray-700 mb-2">
                                Bezeichnung des Lebensmittels <span className="text-red-500">*</span>
                            </label>
                            <input id="legal" type="text" value={values.legal_name} onChange={(e) => set('legal_name', e.target.value)}
                                placeholder="z.B. Feingebäck mit Schokoladenstückchen" className={INPUT} />
                            <p className="text-xs text-gray-400 mt-2">
                                Pflichtangabe nach LMIV – nicht der Fantasiename. &bdquo;Double Choc Fudge&ldquo; ist die
                                Marke, die Bezeichnung sagt, was es ist.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                            <textarea id="desc" rows={2} value={values.description} onChange={(e) => set('description', e.target.value)}
                                placeholder="Ein Satz für den Konfigurator." className={INPUT} />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">
                                    Gewicht je Keks (g) <span className="text-red-500">*</span>
                                </label>
                                <input id="weight" type="number" step="0.1" min="0" value={values.piece_weight_grams}
                                    onChange={(e) => set('piece_weight_grams', e.target.value)} placeholder="50" className={INPUT} />
                                <p className="text-xs text-gray-400 mt-2">
                                    Daraus wird die Füllmenge und der Grundpreis je Kilo berechnet.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">Reihenfolge</label>
                                <input id="order" type="number" value={values.sort_order} onChange={(e) => set('sort_order', e.target.value)} className={INPUT} />
                                <p className="text-xs text-gray-400 mt-2">
                                    Position im Konfigurator und in der Sortenliste auf der
                                    Produktseite. Kleinere Zahl steht weiter vorn.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Kennzeichnung */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Kennzeichnung</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="ing" className="block text-sm font-medium text-gray-700 mb-2">
                                Zutatenliste <span className="text-red-500">*</span>
                            </label>
                            <textarea id="ing" rows={3} value={values.ingredients} onChange={(e) => set('ingredients', e.target.value)}
                                placeholder="z.B. Dinkelmehl (Gluten), Butter (Milch), Rohrzucker, Eier, Meersalz" className={INPUT} />
                        </div>

                        <div>
                            <label htmlFor="all" className="block text-sm font-medium text-gray-700 mb-2">
                                Allergene <span className="text-red-500">*</span>
                            </label>
                            <textarea id="all" rows={2} value={values.allergens} onChange={(e) => set('allergens', e.target.value)}
                                placeholder="z.B. Gluten, Milch, Eier. Kann Spuren von Nüssen enthalten." className={INPUT} />
                            <p className="text-xs text-gray-400 mt-2">
                                Diese Begriffe werden im Zutatenverzeichnis automatisch fett hervorgehoben –
                                so verlangt es die LMIV. Wichtig: Sie müssen dafür in der Zutatenliste
                                <strong className="font-semibold"> wörtlich vorkommen</strong>. Schreibst du dort
                                &bdquo;Dinkelmehl&ldquo;, hebt &bdquo;Gluten&ldquo; nichts hervor. Besser: &bdquo;Dinkelmehl (Gluten)&ldquo;.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="cons" className="block text-sm font-medium text-gray-700 mb-2">Verbraucherhinweise</label>
                            <textarea id="cons" rows={2} value={values.consumer_info} onChange={(e) => set('consumer_info', e.target.value)}
                                placeholder="z.B. Kühl und trocken lagern." className={INPUT} />
                        </div>
                    </div>
                </div>

                {/* Nährwerte */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-2 border-b border-gray-100 pb-4">Nährwerte je 100 g</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Optional. Für handwerklich hergestellte Lebensmittel in kleinen Mengen kann eine
                        Ausnahme greifen. Sobald hier Werte stehen, erscheinen sie auf der Produktseite.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {NUTRITION_FIELDS.map((f) => (
                            <div key={f.key}>
                                <label htmlFor={f.key} className="block text-sm font-medium text-gray-700 mb-2">{f.label}</label>
                                <input id={f.key} type="number" step="0.1" min="0"
                                    value={values[f.key] as string}
                                    onChange={(e) => set(f.key, e.target.value)}
                                    placeholder={f.placeholder} className={INPUT} />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Bild und Freigabe */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Bild & Freigabe</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Foto der Sorte</label>
                            {values.image_url && !imageFile && (
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden mb-3 border border-gray-200">
                                    <Image src={values.image_url} alt={values.name || 'Sorte'} fill className="object-cover" sizes="96px" />
                                </div>
                            )}
                            <label className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-gray-500 block">
                                <span className="block text-2xl mb-1">{imageFile ? '✅' : '📸'}</span>
                                <span className="text-sm font-medium">
                                    {imageFile ? imageFile.name : values.image_url ? 'Anderes Bild wählen' : 'Bild hochladen'}
                                </span>
                                <input type="file" className="hidden" accept="image/*"
                                    onChange={(e) => { if (e.target.files?.[0]) setImageFile(e.target.files[0]); }} />
                            </label>
                        </div>

                        <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                            <input type="checkbox" id="available" checked={values.is_available}
                                onChange={(e) => set('is_available', e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]" />
                            <label htmlFor="available" className="cursor-pointer">
                                <span className="font-medium text-gray-900 block">Freigegeben</span>
                                <span className="text-xs text-gray-500 block mt-1">
                                    Nur freigegebene Sorten lassen sich in Kartons verwenden und im
                                    Konfigurator auswählen. Ohne Haken bleibt die Sorte ein Entwurf.
                                    Nimmst du eine freigegebene Sorte später zurück, gehen die Kartons,
                                    die sie enthalten, automatisch aus dem Verkauf.
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href="/admin/varieties" className="px-6 py-3 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
                        Abbrechen
                    </Link>
                    <button type="submit" disabled={saving}
                        className="px-8 py-3 rounded-xl font-bold bg-[var(--color-brand-text)] text-white hover:bg-neutral-800 transition-colors shadow-md flex items-center gap-2 disabled:opacity-70">
                        {saving ? 'Speichere …' : <><Save className="w-5 h-5" /> Speichern</>}
                    </button>
                </div>
            </form>
        </div>
    );
}
