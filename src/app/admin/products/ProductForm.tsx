'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save, AlertCircle, Plus, Minus, Boxes, Shuffle } from 'lucide-react';
import { createBrowserClient } from '@supabase/ssr';

/**
 * Formular für eine verkaufbare Einheit (Karton, Tüte, Packung) – gemeinsam
 * für Anlegen und Bearbeiten.
 *
 * Die Rezeptfelder stehen bewusst nicht mehr hier, sondern bei den Sorten:
 * dieselbe Sorte steckt in mehreren Kartons und soll nur einmal gepflegt
 * werden. Ein Produkt verweist nur darauf.
 *
 * Gespeichert wird über die Datenbankfunktion admin_save_product, weil Produkt
 * und Zusammensetzung sonst zwei getrennte Anfragen wären – das Produkt wäre
 * gespeichert, die Sorten womöglich nicht.
 */

interface Line { id: string; name: string }
interface VarietyOption { id: string; name: string; line_id: string; is_available: boolean }

export interface ProductFormValues {
    id?: string;
    line_id: string;
    name: string;
    legal_name: string;
    description: string;
    price: string;
    kind: 'fixed' | 'configurable';
    piece_count: string;
    weight_grams: string;
    consumer_info: string;
    image_url: string;
    sort_order: string;
    is_bestseller: boolean;
    is_available: boolean;
    varieties: { variety_id: string; quantity: number }[];
}

export const EMPTY_PRODUCT: ProductFormValues = {
    line_id: '', name: '', legal_name: '', description: '', price: '',
    kind: 'fixed', piece_count: '', weight_grams: '', consumer_info: '',
    image_url: '', sort_order: '0', is_bestseller: false, is_available: false,
    varieties: [],
};

const INPUT =
    'w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all';

