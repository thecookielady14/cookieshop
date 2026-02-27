'use client';

import { useCartStore } from "@/lib/store";
import { Plus } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    emoji?: string;
    is_available?: boolean;
}

export default function ProductCard({ product }: { product: Product }) {
    return (
        <Link href={`/shop/${product.id}`} className="group block">
            <div className={`aspect-square bg-[var(--color-brand-secondary)] rounded-3xl mb-4 overflow-hidden relative border border-neutral-100 shadow-sm ${product.is_available === false ? 'grayscale opacity-70' : ''}`}>
                {/* Placeholder Emoji display until real images exist */}
                <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                    {product.emoji || '🍪'}
                </div>
            </div>
            <h3 className="text-xl font-bold mb-1 group-hover:text-[var(--color-brand-primary)] transition-colors">
                {product.name}
            </h3>
            <p className="text-[var(--color-brand-dark)] mb-4 h-12 overflow-hidden text-sm">
                {product.description}
            </p>

            <div className="flex justify-between items-center mt-auto">
                <span className="font-bold text-xl text-[var(--color-brand-text)]">{product.price.toFixed(2).replace('.', ',')} €</span>
                {product.is_available === false ? (
                    <span className="flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm bg-gray-100 text-gray-500">
                        Ausverkauft
                    </span>
                ) : (
                    <span className="flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm bg-[var(--color-brand-bg)] text-[var(--color-brand-primary)] group-hover:bg-[var(--color-brand-primary)] group-hover:text-white transition-all">
                        Zum Artikel
                    </span>
                )}
            </div>
        </Link>
    );
}
