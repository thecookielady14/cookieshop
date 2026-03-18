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
        <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Admin Sidebar */}
            <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col md:fixed h-auto md:h-full z-10 pt-4 md:pt-8 pb-4 md:pb-6 relative md:static shrink-0">
                {/* Branding & Logo */}
                <div className="px-4 md:px-6 mb-4 md:mb-8 flex md:flex-col items-center md:items-center justify-start gap-4 md:gap-0">
                    <img
                        src="/logo.jpeg"
                        alt="The Cookie Lady"
                        className="w-12 h-12 md:w-24 md:h-24 rounded-full object-cover shadow-sm mb-0 md:mb-4 border-2 border-gray-50 flex-shrink-0"
                    />
                    <span className="font-serif font-black text-xl text-left md:text-center leading-tight text-gray-900 pr-4 md:pr-0">
                        The Cookie<br className="hidden md:block" />Lady
                    </span>
                </div>

                <div className="px-4 flex md:flex-col gap-2 md:space-y-2 overflow-x-auto overflow-y-hidden pb-2 md:pb-0 mb-2 md:mb-0 flex-1 md:flex-none">
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={`flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-xl transition-colors whitespace-nowrap ${isActive
                                    ? 'bg-[var(--color-brand-primary)] text-white font-medium shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span>{item.name}</span>
                            </Link>
                        )
                    })}
                </div>

                <div className="px-4 md:mt-auto hidden md:block">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 md:gap-3 px-4 py-3 rounded-xl text-gray-600 hover:bg-red-50 hover:text-red-600 w-full transition-colors text-left"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span>Abmelden</span>
                    </button>
                </div>
            </aside>

            {/* Main Admin Content */}
            <main className="flex-1 md:ml-64 p-4 md:p-8 md:pt-32 max-w-full overflow-x-hidden">
                {children}
            </main>
        </div>
    );
}
