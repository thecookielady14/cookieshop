import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Phone } from "lucide-react";
import ClientOrderTable from "./ClientOrderTable";

// Initialize Supabase client for Server Component
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Disable caching for the admin orders page

export default async function AdminOrders() {
    // Fetch orders from Supabase
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                quantity
            )
        `)
        .order('created_at', { ascending: false });

    if (error) console.error("Error fetching admin orders:", error);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Bestellungen</h1>
                <Link
                    href="/admin/orders/new"
                    className="flex items-center gap-2 bg-[var(--color-brand-primary)] text-white px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                    <Phone className="w-4 h-4" />
                    Telefonbestellung
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <ClientOrderTable initialOrders={orders || []} />
            </div>
        </div>
    );
}
