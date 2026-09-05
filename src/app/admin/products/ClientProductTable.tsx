'use client';

import { supabase } from "@/lib/supabase";
import { Edit, Trash2 } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ClientProductTable({ initialProducts }: { initialProducts: any[] }) {
    const [products, setProducts] = useState(initialProducts);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);
    const router = useRouter();

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Möchtest du den Keks "${name}" wirklich löschen?`)) return;

        setIsDeleting(id);
        
        try {
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) throw error;

            // Remove from local state to update UI instantly
            setProducts(products.filter(p => p.id !== id));
            router.refresh(); // Refresh server state as well
            
        } catch (error: any) {
            alert('Fehler beim Löschen: ' + error.message);
        } finally {
            setIsDeleting(null);
        }
    };

    if (products.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                Noch keine Kekse angelegt. Fang direkt an!
            </div>
        );
    }

    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 font-semibold text-gray-500">Name</th>
                    <th className="p-4 font-semibold text-gray-500">Kategorie</th>
                    <th className="p-4 font-semibold text-gray-500">Preis</th>
                    <th className="p-4 font-semibold text-gray-500">Status</th>
                    <th className="p-4 font-semibold text-gray-500">Lager</th>
                    <th className="p-4 font-semibold text-gray-500 text-right">Aktionen</th>
                </tr>
            </thead>
            <tbody>
                {products.map((product: any) => (
                    <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                        <td className="p-4 font-medium text-gray-900">{product.name}</td>
                        <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                                product.category === 'kids' ? 'bg-pink-100 text-pink-700' : 'bg-amber-100 text-amber-700'
                            }`}>
                                {product.category === 'kids' ? 'Kids' : 'Classic'}
                            </span>
                        </td>
                        <td className="p-4 text-gray-600">{product.price.toFixed(2).replace('.', ',')} €</td>
                        <td className="p-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                }`}>
                                {product.is_available ? 'Bestellbar' : 'Nicht bestellbar'}
                            </span>
                        </td>
                        <td className="p-4 text-gray-600">{product.weight_grams}g</td>
                        <td className="p-4 text-right">
                            <div className="flex justify-end gap-2">
                                <Link 
                                    href={`/admin/products/${product.id}/edit`}
                                    title="Bearbeiten" 
                                    className="p-2 text-gray-400 hover:text-[var(--color-brand-primary)] bg-white rounded-lg border border-gray-200 shadow-sm transition-colors block"
                                >
                                    <Edit className="w-4 h-4" />
                                </Link>
                                <button 
                                    onClick={() => handleDelete(product.id, product.name)}
                                    disabled={isDeleting === product.id}
                                    title="Löschen"
                                    className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg border border-gray-200 shadow-sm transition-colors disabled:opacity-50"
                                >
                                    <Trash2 className={`w-4 h-4 ${isDeleting === product.id ? 'animate-pulse text-red-500' : ''}`} />
                                </button>
                            </div>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
}
