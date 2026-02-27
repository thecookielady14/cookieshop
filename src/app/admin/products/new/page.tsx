'use client';

import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function NewProduct() {
    const router = useRouter();
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [price, setPrice] = useState('');
    const [stock, setStock] = useState('');
    const [ingredients, setIngredients] = useState('');
    const [isActive, setIsActive] = useState(true);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            let imageUrl = null;

            // 1. Upload image if selected
            if (imageFile) {
                const fileExt = imageFile.name.split('.').pop();
                const fileName = `${Math.random()}.${fileExt}`;
                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('products')
                    .upload(fileName, imageFile);

                if (uploadError) throw uploadError;

                // Get public URL
                const { data: { publicUrl } } = supabase.storage
                    .from('products')
                    .getPublicUrl(fileName);

                imageUrl = publicUrl;
            }

            // 2. Insert product into database
            const { error: insertError } = await supabase
                .from('products')
                .insert([
                    {
                        name,
                        description,
                        price: parseFloat(price.replace(',', '.')),
                        ingredients,
                        weight_grams: parseInt(stock) || 0,
                        image_url: imageUrl,
                        is_bestseller: false, // We can add a separate toggle for this later if needed
                        is_available: isActive
                    }
                ]);

            if (insertError) throw insertError;

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
                <h1 className="text-3xl font-bold text-gray-900">Neuen Keks anlegen</h1>
            </div>

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
                                <label className="block text-sm font-medium text-gray-700 mb-2">Lagerbestand</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={stock}
                                    onChange={e => setStock(e.target.value)}
                                    placeholder="100"
                                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                                    required
                                />
                            </div>
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
                                placeholder="z.B. Mehl, Butter, Zucker, Brauner Zucker, Eier, Vanille..."
                                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Produktbild</label>
                            <label className="border-2 border-dashed border-gray-200 rounded-xl p-8 text-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer text-gray-500 block">
                                <span className="block text-3xl mb-2">{imageFile ? '✅' : '📸'}</span>
                                <span className="text-sm font-medium">
                                    {imageFile ? imageFile.name : 'Klicke hier, um ein Bild hochzuladen'}
                                </span>
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
        </div>
    );
}
