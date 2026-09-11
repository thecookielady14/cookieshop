'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, Link2 } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';
import { assertWritten } from '@/lib/admin-write';

/**
 * Formular für eine Produktlinie – gemeinsam für Anlegen und Bearbeiten.
 *
 * Eine Linie ist rein darstellend: Name, Bild und Texte. Ob ein Karton zum
 * Selbstzusammenstellen gehört, hängt am Verkaufsartikel, nicht an der Linie –
 * deshalb kann eine Linie gleichzeitig einen Wunschkarton und feste Kartons
 * enthalten.
 */

export interface LineFormValues {
    id?: string;
    slug: string;
    name: string;
    tagline: string;
    description: string;
    image_url: string;
    sort_order: string;
    is_active: boolean;
}

export const EMPTY_LINE: LineFormValues = {
    slug: '', name: '', tagline: '', description: '',
    image_url: '', sort_order: '0', is_active: true,
};

const INPUT =
    'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all';

/** Aus dem Namen einen URL-taugliche Adresse machen. */
function toSlug(value: string): string {
    return value
        .toLowerCase()
        .replace(/ä/g, 'ae').replace(/ö/g, 'oe').replace(/ü/g, 'ue').replace(/ß/g, 'ss')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

export default function LineForm({ initial }: { initial: LineFormValues }) {
    const router = useRouter();
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [values, setValues] = useState<LineFormValues>(initial);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = Boolean(initial.id);
    const set = (key: keyof LineFormValues, value: string | boolean) =>
        setValues((v) => ({ ...v, [key]: value }));

    /** Beim Anlegen die Adresse aus dem Namen mitschreiben, bis sie angefasst wird. */
    const handleNameChange = (name: string) => {
        setValues((v) => ({
            ...v,
            name,
            slug: !isEdit && (v.slug === '' || v.slug === toSlug(v.name)) ? toSlug(name) : v.slug,
        }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        const slug = toSlug(values.slug || values.name);
        if (!slug) {
            setError('Bitte einen Namen eintragen, aus dem sich eine Adresse bilden lässt.');
            return;
        }

        setSaving(true);
        try {
            let imageUrl = values.image_url;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `linie-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('products').upload(fileName, imageFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
                imageUrl = publicUrl;
            }

            const row = {
                slug,
                name: values.name,
                tagline: values.tagline || null,
                description: values.description || null,
                image_url: imageUrl || null,
                sort_order: parseInt(values.sort_order) || 0,
                is_active: values.is_active,
                updated_at: new Date().toISOString(),
            };

            const { data: saved, error: saveError } = initial.id
                ? await supabase.from('product_lines').update(row).eq('id', initial.id).select('id')
                : await supabase.from('product_lines').insert([row]).select('id');

            if (saveError) throw saveError;
            assertWritten(saved, 'Die Linie');

            router.push('/admin/lines');
            router.refresh();
        } catch (err: unknown) {
            const msg = err instanceof Error ? err.message : String(err);
            if (msg.includes('product_lines_slug_key')) {
                setError(`Die Adresse „${slug}" ist schon von einer anderen Linie belegt.`);
            } else if (msg.includes('product_lines_slug_format')) {
                setError('Die Adresse darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.');
            } else {
                setError('Fehler beim Speichern: ' + msg);
            }
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/admin/lines" className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                    {isEdit ? 'Linie bearbeiten' : 'Neue Linie anlegen'}
                </h1>
            </div>
            <p className="text-gray-500 mb-8 ml-14">
                Eine Linie bündelt Sorten und Verkaufsartikel und bekommt im Shop eine eigene
                Seite mit Bild und Text.
            </p>

            {error && (
                <div role="alert" className="flex gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-6 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Texte</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input id="name" type="text" value={values.name}
                                onChange={(e) => handleNameChange(e.target.value)}
                                placeholder="z.B. Classic Line" className={INPUT} required />
                        </div>

                        <div>
                            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
                                Adresse im Shop
                            </label>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 whitespace-nowrap flex items-center gap-1">
                                    <Link2 className="w-4 h-4" /> /shop/
                                </span>
                                <input id="slug" type="text" value={values.slug}
                                    onChange={(e) => set('slug', e.target.value)}
                                    placeholder="classic" className={INPUT} />
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                {isEdit
                                    ? 'Achtung: Änderst du das, führen alte Links auf diese Seite ins Leere. Nur ändern, solange die Linie noch nicht beworben wurde.'
                                    : 'Wird automatisch aus dem Namen gebildet. Nur Kleinbuchstaben, Zahlen und Bindestriche.'}
                            </p>
                        </div>

                        <div>
                            <label htmlFor="tagline" className="block text-sm font-medium text-gray-700 mb-2">
                                Kurzzeile
                            </label>
                            <input id="tagline" type="text" value={values.tagline}
                                onChange={(e) => set('tagline', e.target.value)}
                                placeholder="z.B. Die Klassiker – im Sechserkarton" className={INPUT} />
                            <p className="text-xs text-gray-400 mt-2">
                                Steht auf der Kachel in der Shop-Übersicht. Ein knapper Satz.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-2">
                                Beschreibung
                            </label>
                            <textarea id="desc" rows={3} value={values.description}
                                onChange={(e) => set('description', e.target.value)} className={INPUT} />
                            <p className="text-xs text-gray-400 mt-2">
                                Steht oben auf der Linienseite unter der Überschrift.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">
                                Reihenfolge
                            </label>
                            <input id="order" type="number" value={values.sort_order}
                                onChange={(e) => set('sort_order', e.target.value)} className={INPUT} />
                            <p className="text-xs text-gray-400 mt-2">
                                Position der Kachel in der Shop-Übersicht. Kleinere Zahl steht weiter vorn.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Bild & Sichtbarkeit</h2>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bild der Linie
                            </label>
                            {values.image_url && !imageFile && (
                                <div className="relative w-40 aspect-[4/3] rounded-xl overflow-hidden mb-3 border border-gray-200">
                                    <Image src={values.image_url} alt={values.name || 'Linie'} fill className="object-cover" sizes="160px" />
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
                            <p className="text-xs text-gray-400 mt-2">
                                Erscheint auf der Kachel in der Shop-Übersicht. Die Kachel ist breiter
                                als hoch (Verhältnis 4:3) – ein querformatiges Foto passt am besten.
                            </p>
                        </div>

                        <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                            <input type="checkbox" id="active" checked={values.is_active}
                                onChange={(e) => set('is_active', e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]" />
                            <label htmlFor="active" className="cursor-pointer">
                                <span className="font-medium text-gray-900 block">Im Shop sichtbar</span>
                                <span className="text-xs text-gray-500 block mt-1">
                                    Ohne Haken verschwindet die Linie samt Seite aus dem Shop. Nützlich,
                                    um eine Linie vorzubereiten, bevor sie öffentlich wird.
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href="/admin/lines" className="px-6 py-3 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
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
