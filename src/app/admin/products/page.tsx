import { supabase } from "@/lib/supabase";
import { CopyPlus } from "lucide-react";
import Link from "next/link";
import ClientProductTable from "./ClientProductTable";

export const dynamic = 'force-dynamic';

export default async function AdminProducts() {
    // Fetch products
    const { data: fetchedProducts } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    // Use only the real backend data now
    const products = fetchedProducts || [];

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
                <ClientProductTable initialProducts={products} />
            </div>
        </div>
    );
}
