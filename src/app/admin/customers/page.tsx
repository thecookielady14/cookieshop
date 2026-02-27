import { supabase } from "@/lib/supabase";
import { CopyPlus, Edit, Trash2 } from "lucide-react";
import Link from "next/link";

export default async function AdminCustomers() {
    // In a real scenario we might derive customers from Stripe or Orders
    let { data: fetchedOrders, error } = await supabase
        .from('orders')
        .select('customer_name, customer_email, created_at')
        .order('created_at', { ascending: false });

    // Mock Backend data for development
    let customers: any[] = [];
    if (error || !fetchedOrders) {
        customers = [
            { id: '1', name: 'Max Mustermann', email: 'max@example.com', orders_count: 5, total_spent: 145.50, last_order: new Date().toISOString() },
            { id: '2', name: 'Anna Schmidt', email: 'anna@example.com', orders_count: 2, total_spent: 35.80, last_order: new Date(Date.now() - 86400000).toISOString() },
            { id: '3', name: 'Lisa CookieLover', email: 'lisa@beispiel.de', orders_count: 12, total_spent: 340.00, last_order: new Date(Date.now() - 172800000).toISOString() }
        ];
    } else {
        // Basic grouping logic for real data (placeholder)
        const customerMap = new Map();
        fetchedOrders.forEach(order => {
            if (!customerMap.has(order.customer_email)) {
                customerMap.set(order.customer_email, {
                    name: order.customer_name,
                    email: order.customer_email,
                    orders_count: 1,
                    last_order: order.created_at
                });
            } else {
                customerMap.get(order.customer_email).orders_count++;
            }
        });
        customers = Array.from(customerMap.values());
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Kunden</h1>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-100">
                            <th className="p-4 font-semibold text-gray-500">Name</th>
                            <th className="p-4 font-semibold text-gray-500">E-Mail</th>
                            <th className="p-4 font-semibold text-gray-500 text-center">Bestellungen</th>
                            <th className="p-4 font-semibold text-gray-500">Umsatz gesamt</th>
                            <th className="p-4 font-semibold text-gray-500">Letzte Bestellung</th>
                        </tr>
                    </thead>
                    <tbody>
                        {customers?.map((customer: any, idx) => (
                            <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                <td className="p-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-text)] flex items-center justify-center font-bold text-sm">
                                            {customer.name.substring(0, 2).toUpperCase()}
                                        </div>
                                        <span className="font-medium text-gray-900">{customer.name}</span>
                                    </div>
                                </td>
                                <td className="p-4 text-gray-600">{customer.email}</td>
                                <td className="p-4 text-center">
                                    <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">
                                        {customer.orders_count}
                                    </span>
                                </td>
                                <td className="p-4 text-gray-900 font-bold">
                                    {customer.total_spent ? `${customer.total_spent.toFixed(2).replace('.', ',')} €` : '-'}
                                </td>
                                <td className="p-4 text-gray-600">
                                    {new Date(customer.last_order).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>

                {customers?.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        Noch keine Kunden registriert.
                    </div>
                )}
            </div>
        </div>
    );
}
