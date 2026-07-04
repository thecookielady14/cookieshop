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
    const [stockCount, setStockCount] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [allergens, setAllergens] = useState('');
    const [consumerInfo, setConsumerInfo] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [category, setCategory] = useState('classic');
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
                    setStockCount(data.stock_count?.toString() || '');
                    setIngredients(data.ingredients || '');
                    setAllergens(data.allergens || '');
                    setConsumerInfo(data.consumer_info || '');
                    setIsActive(data.is_available);
                    setCategory(data.category || 'classic');
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
                    ingredients,
                    allergens,
                    consumer_info: consumerInfo,
                    weight_grams: parseInt(weight) || 0,
                    stock_count: parseInt(stockCount) || 0,
                    image_url: imageUrl,
                    category,
                    is_available: isActive
                })
                .eq('id', id);

            if (updateError) throw updateError;

            router.push('/admin/products');
            router.refresh();

        } catch (error: any) {
            alert('Fehler beim Speichern: ' + error.message);
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

                        <div className="grid grid-cols-3 gap-6">
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
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lagerbestand (Stück)</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={stockCount}
                                    onChange={e => setStockCount(e.target.value)}
                                    placeholder="z.B. 50"
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Zutatenliste</label>
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
                            <label className="block text-sm font-medium text-gray-700 mb-2">Allergene</label>
                            <textarea
                                rows={2}
                                value={allergens}
                                onChange={e => setAllergens(e.target.value)}
                                placeholder="z.B. Enthält Gluten (Dinkel), Eier, Milch. Kann Spuren von Nüssen enthalten."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                            />
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

                        <div className="flex items-center gap-3 pt-4">
                            <input
                                type="checkbox"
                                id="active"
                                checked={isActive}
                                onChange={e => setIsActive(e.target.checked)}
                                className="w-5 h-5 rounded border-gray-300 text-[var(--color-brand-primary)] focus:ring-[var(--color-brand-primary)]"
                            />
                            <label htmlFor="active" className="font-medium text-gray-900 cursor-pointer">Im Shop anzeigen (Aktiv)</label>
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
