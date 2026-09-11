import { supabase } from "@/lib/supabase";
import { CopyPlus } from "lucide-react";
import Link from "next/link";
import ClientProductTable from "./ClientProductTable";

export const dynamic = 'force-dynamic';

export default async function AdminProducts() {
    // Fetch products
    const { data: fetchedProducts } = await supabase
        .from('products')
        .select('*, product_lines(name), product_varieties(quantity, varieties(name))')
        .order('created_at', { ascending: false });

    // Use only the real backend data now
    const products = fetchedProducts || [];

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <h1 className="text-3xl font-bold text-gray-900">Verkaufsartikel</h1>
                <Link
                    href="/admin/products/new"
                    className="bg-[var(--color-brand-text)] text-white px-6 py-3 rounded-xl font-bold hover:bg-neutral-800 transition-colors flex items-center gap-2"
                >
                    <CopyPlus className="w-5 h-5" />
                    Neuer Verkaufsartikel
                </Link>
            </div>
            <p className="text-gray-500 mb-8 max-w-2xl">
                <strong className="text-gray-700">Verkaufsartikel sind das, was im Warenkorb
                landet</strong> – ein Sechserkarton, eine Tüte, eine Packung. Jeder Artikel hat
                einen Preis und besteht aus einer oder mehreren{' '}
                <Link href="/admin/varieties" className="text-[var(--color-brand-primary)] underline">Sorten</Link>.
            </p>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <ClientProductTable initialProducts={products} />
            </div>
        </div>
    );
}
