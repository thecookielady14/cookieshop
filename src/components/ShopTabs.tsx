'use client';

import { useState } from 'react';
import ProductCard from './ProductCard';
import AnimateIn from './AnimateIn';

interface Product {
    id: string;
    name: string;
    description: string;
    price: number;
    image_url: string;
    emoji?: string;
    is_available?: boolean;
    category?: string;
}

export default function ShopTabs({ products }: { products: Product[] }) {
    const [activeTab, setActiveTab] = useState<'all' | 'classic' | 'kids'>('all');

    const filtered = activeTab === 'all'
        ? products
        : products.filter(p => (p.category || 'classic') === activeTab);

    return (
        <>
            {/* Category Tabs */}
            <div className="flex justify-center gap-3 mb-12">
                {[
                    { key: 'all' as const, label: 'Alle' },
                    { key: 'classic' as const, label: 'Classic' },
                    { key: 'kids' as const, label: 'Kids' },
                ].map(tab => (
                    <button
                        key={tab.key}
                        onClick={() => setActiveTab(tab.key)}
                        className={`px-6 py-2.5 rounded-full font-bold text-sm transition-all ${
                            activeTab === tab.key
                                ? 'bg-[var(--color-brand-primary)] text-white shadow-md'
                                : 'bg-white/70 text-[var(--color-brand-dark)] hover:bg-white border border-neutral-200'
                        }`}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* Product Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                {filtered.map((product, index) => (
                    <AnimateIn key={product.id} delay={index * 80}>
                        <ProductCard product={product} />
                    </AnimateIn>
                ))}
            </div>

            {filtered.length === 0 && (
                <AnimateIn>
                    <div className="text-center py-16 bg-white/50 rounded-3xl border border-neutral-200">
                        <span className="text-5xl mb-4 block">🍪</span>
                        <p className="text-lg font-medium text-[var(--color-brand-text)]">
                            In dieser Kategorie gibt es noch keine Kekse – bald mehr!
                        </p>
                    </div>
                </AnimateIn>
            )}
        </>
    );
}
