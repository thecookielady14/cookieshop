import { Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { format } from "date-fns";
import { de } from "date-fns/locale";

// Initialize Supabase client for Server Component
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Disable caching for the admin dashboard

export default async function AdminDashboard() {
    // 1. Fetch Orders
    const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                quantity,
                price_at_purchase
            )
        `)
        .order('created_at', { ascending: false });

    // 2. Fetch Products
    const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, is_available');

    if (ordersError) console.error("Error fetching orders:", ordersError);
    if (productsError) console.error("Error fetching products:", productsError);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let umsatzHeute = 0;
    let neueBestellungenHeute = 0;
    const uniqueCustomers = new Set();
    const recentOrders = orders?.slice(0, 5) || [];

    orders?.forEach(order => {
        // Calculate Total Customers (unique email)
        if (order.customer_email) {
            uniqueCustomers.add(order.customer_email);
        }

        // Calculate Revenue and Orders for "Today"
        const orderDate = new Date(order.created_at);
        if (orderDate >= today) {
            neueBestellungenHeute++;
            umsatzHeute += order.total_amount;
        }
    });

    const activeProducts = products?.filter(p => p.is_available).length || 0;
    const totalCustomers = uniqueCustomers.size;

    return (
        <div>
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Hallo, Cookie Lady! 👋</h1>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-orange-100 text-orange-600 rounded-xl">
                        <TrendingUp className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Umsatz Heute</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(umsatzHeute)}
                        </p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Neue Bestellungen</p>
                        <p className="text-2xl font-bold text-gray-900">{neueBestellungenHeute}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-green-100 text-green-600 rounded-xl">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Aktive Produkte</p>
                        <p className="text-2xl font-bold text-gray-900">{activeProducts}</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Kunden gesamt</p>
                        <p className="text-2xl font-bold text-gray-900">{totalCustomers}</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 h-fit">
                    <h2 className="text-xl font-bold mb-6">Schnellzugriff</h2>
                    <div className="space-y-4">
                        <Link href="/admin/products" className="block p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all flex justify-between items-center group">
                            <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-[var(--color-brand-primary)]">Neuen Keks hinzufügen</h3>
                                <p className="text-sm text-gray-500">Erweitere dein Sortiment.</p>
                            </div>
                            <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                        <Link href="/admin/orders" className="block p-4 rounded-xl border border-gray-100 hover:border-gray-300 hover:shadow-sm transition-all flex justify-between items-center group">
                            <div>
                                <h3 className="font-bold text-gray-900 group-hover:text-[var(--color-brand-primary)]">Bestellungen prüfen</h3>
                                <p className="text-sm text-gray-500">Offene Bestellungen abwickeln.</p>
                            </div>
                            <span className="text-gray-400 group-hover:translate-x-1 transition-transform">→</span>
                        </Link>
                    </div>
                </div>

                {/* Recent Orders Overview */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                    <h2 className="text-xl font-bold mb-6 flex justify-between items-end">
                        Letzte Bestellungen
                        <Link href="/admin/orders" className="text-sm font-medium text-[var(--color-brand-primary)] hover:underline">Alle ansehen</Link>
                    </h2>

                    <div className="space-y-4">
                        {recentOrders.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Noch keine Bestellungen eingegangen.</p>
                        ) : (
                            recentOrders.map((order) => {
                                const initials = order.customer_name
                                    ? order.customer_name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                    : '??';

                                // Calculate total items in this order
                                const totalItems = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;

                                return (
                                    <div key={order.id} className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700">
                                                {initials}
                                            </div>
                                            <div>
                                                <h4 className="font-bold text-sm text-gray-900 line-clamp-1">{order.customer_name || 'Unbekannt'}</h4>
                                                <p className="text-xs text-gray-500">
                                                    {format(new Date(order.created_at), 'dd.MM., HH:mm', { locale: de })} • {totalItems} Kekse
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className={`inline-block px-2 py-1 text-xs font-bold rounded-md mb-1 ${order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                                    order.status === 'processing' ? 'bg-blue-100 text-blue-800' :
                                                        order.status === 'shipped' ? 'bg-purple-100 text-purple-800' :
                                                            'bg-green-100 text-green-800'
                                                }`}>
                                                {order.status === 'pending' ? 'Unbezahlt' :
                                                    order.status === 'processing' ? 'In Bearbeitung' :
                                                        order.status === 'shipped' ? 'Versendet' :
                                                            order.status === 'delivered' ? 'Zugestellt' : order.status}
                                            </span>
                                            <p className="font-bold text-sm text-gray-900">
                                                {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(order.total_amount)}
                                            </p>
                                        </div>
                                    </div>
                                )
                            })
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
