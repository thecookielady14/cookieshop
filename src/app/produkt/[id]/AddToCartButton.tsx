'use client';

import { useState } from 'react';
import { ShoppingBag, Check, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useCartStore, type CartVariety } from '@/lib/store';

/**
 * In den Warenkorb legen – für feste Produkte wie für zusammengestellte
 * Kartons. Die Menge zählt Verkaufseinheiten, nicht Kekse.
 */
export default function AddToCartButton({
    product,
    selection,
    disabled = false,
    disabledLabel,
}: {
    product: { id: string; name: string; price: number; imageUrl: string | null };
    /** Nur bei zusammengestellten Kartons gesetzt. */
    selection?: CartVariety[];
    disabled?: boolean;
    disabledLabel?: string;
}) {
    const [quantity, setQuantity] = useState(1);
    const [added, setAdded] = useState(false);
    const addItem = useCartStore((state) => state.addItem);

    const handleAddToCart = () => {
        if (disabled) return;
        addItem({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity,
            imageUrl: product.imageUrl ?? undefined,
            varieties: selection && selection.length > 0 ? selection : undefined,
        });
        setAdded(true);
        setTimeout(() => setAdded(false), 2000);
    };

    if (disabled) {
        return (
            <div className="mt-6">
                <button
                    disabled
                    className="w-full flex items-center justify-center gap-2 px-8 py-4 rounded-full font-bold text-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                >
                    {disabledLabel ?? 'Zurzeit nicht bestellbar'}
                </button>
            </div>
        );
    }

    return (
        <div className="flex flex-col sm:flex-row gap-4 mt-6">
            <div className="flex items-center justify-between bg-white border-2 border-neutral-100 rounded-full px-4 py-3 sm:w-1/3 shadow-sm">
                <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    disabled={quantity <= 1}
                    aria-label="Menge verringern"
                    className="p-1 text-neutral-400 hover:text-[var(--color-brand-primary)] transition-colors disabled:opacity-40"
                >
                    <Minus className="w-5 h-5" />
                </button>
                <span className="font-bold text-xl text-[var(--color-brand-text)] w-8 text-center" aria-live="polite">
                    {quantity}
                </span>
                <button
                    onClick={() => setQuantity((q) => (q < 20 ? q + 1 : q))}
                    aria-label="Menge erhöhen"
                    className="p-1 text-neutral-400 hover:text-[var(--color-brand-primary)] transition-colors"
                >
                    <Plus className="w-5 h-5" />
                </button>
            </div>

            <button
                onClick={handleAddToCart}
                className="flex-1 relative overflow-hidden flex items-center justify-center gap-2 bg-[var(--color-brand-primary)] text-white px-8 py-4 rounded-full font-bold text-lg hover:opacity-90 transition-all shadow-md"
            >
                <AnimatePresence mode="wait" initial={false}>
                    {added ? (
                        <motion.span
                            key="added"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="flex items-center gap-2"
                        >
                            <Check className="w-5 h-5" /> Im Warenkorb
                        </motion.span>
                    ) : (
                        <motion.span
                            key="add"
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -12 }}
                            className="flex items-center gap-2"
                        >
                            <ShoppingBag className="w-5 h-5" /> In den Warenkorb
                        </motion.span>
                    )}
                </AnimatePresence>
            </button>
        </div>
    );
}
