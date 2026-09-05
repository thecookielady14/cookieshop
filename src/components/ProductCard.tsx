'use client';

import Image from "next/image";
import Link from "next/link";

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
        <Link href={`/shop/${product.id}`} prefetch={false} className="group block transition-transform duration-300 hover:-translate-y-1">
            <div className={`aspect-square bg-[var(--color-brand-secondary)] rounded-3xl mb-4 overflow-hidden relative border border-neutral-100 shadow-sm group-hover:shadow-2xl transition-shadow duration-300 ${product.is_available === false ? 'grayscale opacity-70' : ''}`}>
                {product.image_url ? (
                    <Image 
                        src={product.image_url} 
                        alt={product.name} 
                        fill 
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                        {product.emoji || '🍪'}
                    </div>
                )}
            </div>
            <h3 className="text-xl font-bold mb-1 group-hover:text-[var(--color-brand-primary)] transition-colors">
                {product.name}
            </h3>
            <p className="text-[var(--color-brand-dark)] mb-4 h-12 overflow-hidden text-sm">
                {product.description}
            </p>

            <div className="flex justify-between items-center mt-auto">
                <div className="flex flex-col">
                    <span className="font-bold text-xl text-[var(--color-brand-text)]">{product.price.toFixed(2).replace('.', ',')} €</span>
                    <span className="text-[11px] text-neutral-400 leading-tight">inkl. MwSt., zzgl. Versand</span>
                </div>
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
