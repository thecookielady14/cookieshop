import { supabase } from "@/lib/supabase";
import { CopyPlus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function AdminProducts() {
    // Fetch products
    let { data: fetchedProducts, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    // Use only the real backend data now
    let products = fetchedProducts || [];

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Produkte</h1>
                <Link
                    href="/admin/products/new"
                    className="bg-[var(--color-brand-text)] text-white px-6 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors flex items-center gap-2"
                >
                    <CopyPlus className="w-5 h-5" />
                    Neuer Keks
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 font-semibold text-gray-500">Name</th>
                            <th className="p-4 font-semibold text-gray-500">Preis</th>
                            <th className="p-4 font-semibold text-gray-500">Status</th>
                            <th className="p-4 font-semibold text-gray-500">Lager</th>
                            <th className="p-4 font-semibold text-gray-500 text-right">Aktionen</th>
                        </tr>
                    </thead>
                    <tbody>
                        {products?.map((product: any) => (
                            <tr key={product.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="p-4 font-medium text-gray-900">{product.name}</td>
                                <td className="p-4 text-gray-600">{product.price.toFixed(2).replace('.', ',')} €</td>
                                <td className="p-4">
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${product.is_available ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {product.is_available ? 'Aktiv' : 'Ausverkauft'}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-600">{product.stock} Stück</td>
                                <td className="p-4 text-right">
                                    <div className="flex justify-end gap-2">
                                        <button className="p-2 text-gray-400 hover:text-[var(--color-brand-primary)] bg-white rounded-lg border border-gray-200 shadow-sm transition-colors">
                                            <Edit className="w-4 h-4" />
                                        </button>
                                        <button className="p-2 text-gray-400 hover:text-red-500 bg-white rounded-lg border border-gray-200 shadow-sm transition-colors">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {products?.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        Noch keine Kekse angelegt. Fang direkt an!
                    </div>
                )}
            </div>
        </div>
    );
}