export default function ProductForm({ initial }: { initial: ProductFormValues }) {
    const router = useRouter();
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );

    const [values, setValues] = useState<ProductFormValues>(initial);
    const [lines, setLines] = useState<Line[]>([]);
    const [allVarieties, setAllVarieties] = useState<VarietyOption[]>([]);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const isEdit = Boolean(initial.id);
    const set = useCallback(
        (key: keyof ProductFormValues, value: unknown) =>
            setValues((v) => ({ ...v, [key]: value })),
        []
    );

    useEffect(() => {
        const load = async () => {
            const [{ data: lineRows }, { data: varietyRows }] = await Promise.all([
                supabase.from('product_lines').select('id, name').order('sort_order'),
                supabase.from('varieties').select('id, name, line_id, is_available').order('sort_order'),
            ]);
            setLines(lineRows ?? []);
            setAllVarieties(varietyRows ?? []);
            if (!initial.line_id && lineRows?.length) {
                setValues((v) => (v.line_id ? v : { ...v, line_id: lineRows[0].id }));
            }
        };
        load();
    }, [supabase, initial.line_id]);

    /** Nur Sorten der gewählten Linie – alles andere lehnt die Datenbank ohnehin ab. */
    const lineVarieties = useMemo(
        () => allVarieties.filter((v) => v.line_id === values.line_id),
        [allVarieties, values.line_id]
    );

    const quantityOf = (varietyId: string) =>
        values.varieties.find((v) => v.variety_id === varietyId)?.quantity ?? 0;

    const changeQuantity = (varietyId: string, delta: number) => {
        setValues((v) => {
            const current = v.varieties.find((x) => x.variety_id === varietyId)?.quantity ?? 0;
            const next = Math.max(0, current + delta);
            const rest = v.varieties.filter((x) => x.variety_id !== varietyId);
            return { ...v, varieties: next === 0 ? rest : [...rest, { variety_id: varietyId, quantity: next }] };
        });
    };

    const pieceSum = values.varieties.reduce((s, v) => s + v.quantity, 0);
    const targetPieces = parseInt(values.piece_count) || 0;
    const sumMatches = targetPieces === 0 || pieceSum === targetPieces;

    // Beim Wechsel der Linie passt die bisherige Auswahl nicht mehr.
    const handleLineChange = (lineId: string) => {
        setValues((v) => ({ ...v, line_id: lineId, varieties: [] }));
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!values.line_id) { setError('Bitte eine Produktlinie wählen.'); return; }
        if (values.kind === 'configurable' && targetPieces <= 0) {
            setError('Ein Karton zum Selbstzusammenstellen braucht eine Stückzahl – sonst lässt sich die Auswahl nicht prüfen.');
            return;
        }
        if (values.kind === 'fixed' && values.is_available && values.varieties.length === 0) {
            setError('Ein Produkt ohne Sorten lässt sich nicht in den Verkauf geben. Wähle die enthaltenen Sorten aus oder speichere es als Entwurf.');
            return;
        }

        setSaving(true);
        try {
            let imageUrl = values.image_url;

            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `produkt-${Date.now()}-${Math.random().toString(36).slice(2)}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('products').upload(fileName, imageFile);
                if (uploadError) throw uploadError;
                const { data: { publicUrl } } = supabase.storage.from('products').getPublicUrl(fileName);
                imageUrl = publicUrl;
            }

            // Produkt und Zusammensetzung in einer Transaktion – siehe Kommentar oben.
            const { error: rpcError } = await supabase.rpc('admin_save_product', {
                payload: {
                    id: initial.id ?? '',
                    line_id: values.line_id,
                    name: values.name,
                    legal_name: values.legal_name,
                    description: values.description,
                    price: values.price.replace(',', '.'),
                    kind: values.kind,
                    piece_count: values.piece_count,
                    weight_grams: values.weight_grams,
                    consumer_info: values.consumer_info,
                    image_url: imageUrl,
                    sort_order: values.sort_order,
                    is_bestseller: values.is_bestseller,
                    is_available: values.is_available,
                    varieties: values.kind === 'fixed' ? values.varieties : [],
                },
            });

            if (rpcError) throw rpcError;

            router.push('/admin/products');
            router.refresh();
        } catch (err: any) {
            const msg: string = err?.message ?? '';
            // Die Datenbank prüft die Kennzeichnung über Tabellengrenzen hinweg.
            // Ihre Meldungen sind schon auf Deutsch und nennen den Grund.
            setError(
                msg.includes('products_lmiv_complete')
                    ? msg.replace('products_lmiv_complete: ', '')
                    : 'Fehler beim Speichern: ' + msg
            );
            setSaving(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-2">
                <Link href="/admin/products" className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">
                    {isEdit ? 'Produkt bearbeiten' : 'Neues Produkt anlegen'}
                </h1>
            </div>
            <p className="text-gray-500 mb-8 ml-14">
                Ein Produkt ist das, was im Warenkorb landet – ein Karton, eine Tüte, eine Packung.
                Zutaten und Allergene stehen bei den{' '}
                <Link href="/admin/varieties" className="text-[var(--color-brand-primary)] underline">Sorten</Link>.
            </p>

            {error && (
                <div role="alert" className="flex gap-3 bg-red-50 border border-red-200 text-red-800 p-4 rounded-2xl mb-6 text-sm">
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                </div>
            )}

            <form onSubmit={handleSave} className="space-y-8">
                {/* Art der Einheit */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Art der Verkaufseinheit</h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                        {([
                            { key: 'fixed' as const, Icon: Boxes, title: 'Feste Zusammenstellung', text: 'Sortenrein oder eine feste Mischung, die du festlegst.' },
                            { key: 'configurable' as const, Icon: Shuffle, title: 'Zum Selbstzusammenstellen', text: 'Die Kundschaft wählt die Sorten aus dieser Linie selbst.' },
                        ]).map(({ key, Icon, title, text }) => (
                            <button key={key} type="button" onClick={() => set('kind', key)}
                                className={`text-left p-5 rounded-2xl border-2 transition-colors ${
                                    values.kind === key
                                        ? 'border-[var(--color-brand-primary)] bg-[var(--color-brand-secondary)]/50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}>
                                <Icon className={`w-6 h-6 mb-2 ${values.kind === key ? 'text-[var(--color-brand-primary)]' : 'text-gray-400'}`} />
                                <span className="font-bold text-gray-900 block">{title}</span>
                                <span className="text-xs text-gray-500 block mt-1">{text}</span>
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label htmlFor="line" className="block text-sm font-medium text-gray-700 mb-2">
                                Produktlinie <span className="text-red-500">*</span>
                            </label>
                            <select id="line" value={values.line_id} onChange={(e) => handleLineChange(e.target.value)} className={INPUT} required>
                                {lines.length === 0 && <option value="">Wird geladen …</option>}
                                {lines.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label htmlFor="pieces" className="block text-sm font-medium text-gray-700 mb-2">
                                Anzahl Kekse {values.kind === 'configurable' && <span className="text-red-500">*</span>}
                            </label>
                            <input id="pieces" type="number" min="1" value={values.piece_count}
                                onChange={(e) => set('piece_count', e.target.value)} placeholder="6" className={INPUT} />
                            <p className="text-xs text-gray-400 mt-2">
                                {values.kind === 'configurable'
                                    ? 'So viele Kekse muss die Kundschaft wählen.'
                                    : 'Leer lassen, wenn nach Gewicht verkauft wird.'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Zusammensetzung */}
                {values.kind === 'fixed' && (
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <div className="flex items-baseline justify-between mb-6 border-b border-gray-100 pb-4">
                            <h2 className="text-xl font-bold">Enthaltene Sorten</h2>
                            {targetPieces > 0 && (
                                <span className={`text-sm font-bold ${sumMatches ? 'text-green-700' : 'text-amber-700'}`}>
                                    {pieceSum} von {targetPieces} verteilt
                                </span>
                            )}
                        </div>

                        {lineVarieties.length === 0 ? (
                            <p className="text-gray-500 text-sm">
                                In dieser Linie gibt es noch keine Sorten.{' '}
                                <Link href="/admin/varieties/new" className="text-[var(--color-brand-primary)] underline">Jetzt eine anlegen</Link>
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {lineVarieties.map((v) => {
                                    const qty = quantityOf(v.id);
                                    return (
                                        <div key={v.id} className={`flex items-center gap-4 p-3 rounded-2xl border ${
                                            qty > 0 ? 'border-[var(--color-brand-primary)]/30 bg-[var(--color-brand-secondary)]/40' : 'border-gray-100'
                                        }`}>
                                            <div className="flex-1 min-w-0">
                                                <span className="font-medium text-gray-900 block truncate">{v.name}</span>
                                                {!v.is_available && (
                                                    <span className="text-xs text-amber-700">
                                                        Entwurf – solange sie nicht freigegeben ist, kann das Produkt nicht in den Verkauf
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button type="button" onClick={() => changeQuantity(v.id, -1)} disabled={qty === 0}
                                                    aria-label={`Menge von ${v.name} verringern`}
                                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30">
                                                    <Minus className="w-4 h-4" />
                                                </button>
                                                <span className="w-8 text-center font-bold">{qty}</span>
                                                <button type="button" onClick={() => changeQuantity(v.id, 1)}
                                                    aria-label={`Menge von ${v.name} erhöhen`}
                                                    className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50">
                                                    <Plus className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Angaben */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Angaben</h2>
                    <div className="space-y-6">
                        <div>
                            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                                Name <span className="text-red-500">*</span>
                            </label>
                            <input id="name" type="text" value={values.name} onChange={(e) => set('name', e.target.value)}
                                placeholder="z.B. Probierkarton" className={INPUT} required />
                        </div>

                        <div>
                            <label htmlFor="legal" className="block text-sm font-medium text-gray-700 mb-2">
                                Bezeichnung des Lebensmittels <span className="text-red-500">*</span>
                            </label>
                            <input id="legal" type="text" value={values.legal_name} onChange={(e) => set('legal_name', e.target.value)}
                                placeholder="z.B. Feingebäck, gemischt" className={INPUT} />
                            <p className="text-xs text-gray-400 mt-2">
                                Die Bezeichnung der Packung. Die Sorten haben zusätzlich ihre eigene.
                            </p>
                        </div>

                        <div>
                            <label htmlFor="desc" className="block text-sm font-medium text-gray-700 mb-2">Beschreibung</label>
                            <textarea id="desc" rows={2} value={values.description} onChange={(e) => set('description', e.target.value)} className={INPUT} />
                        </div>

                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
                                    Preis (€) <span className="text-red-500">*</span>
                                </label>
                                <input id="price" type="text" inputMode="decimal" value={values.price}
                                    onChange={(e) => set('price', e.target.value)} placeholder="12.90" className={INPUT} required />
                            </div>
                            <div>
                                <label htmlFor="weight" className="block text-sm font-medium text-gray-700 mb-2">Nennfüllmenge (g)</label>
                                <input id="weight" type="number" min="0" value={values.weight_grams}
                                    onChange={(e) => set('weight_grams', e.target.value)} className={INPUT} />
                                <p className="text-xs text-gray-400 mt-2">
                                    Nur bei Ware nach Gewicht. Bei Stückware rechnet der Shop aus den Sorten.
                                </p>
                            </div>
                            <div>
                                <label htmlFor="order" className="block text-sm font-medium text-gray-700 mb-2">Reihenfolge</label>
                                <input id="order" type="number" value={values.sort_order}
                                    onChange={(e) => set('sort_order', e.target.value)} className={INPUT} />
                            </div>
                        </div>

                        <div>
                            <label htmlFor="cons" className="block text-sm font-medium text-gray-700 mb-2">Verbraucherhinweise</label>
                            <textarea id="cons" rows={2} value={values.consumer_info} onChange={(e) => set('consumer_info', e.target.value)}
                                placeholder="z.B. Kühl und trocken lagern." className={INPUT} />
                        </div>
                    </div>
                </div>

                {/* Bild und Freigabe */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Bild & Freigabe</h2>
                    <div className="space-y-6">
                        <div>
                            {values.image_url && !imageFile && (
                                <div className="relative w-24 h-24 rounded-xl overflow-hidden mb-3 border border-gray-200">
                                    <Image src={values.image_url} alt={values.name || 'Produkt'} fill className="object-cover" sizes="96px" />
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

                        <label className="flex items-center gap-3 cursor-pointer">
                            <input type="checkbox" checked={values.is_bestseller}
                                onChange={(e) => set('is_bestseller', e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]" />
                            <span className="text-sm font-medium text-gray-700">Auf der Startseite hervorheben</span>
                        </label>

                        <div className="flex items-start gap-3 pt-4 border-t border-gray-100">
                            <input type="checkbox" id="available" checked={values.is_available}
                                onChange={(e) => set('is_available', e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]" />
                            <label htmlFor="available" className="cursor-pointer">
                                <span className="font-medium text-gray-900 block">Im Shop bestellbar</span>
                                <span className="text-xs text-gray-500 block mt-1">
                                    Nur möglich, wenn Bezeichnung und Füllmenge stehen und alle enthaltenen
                                    Sorten freigegeben sind. Ohne Haken bleibt es ein Entwurf.
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link href="/admin/products" className="px-6 py-3 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors">
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
