import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import AnimateIn from "@/components/AnimateIn";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop – The Cookie Lady | Handgemachte Cookies bestellen",
    description: "Entdecke alle handgemachten Cookies von The Cookie Lady. Frisch gebacken, aus besten Zutaten – jetzt online bestellen und nach Hause liefern lassen.",
};

// Force dynamic rendering to always show the latest products
export const dynamic = 'force-dynamic';

export default async function ShopOverview() {
    // Fetch real products from our Supabase Database
    let { data: products, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error("Error fetching products:", error);
    }

    // Fallback map for colorful mock emojis based on names 
    // until the shop owner uploads real images
    const emojiMap: Record<string, string> = {
        'Classic Chocolate Chip': '🍪',
        'Double Choc Fudge': '🍫',
        'Peanut Butter Crunch': '🥜',
    };

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <AnimateIn>
                    <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 text-[var(--color-brand-text)] text-center">
                        Meine Kekse
                    </h1>
                    <p className="text-center text-lg text-[var(--color-brand-dark)] max-w-2xl mx-auto mb-6">
                        Handgemacht, frisch auf Bestellung gebacken und mit Liebe verpackt.
                        Such dir deine Lieblingssorten aus.
                    </p>
                    <div className="flex justify-center mb-12">
                        <span className="text-[var(--color-brand-primary)] font-bold text-sm bg-[var(--color-brand-accent)]/30 px-5 py-2 rounded-full">
                            🗓️ Ab 01. Juni 2026 bestellbar!
                        </span>
                    </div>
                </AnimateIn>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products?.map((product: any, index: number) => (
                        <AnimateIn key={product.id} delay={index * 80}>
                            <ProductCard
                                product={{
                                    ...product,
                                    emoji: emojiMap[product.name] || '🍪'
                                }}
                            />
                        </AnimateIn>
                    ))}
                </div>

                {products?.length === 0 && !error && (
                    <AnimateIn>
                        <div className="text-center py-20 bg-white/50 rounded-3xl border border-neutral-200">
                            <span className="text-6xl mb-4 block">👩‍🍳</span>
                            <p className="text-xl font-medium text-[var(--color-brand-text)] mb-3">
                                Ich backe gerade an den ersten Sorten!
                            </p>
                            <span className="text-[var(--color-brand-primary)] font-bold text-sm bg-[var(--color-brand-accent)]/30 inline-block px-5 py-2 rounded-full">
                                🗓️ Ab 01. Juni 2026 bestellbar!
                            </span>
                        </div>
                    </AnimateIn>
                )}
            </div>
        </div>
    );
}
