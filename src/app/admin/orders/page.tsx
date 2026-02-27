import { supabase } from "@/lib/supabase";
import { CopyPlus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function AdminOrders() {
    // Fetch orders from Supabase (in a real app, this would be authenticated)
    let { data: fetchedOrders, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

    // Mock Backend data for development
    let orders = fetchedOrders;
    if (error || !orders) {
        orders = [
            {
                id: 'ord-123',
                customer_name: 'Max Mustermann',
                customer_email: 'max@example.com',
                amount_total: 19.80,
                status: 'pending',
                items: [{ name: 'Classic Chocolate Chip', quantity: 2 }, { name: 'Double Choc Fudge', quantity: 2 }],
                created_at: new Date().toISOString()
            },
            {
                id: 'ord-124',
                customer_name: 'Anna Schmidt',
                customer_email: 'anna@example.com',
                amount_total: 11.70,
                status: 'paid',
                items: [{ name: 'Peanut Butter Crunch', quantity: 3 }],
                created_at: new Date(Date.now() - 86400000).toISOString()
            }
        ];
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold">Bezahlt</span>;
            case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold">In Bearbeitung</span>;
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
                        {orders?.map((order: any) => (
                            <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors cursor-pointer group">
                                <td className="p-4">
                                    <span className="font-bold text-gray-900 block">{order.id.substring(0, 8)}</span>
                                    <span className="text-xs text-gray-500">{order.items.length} Artikel</span>
                                </td>
                                <td className="p-4">
                                    <span className="font-medium text-gray-900 block">{order.customer_name}</span>
                                    <span className="text-xs text-gray-500">{order.customer_email}</span>
                                </td>
                                <td className="p-4 text-gray-600">
                                    {new Date(order.created_at).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </td>
                                <td className="p-4">
                                    {getStatusBadge(order.status)}
                                </td>
                                <td className="p-4 text-gray-900 font-bold">
                                    {order.amount_total.toFixed(2).replace('.', ',')} €
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {orders?.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        Noch keine Bestellungen eingegangen.
                    </div>
                )}
            </div>
        </div>
    );
}
