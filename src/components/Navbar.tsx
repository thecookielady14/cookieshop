'use client';

import { ShoppingBasket, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useCartStore } from "@/lib/store";
import { useState } from "react";
import { usePathname } from "next/navigation";
import { useMounted } from "@/lib/useMounted";

export default function Navbar() {
    // Avoid hydration mismatch for persisted store
    const mounted = useMounted();
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const cartCount = useCartStore((state) => state.getCartCount());
    const pathname = usePathname();

    // Hide Navbar completely in admin panel
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <nav className="fixed top-0 w-full z-50 flex justify-between items-center p-6 lg:px-12 bg-[var(--color-brand-primary)] backdrop-blur-md">
                {/* Left Box */}
                <div className="flex-1 flex justify-start items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image
                            src="/logo_transparent.png"
                            alt="The Cookie Lady Logo"
                            width={50}
                            height={50}
                            className="rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <span className="font-serif font-black text-xl tracking-tight text-[var(--color-brand-accent)] group-hover:text-white transition-colors">
                            The Cookie Lady
                        </span>
                    </Link>
                </div>

                {/* Center Box – Desktop only */}
                <div className="hidden lg:flex flex-1 justify-center gap-6 xl:gap-10 font-bold text-lg">
                    {[
                        { href: '/', label: 'Start', exact: true },
                        { href: '/shop', label: 'Shop', exact: false },
                        { href: '/about', label: 'Über mich', exact: false },
                        { href: '/faq', label: 'FAQ', exact: false },
                    ].map(({ href, label, exact }) => {
                        const isActive = exact ? pathname === href : pathname?.startsWith(href);
                        return (
                            <Link
                                key={href}
                                href={href}
                                prefetch={false}
                                className={`relative whitespace-nowrap transition pb-0.5 ${isActive ? 'text-white' : 'text-[var(--color-brand-secondary)] hover:text-white'}`}
                            >
                                {label}
                                {isActive && (
                                    <span className="absolute -bottom-1 left-0 w-full h-0.5 bg-[var(--color-brand-accent)] rounded-full" />
                                )}
                            </Link>
                        );
                    })}
                </div>

                {/* Right Box */}
                <div className="flex-1 flex justify-end items-center gap-3">
                    <Link href="/cart" className="relative p-2 bg-white/70 backdrop-blur-md rounded-full shadow-sm hover:shadow-md transition flex items-center justify-center">
                        <ShoppingBasket className="w-5 h-5 text-[var(--color-brand-text)]" />
                        {mounted && cartCount > 0 && (
                            <motion.span
                                key={cartCount}
                                initial={{ scale: 0.3, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 500, damping: 15 }}
                                className="absolute -top-1 -right-1 bg-[var(--color-brand-primary)] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center"
                            >
                                {cartCount}
                            </motion.span>
                        )}
                    </Link>

                    {/* Hamburger Button – Mobile only */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="lg:hidden p-2 bg-white/70 backdrop-blur-md rounded-full shadow-sm hover:shadow-md transition flex items-center justify-center"
                        aria-label="Menü öffnen"
                    >
                        {mobileMenuOpen ? (
                            <X className="w-5 h-5 text-[var(--color-brand-text)]" />
                        ) : (
                            <Menu className="w-5 h-5 text-[var(--color-brand-text)]" />
                        )}
                    </button>
                </div>
            </nav>

            {/* Mobile Menu Overlay */}
            {mobileMenuOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-72 bg-[var(--color-brand-primary)] z-50 transform transition-transform duration-300 ease-in-out lg:hidden ${
                    mobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                <div className="flex justify-end p-6">
                    <button
                        onClick={() => setMobileMenuOpen(false)}
                        className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition"
                        aria-label="Menü schließen"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>
                <div className="flex flex-col gap-2 px-8">
                    <Link href="/" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white text-xl font-bold py-3 border-b border-white/10 transition-colors">
                        Start
                    </Link>
                    <Link href="/shop" prefetch={false} onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white text-xl font-bold py-3 border-b border-white/10 transition-colors">
                        Shop
                    </Link>
                    <Link href="/about" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white text-xl font-bold py-3 border-b border-white/10 transition-colors">
                        Über mich
                    </Link>
                    <Link href="/faq" onClick={() => setMobileMenuOpen(false)} className="text-white/90 hover:text-white text-xl font-bold py-3 border-b border-white/10 transition-colors">
                        FAQ
                    </Link>
                    <Link href="/cart" onClick={() => setMobileMenuOpen(false)} className="text-[var(--color-brand-accent)] hover:text-white text-xl font-bold py-3 transition-colors flex items-center gap-2">
                        <ShoppingBasket className="w-5 h-5" />
                        Warenkorb
                        {mounted && cartCount > 0 && (
                            <span className="bg-[var(--color-brand-accent)] text-[var(--color-brand-primary)] text-xs font-bold px-2 py-0.5 rounded-full">
                                {cartCount}
                            </span>
                        )}
                    </Link>
                </div>
            </div>
        </>
    );
}
