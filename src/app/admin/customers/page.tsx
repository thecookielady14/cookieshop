import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Initialize Supabase client for Server Component
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Disable caching for the admin customers page

export default async function AdminCustomers() {
    // Fetch all orders to derive customers
    const { data: fetchedOrders, error } = await supabase
        .from('orders')
        .select('customer_name, customer_email, total_amount, created_at')
        .order('created_at', { ascending: false });

    if (error) console.error("Error fetching orders for customers view:", error);

    const customerMap = new Map();

    if (fetchedOrders) {
        fetchedOrders.forEach(order => {
            if (!order.customer_email) return; // Skip if no email

            if (!customerMap.has(order.customer_email)) {
                customerMap.set(order.customer_email, {
                    name: order.customer_name || 'Unbekannt',
                    email: order.customer_email,
                    orders_count: 1,
                    total_spent: order.total_amount || 0,
                    last_order: order.created_at
                });
            } else {
                const existing = customerMap.get(order.customer_email);
                existing.orders_count += 1;
                existing.total_spent += (order.total_amount || 0);
                // Since orders are sorted descending, the first one encountered is the latest
                // We keep the first one's last_order date
            }
        });
    }

    const customers = Array.from(customerMap.values());

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
                        {customers.map((customer: any, idx) => {
                            const initials = customer.name
                                ? customer.name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                : '??';

                            return (
                                <tr key={idx} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="p-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full bg-[var(--color-brand-secondary)] text-[var(--color-brand-text)] flex items-center justify-center font-bold text-sm">
                                                {initials}
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
                                        {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(customer.total_spent)}
                                    </td>
                                    <td className="p-4 text-gray-600">
                                        {format(new Date(customer.last_order), 'dd.MM.yyyy', { locale: de })}
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>

                {customers.length === 0 && (
                    <div className="p-12 text-center text-gray-500">
                        Noch keine Kunden registriert.
                    </div>
                )}
            </div>
        </div>
    );
}
