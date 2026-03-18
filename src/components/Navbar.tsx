'use client';

import { ShoppingBag, Menu, X } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const [mounted, setMounted] = useState(false);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const cartCount = useCartStore((state) => state.getCartCount());
    const pathname = usePathname();

    // Avoid hydration mismatch for persisted store
    useEffect(() => {
        setMounted(true);
    }, []);

    // Close mobile menu on route change
    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    // Hide Navbar completely in admin panel
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
        <>
            <nav className="absolute top-0 w-full z-50 flex justify-between items-center p-6 lg:px-12 bg-transparent">
                {/* Left Box */}
                <div className="flex-1 flex justify-start items-center">
                    <Link href="/" className="flex items-center gap-3 group">
                        <Image
                            src="/logo.jpeg"
                            alt="The Cookie Lady Logo"
                            width={50}
                            height={50}
                            className="rounded-full object-cover shadow-sm group-hover:scale-105 transition-transform"
                        />
                        <span className="font-serif font-black text-xl tracking-tight text-[var(--color-brand-primary)] group-hover:text-[var(--color-brand-accent)] transition-colors">
                            The Cookie Lady
                        </span>
                    </Link>
                </div>

                {/* Center Box – Desktop only */}
                <div className="hidden md:flex flex-1 justify-center gap-10 font-bold text-lg">
                    <Link href="/" className="text-[var(--color-brand-secondary)] hover:text-white transition">Start</Link>
                    <Link href="/shop" prefetch={false} className="text-[var(--color-brand-secondary)] hover:text-white transition">Shop</Link>
                    <Link href="/about" className="text-[var(--color-brand-secondary)] hover:text-white transition">Über mich</Link>
                </div>

                {/* Right Box */}
                <div className="flex-1 flex justify-end items-center gap-3">
                    <Link href="/cart" className="relative p-2 bg-white/70 backdrop-blur-md rounded-full shadow-sm hover:shadow-md transition flex items-center justify-center">
                        <ShoppingBag className="w-5 h-5 text-[var(--color-brand-text)]" />
                        {mounted && cartCount > 0 && (
                            <span className="absolute -top-1 -right-1 bg-[var(--color-brand-primary)] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                                {cartCount}
                            </span>
                        )}
                    </Link>

                    {/* Hamburger Button – Mobile only */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 bg-white/70 backdrop-blur-md rounded-full shadow-sm hover:shadow-md transition flex items-center justify-center"
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
                    className="fixed inset-0 bg-black/40 z-40 md:hidden"
                    onClick={() => setMobileMenuOpen(false)}
                />
            )}

            {/* Mobile Menu Panel */}
            <div
                className={`fixed top-0 right-0 h-full w-72 bg-[var(--color-brand-primary)] z-50 transform transition-transform duration-300 ease-in-out md:hidden ${
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
                    <Link
                        href="/"
                        className="text-white/90 hover:text-white text-xl font-bold py-3 border-b border-white/10 transition-colors"
                    >
                        Start
                    </Link>
                    <Link
                        href="/shop"
                        prefetch={false}
                        className="text-white/90 hover:text-white text-xl font-bold py-3 border-b border-white/10 transition-colors"
                    >
                        Shop
                    </Link>
                    <Link
                        href="/about"
                        className="text-white/90 hover:text-white text-xl font-bold py-3 border-b border-white/10 transition-colors"
                    >
                        Über mich
                    </Link>
                    <Link
                        href="/faq"
                        className="text-white/90 hover:text-white text-xl font-bold py-3 border-b border-white/10 transition-colors"
                    >
                        FAQ
                    </Link>
                    <Link
                        href="/cart"
                        className="text-[var(--color-brand-accent)] hover:text-white text-xl font-bold py-3 transition-colors flex items-center gap-2"
                    >
                        <ShoppingBag className="w-5 h-5" />
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
