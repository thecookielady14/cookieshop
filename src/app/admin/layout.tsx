'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut } from "lucide-react";

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const router = useRouter();

    const handleLogout = () => {
        document.cookie = "admin_auth=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        router.push('/admin/login');
    };

    const navItems = [
        { name: 'Übersicht', href: '/admin', icon: LayoutDashboard },
        { name: 'Produkte', href: '/admin/products', icon: Package },
        { name: 'Bestellungen', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Kunden', href: '/admin/customers', icon: Users },
    ];

    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Admin Sidebar */}
            <aside className="w-64 bg-white border-r border-gray-200 flex flex-col fixed h-full z-10 pt-8 pb-6">
                {/* Branding & Logo */}
                <div className="px-6 mb-8 flex flex-col items-center">
                    <img
                        src="/logo.jpeg"
                        alt="The Cookie Lady"
                        className="w-24 h-24 rounded-full object-cover shadow-sm mb-4 border-2 border-gray-50"
                    />
                    <span className="font-serif font-black text-xl text-center leading-tight text-gray-900 group-hover:text-[var(--color-brand-accent)] transition-colors">
                        The Cookie<br />Lady
                    </span>
                </div>

                <div className="flex-1 px-4 space-y-2">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${isActive
                                    ? 'bg-[var(--color-brand-primary)] text-white font-medium'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5" />
                                {item.name}
                            </Link>
                        )
                    })}
                </div>

                <div className="px-4 mt-auto">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors text-left"
                    >
                        <LogOut className="w-5 h-5" />
                        Abmelden
                    </button>
                </div>
            </aside>

            {/* Main Admin Content */}
            <main className="flex-1 ml-64 p-8 pt-32">
                {children}
            </main>
        </div>
    );
}
