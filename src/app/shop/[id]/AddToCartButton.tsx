'use client';

import { useState } from 'react';
import { ShoppingBag, Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/lib/store';

export default function AddToCartButton({ product }: { product: any }) {
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const addItem = useCartStore((state) => state.addItem);

    const handleAddToCart = () => {
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: quantity,
            imageUrl: product.image_url,
        });

        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    const increaseQuantity = () => setQuantity(prev => (prev < 20 ? prev + 1 : prev));
    const decreaseQuantity = () => setQuantity(prev => (prev > 1 ? prev - 1 : 1));

    if (product.is_available === false) {
        return (
            <div className="mt-6">
                <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                    Zurzeit ausverkauft
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
            {/* Quantity Selector */}
            <div className="flex items-center justify-between bg-white border-2 border-neutral-100 rounded-full px-4 py-3 sm:w-1/3 shadow-sm">
                <button
                    onClick={decreaseQuantity}
                    className="p-1 text-neutral-400 hover:text-[var(--color-brand-primary)] transition-colors"
                    disabled={quantity <= 1}
                >
                    <Minus className="w-5 h-5" />
                </button>
                <span className="font-bold text-xl text-[var(--color-brand-text)] w-8 text-center">
                    {quantity}
                </span>
                <button
                    onClick={increaseQuantity}
                    className="p-1 text-neutral-400 hover:text-[var(--color-brand-primary)] transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            {/* Add Button */}
            <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all ${added
                    ? 'bg-green-500 text-white'
                    : 'bg-[var(--color-brand-primary)] text-white hover:bg-[#c29160]'
                    }`}
            >
                <ShoppingBag className="w-5 h-5" />
                {added ? 'Im Warenkorb ✓' : 'In den Korb'}
            </button>
        </div>
    );
}
