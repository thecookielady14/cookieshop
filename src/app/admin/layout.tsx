'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { LayoutDashboard, Menu, X, Layers, Package, Cookie, ShoppingCart, ChefHat, Wheat, Tag, Route, Users, Settings, LogOut } from "lucide-react";
import { createBrowserClient } from '@supabase/ssr';

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname();
    const router = useRouter();
    /** Nur auf dem Handy: aufgeklapptes Menü. */
    const [menuOpen, setMenuOpen] = useState(false);

    // Nach dem Antippen eines Menüpunkts wieder zuklappen.
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setMenuOpen(false);
    }, [pathname]);

    const handleLogout = async () => {
        const supabase = createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        );
        await supabase.auth.signOut();
        router.push('/admin/login');
        router.refresh();
    };

    const navItems = [
        { name: 'Übersicht', href: '/admin', icon: LayoutDashboard },
        { name: 'Linien', href: '/admin/lines', icon: Layers },
        { name: 'Sorten', href: '/admin/varieties', icon: Cookie },
        { name: 'Verkaufsartikel', href: '/admin/products', icon: Package },
        { name: 'Bestellungen', href: '/admin/orders', icon: ShoppingCart },
        { name: 'Backliste', href: '/admin/backliste', icon: ChefHat },
        { name: 'Zutaten', href: '/admin/zutaten', icon: Wheat },
        { name: 'Backchargen', href: '/admin/backchargen', icon: Tag },
        { name: 'Rückverfolgung', href: '/admin/rueckverfolgung', icon: Route },
        { name: 'Kunden', href: '/admin/customers', icon: Users },
        { name: 'Einstellungen', href: '/admin/settings', icon: Settings },
    ];

    /** Unterseiten (z. B. eine einzelne Backcharge) markieren ihren Menüpunkt mit. */
    const isActiveItem = (href: string) =>
        pathname === href || (href !== '/admin' && pathname.startsWith(href + '/'));

    return (
        <div className="admin-root min-h-screen bg-gray-50 flex flex-col md:flex-row">
            {/* Admin Sidebar */}
            {/* Die Leiste stand im Fluss UND der Inhalt hatte zusätzlich ml-64 –
                der Abstand wurde doppelt gezählt, daher die breite weiße Fläche.
                Außerdem widersprachen sich md:fixed und md:static. Jetzt: im
                Fluss, aber klebend, damit sie beim Scrollen stehen bleibt. */}
            {/* Am PC eine feste Seitenleiste. Auf dem Handy war das eine
                seitlich wischbare Leiste, in der nur drei von elf Punkten zu
                sehen waren und „Abmelden" ganz fehlte – deshalb dort eine
                Kopfzeile mit aufklappbarem Menü. */}
            <aside className="w-full md:w-64 shrink-0 bg-white border-b md:border-b-0 md:border-r border-gray-200 flex flex-col sticky top-0 md:h-screen z-30 md:pt-8 md:pb-6">
                {/* Branding & Logo */}
                <div className="px-4 md:px-6 py-3 md:py-0 md:mb-8 flex md:flex-col items-center gap-3 md:gap-0">
                    <img
                        src="/logo.jpeg"
                        alt="The Cookie Lady"
                        className="w-10 h-10 md:w-24 md:h-24 rounded-full object-cover shadow-sm md:mb-4 border-2 border-gray-50 flex-shrink-0"
                    />
                    <span className="font-serif font-black text-lg md:text-xl text-left md:text-center leading-tight text-gray-900 whitespace-nowrap md:whitespace-normal">
                        The Cookie<br className="hidden md:block" /> Lady
                    </span>
                    <button
                        type="button"
                        onClick={() => setMenuOpen((o) => !o)}
                        aria-expanded={menuOpen}
                        aria-controls="admin-nav"
                        aria-label={menuOpen ? 'Menü schließen' : 'Menü öffnen'}
                        className="md:hidden ml-auto flex items-center gap-2 px-3 py-2 rounded-xl border border-gray-200 text-gray-700 whitespace-nowrap"
                    >
                        {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                        <span className="text-sm font-medium">{menuOpen ? 'Schließen' : 'Menü'}</span>
                    </button>
                </div>

                <nav
                    id="admin-nav"
                    className={`${menuOpen ? 'grid' : 'hidden'} md:flex grid-cols-2 md:flex-col gap-2 px-4 pb-4 md:pb-0 border-t md:border-t-0 border-gray-100 pt-3 md:pt-0 max-h-[calc(100dvh-4rem)] overflow-y-auto md:max-h-none md:flex-1 md:min-h-0`}
                >
                    {navItems.map((item) => {
                        const Icon = item.icon;
                        const isActive = isActiveItem(item.href);
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex items-center gap-2.5 md:gap-3 px-3 md:px-4 py-3 rounded-xl transition-colors text-[15px] md:text-base ${isActive
                                    ? 'bg-[var(--color-brand-primary)] text-white font-medium shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                    }`}
                            >
                                <Icon className="w-5 h-5 flex-shrink-0" />
                                <span className="truncate">{item.name}</span>
                            </Link>
                        )
                    })}
                    <button
                        onClick={handleLogout}
                        className="md:hidden flex items-center gap-2.5 px-3 py-3 rounded-xl text-[15px] text-gray-600 hover:bg-red-50 hover:text-red-600 text-left"
                    >
                        <LogOut className="w-5 h-5 flex-shrink-0" />
                        <span>Abmelden</span>
                    </button>
                </nav>

                <div className="px-4 pt-2 hidden md:block">
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
            <main className="flex-1 min-w-0 p-4 md:p-8">
                {children}
            </main>
        </div>
    );
}
