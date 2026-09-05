'use client';

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function EditProduct({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [weight, setWeight] = useState('');
    const [legalName, setLegalName] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [allergens, setAllergens] = useState('');
    const [consumerInfo, setConsumerInfo] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [category, setCategory] = useState('classic');
    const [energyKj, setEnergyKj] = useState('');
    const [energyKcal, setEnergyKcal] = useState('');
    const [fat, setFat] = useState('');
    const [satFat, setSatFat] = useState('');
    const [carbs, setCarbs] = useState('');
    const [sugar, setSugar] = useState('');
    const [protein, setProtein] = useState('');
    const [salt, setSalt] = useState('');

    const [imageFile, setImageFile] = useState<File | null>(null);
    const [existingImageUrl, setExistingImageUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);

    useEffect(() => {
        const fetchProduct = async () => {
            setFetching(true);
            try {
                const { data, error } = await supabase
                    .from('products')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (error) throw error;
                if (data) {
                    setName(data.name);
                    setDescription(data.description || '');
                    setPrice(data.price.toString());
                    setWeight(data.weight_grams?.toString() || '');
                    setLegalName(data.legal_name || '');
                    setIngredients(data.ingredients || '');
                    setAllergens(data.allergens || '');
                    setConsumerInfo(data.consumer_info || '');
                    setIsActive(data.is_available);
                    setCategory(data.category || 'classic');
                    setEnergyKj(data.energy_kj !== null && data.energy_kj !== undefined ? String(data.energy_kj) : '');
                    setEnergyKcal(data.energy_kcal !== null && data.energy_kcal !== undefined ? String(data.energy_kcal) : '');
                    setFat(data.fat_g !== null && data.fat_g !== undefined ? String(data.fat_g) : '');
                    setSatFat(data.saturated_fat_g !== null && data.saturated_fat_g !== undefined ? String(data.saturated_fat_g) : '');
                    setCarbs(data.carbs_g !== null && data.carbs_g !== undefined ? String(data.carbs_g) : '');
                    setSugar(data.sugar_g !== null && data.sugar_g !== undefined ? String(data.sugar_g) : '');
                    setProtein(data.protein_g !== null && data.protein_g !== undefined ? String(data.protein_g) : '');
                    setSalt(data.salt_g !== null && data.salt_g !== undefined ? String(data.salt_g) : '');

                    setExistingImageUrl(data.image_url);
                }
            } catch (err: any) {
                alert('Keks konnte nicht geladen werden: ' + err.message);
                router.push('/admin/products');
            } finally {
                setFetching(false);
            }
        };

        if (id) {
            fetchProduct();
        }
    }, [id, router]);

    // Leeres Feld heißt "nicht angegeben", nicht "0".
    const num = (v: string) => (v.trim() === '' ? null : parseFloat(v.replace(',', '.')));

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = existingImageUrl;

            // 1. Upload image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const { error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            // 2. Update product in database
            const { error: updateError } = await supabase
                .from('products')
                .update({
                    name,
                    description,
                    price: parseFloat(price.replace(',', '.')),
                    legal_name: legalName,
                    ingredients,
                    allergens,
                    energy_kj: num(energyKj),
                    energy_kcal: num(energyKcal),
                    fat_g: num(fat),
                    saturated_fat_g: num(satFat),
                    carbs_g: num(carbs),
                    sugar_g: num(sugar),
                    protein_g: num(protein),
                    salt_g: num(salt),
                    consumer_info: consumerInfo,
                    weight_grams: parseInt(weight) || 0,
                    image_url: imageUrl,
                    category,
                    is_available: isActive
                })
                .eq('id', id);

            if (updateError) throw updateError;

            router.push('/admin/products');
            router.refresh();

        } catch (error: any) {
            const msg = error?.message?.includes('products_lmiv_complete')
                ? 'Solange Bezeichnung, Zutaten, Allergene und Gewicht nicht vollständig sind, kann das Produkt nicht im Shop bestellbar sein. Nimm den Haken bei "Im Shop bestellbar" heraus, um es als Entwurf zu speichern.'
                : 'Fehler beim Speichern: ' + error.message;
            alert(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/admin/products" className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors">
                    <ArrowLeft className="w-5 h-5 text-gray-500" />
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Keks bearbeiten</h1>
            </div>

            {fetching ? (
                <div className="text-center py-12 text-gray-500">Lade Keks-Daten...</div>
            ) : (
            <form onSubmit={handleSave} className="space-y-8">
                {/* Basic Info */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Allgemeine Informationen</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Name des Kekses</label>
                            <input
                                type="text"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="z.B. Classic Chocolate Chip"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Beschreibung (kurz)</label>
                            <textarea
                                rows={3}
                                value={description}
                                onChange={e => setDescription(e.target.value)}
                                placeholder="z.B. Der Klassiker mit zarter belgischer Schokolade."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                                required
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Preis (€)</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    placeholder="3.50"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Gewicht (g)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={weight}
                                    onChange={e => setWeight(e.target.value)}
                                    placeholder="z.B. 120"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Kategorie</label>
                            <select
                                value={category}
                                onChange={e => setCategory(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all bg-white"
                            >
                                <option value="classic">Classic</option>
                                <option value="kids">Kids</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Media & Details */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 border-b border-gray-100 pb-4">Details & Bilder</h2>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Bezeichnung des Lebensmittels <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={legalName}
                                onChange={e => setLegalName(e.target.value)}
                                placeholder="z.B. Feingebäck mit Schokoladenstückchen"
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                                required
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Pflichtangabe nach LMIV – nicht der Fantasiename. „Double Choc Fudge“ ist die
                                Marke, die Bezeichnung sagt, was drin ist.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Zutatenliste <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={3}
                                value={ingredients}
                                onChange={e => setIngredients(e.target.value)}
                                placeholder="z.B. Dinkelmehl, Butter, Zucker, Eier, Vanille..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Allergene <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                rows={2}
                                value={allergens}
                                onChange={e => setAllergens(e.target.value)}
                                placeholder="z.B. Gluten (Dinkel), Eier, Milch. Kann Spuren von Nüssen enthalten."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                                required
                            />
                            <p className="text-xs text-gray-400 mt-2">
                                Diese Begriffe werden im Zutatenverzeichnis automatisch fett hervorgehoben –
                                so verlangt es die LMIV. Wichtig: Sie müssen dafür in der Zutatenliste
                                <strong className="font-semibold"> wörtlich vorkommen</strong>. Schreibst du dort
                                „Dinkelmehl“, hebt „Gluten“ nichts hervor. Besser: in der Zutatenliste
                                „Dinkelmehl (Gluten)“ und hier „Gluten, Butter, Eier“.
                            </p>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Verbraucherhinweise</label>
                            <textarea
                                rows={2}
                                value={consumerInfo}
                                onChange={e => setConsumerInfo(e.target.value)}
                                placeholder="z.B. Kühl und trocken lagern. Nach dem Öffnen innerhalb von 3 Tagen verzehren."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Produktbild</label>
                            <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-gray-500 block relative overflow-hidden group">
                                <span className="block text-3xl mb-2 z-10 relative">{imageFile ? '✅' : (existingImageUrl ? '🖼️' : '📸')}</span>
                                <span className="text-sm font-medium z-10 relative bg-white/80 px-2 py-1 rounded inline-block">
                                    {imageFile ? imageFile.name : (existingImageUrl ? 'Aktuelles Bild überschreiben' : 'Klicke hier, um ein Bild hochzuladen')}
                                </span>
                                {existingImageUrl && !imageFile && (
                                    <div className="absolute inset-0 opacity-20 group-hover:opacity-10 transition-opacity">
                                        <img src={existingImageUrl} alt="Current Product Image" className="w-full h-full object-cover" />
                                    </div>
                                )}
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setImageFile(e.target.files[0]);
                                        }
                                    }}
                                />
                            </label>
                        </div>

                        <div className="flex items-start gap-3 pt-4 border-t border-gray-100 mt-2">
                            <input
                                type="checkbox"
                                id="active"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                                className="mt-1 w-5 h-5 rounded border-gray-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                            />
                            <label htmlFor="active" className="cursor-pointer">
                                <span className="font-medium text-gray-900 block">Im Shop bestellbar</span>
                                <span className="text-xs text-gray-500 block mt-1">
                                    Nur möglich, wenn Bezeichnung, Zutaten, Allergene und Gewicht ausgefüllt
                                    sind – ohne diese Angaben darf ein Lebensmittel nicht online verkauft
                                    werden. Ohne Haken kannst du das Produkt als Entwurf speichern.
                                </span>
                            </label>
                        </div>
                    </div>
                </div>

                {/* Nährwerte */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-2 border-b border-gray-100 pb-4">Nährwerte je 100 g</h2>
                    <p className="text-sm text-gray-500 mb-6">
                        Optional. Für handwerklich hergestellte Lebensmittel in kleinen Mengen kann eine
                        Ausnahme greifen. Sobald du hier Werte einträgst, erscheinen sie als Tabelle auf der
                        Produktseite. Im Zweifel bei deiner Lebensmittelüberwachung nachfragen.
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Energie (kJ)</label>
                                <input type="number" step="0.1" min="0" value={energyKj} onChange={e => setEnergyKj(e.target.value)} placeholder="1850" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Energie (kcal)</label>
                                <input type="number" step="0.1" min="0" value={energyKcal} onChange={e => setEnergyKcal(e.target.value)} placeholder="442" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Fett (g)</label>
                                <input type="number" step="0.1" min="0" value={fat} onChange={e => setFat(e.target.value)} placeholder="21.5" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">davon gesättigte Fettsäuren (g)</label>
                                <input type="number" step="0.1" min="0" value={satFat} onChange={e => setSatFat(e.target.value)} placeholder="13.0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Kohlenhydrate (g)</label>
                                <input type="number" step="0.1" min="0" value={carbs} onChange={e => setCarbs(e.target.value)} placeholder="56.0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">davon Zucker (g)</label>
                                <input type="number" step="0.1" min="0" value={sugar} onChange={e => setSugar(e.target.value)} placeholder="32.0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Eiweiß (g)</label>
                                <input type="number" step="0.1" min="0" value={protein} onChange={e => setProtein(e.target.value)} placeholder="6.0" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Salz (g)</label>
                                <input type="number" step="0.1" min="0" value={salt} onChange={e => setSalt(e.target.value)} placeholder="0.65" className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all" />
                            </div>
                    </div>
                </div>

                <div className="flex justify-end gap-4">
                    <Link
                        href="/admin/products"
                        className="px-6 py-3 rounded-xl font-bold bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                        Abbrechen
                    </Link>
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-8 py-3 rounded-xl font-bold bg-[var(--color-brand-text)] text-white hover:bg-neutral-800 transition-colors shadow-md flex items-center gap-2 disabled:opacity-70"
                    >
                        {loading ? 'Speichere...' : <> <Save className="w-5 h-5" /> Speichern</>}
                    </button>
                </div>

            </form>
            )}
        </div>
    );
}
