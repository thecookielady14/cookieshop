'use client';

import { ShoppingBag } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useCartStore } from "@/lib/store";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const [mounted, setMounted] = useState(false);
    const cartCount = useCartStore((state) => state.getCartCount());
    const pathname = usePathname();

    // Avoid hydration mismatch for persisted store
    useEffect(() => {
        setMounted(true);
    }, []);

    // Hide Navbar completely in admin panel
    if (pathname?.startsWith('/admin')) {
        return null;
    }

    return (
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

            {/* Center Box */}
            <div className="hidden md:flex flex-1 justify-center gap-10 font-bold text-lg">
                <Link href="/" className="text-[var(--color-brand-secondary)] hover:text-white transition">Start</Link>
                <Link href="/shop" className="text-[var(--color-brand-secondary)] hover:text-white transition">Shop</Link>
                <Link href="/about" className="text-[var(--color-brand-secondary)] hover:text-white transition">Über mich</Link>
            </div>

            {/* Right Box */}
            <div className="flex-1 flex justify-end">
                <Link href="/cart" className="relative p-2 bg-white/70 backdrop-blur-md rounded-full shadow-sm hover:shadow-md transition flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-[var(--color-brand-text)]" />
                    {mounted && cartCount > 0 && (
                        <span className="absolute -top-1 -right-1 bg-[var(--color-brand-primary)] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                            {cartCount}
                        </span>
                    )}
                </Link>
            </div>
        </nav>
    );
}
