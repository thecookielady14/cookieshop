import { Package, ShoppingCart, TrendingUp, Users } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
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
                        <p className="text-2xl font-bold text-gray-900">142,50 €</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-blue-100 text-blue-600 rounded-xl">
                        <ShoppingCart className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Neue Bestellungen</p>
                        <p className="text-2xl font-bold text-gray-900">12</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-green-100 text-green-600 rounded-xl">
                        <Package className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Aktive Produkte</p>
                        <p className="text-2xl font-bold text-gray-900">5</p>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-center gap-4">
                    <div className="p-4 bg-purple-100 text-purple-600 rounded-xl">
                        <Users className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500">Kunden gesamt</p>
                        <p className="text-2xl font-bold text-gray-900">128</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Quick Actions */}
                <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
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
                        {/* Dummy Order */}
                        <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-full bg-orange-200 flex items-center justify-center font-bold text-orange-700">
                                    MM
                                </div>
                                <div>
                                    <h4 className="font-bold text-sm text-gray-900">Max Mustermann</h4>
                                    <p className="text-xs text-gray-500">Vor 2 Stunden • 4 Kekse</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-800 text-xs font-bold rounded-md mb-1">In Bearbeitung</span>
                                <p className="font-bold text-sm text-gray-900">19,80 €</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
