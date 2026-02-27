import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import Link from "next/link";

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

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
            case 'processing': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold">In Bearbeitung</span>;
            case 'shipped': return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold">Versendet</span>;
            case 'delivered': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold">Zugestellt</span>;
            case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">Unbezahlt</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
        }
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Bestellungen</h1>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 font-semibold text-gray-500">Bestellung</th>
                            <th className="p-4 font-semibold text-gray-500">Kunde</th>
                            <th className="p-4 font-semibold text-gray-500">Datum</th>
                            <th className="p-4 font-semibold text-gray-500">Status</th>
                            <th className="p-4 font-semibold text-gray-500">Summe</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders?.map((order: any) => {
                            const totalItems = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                            return (
                                <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                                    <td className="p-4">
                                        <span className="font-bold text-gray-900 block">{order.id.substring(0, 8)}</span>
                                        <span className="text-xs text-gray-500">{totalItems} Artikel</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-medium text-gray-900 block">{order.customer_name || 'Unbekannt'}</span>
                                        <span className="text-xs text-gray-500">{order.customer_email}</span>
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {format(new Date(order.created_at), 'dd.MM.yyyy, HH:mm', { locale: de })}
                                    </td>
                                    <td className="p-4">
                                        {getStatusBadge(order.status)}
                                    </td>
                                    <td className="p-4 text-gray-900 font-bold">
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(order.total_amount || 0)}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {(!orders || orders.length === 0) && (
                    <div className="p-12 text-center text-gray-500">
                        Noch keine Bestellungen eingegangen.
                    </div>
                )}
            </div>
        </div>
    );
}
