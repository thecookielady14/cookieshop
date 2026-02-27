import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";

// Revalidate data periodically or on demand
export const revalidate = 60; // seconds

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
                <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 text-[var(--color-brand-text)] text-center">
                    Unsere Cookies
                </h1>
                <p className="text-center text-lg text-[var(--color-brand-dark)] max-w-2xl mx-auto mb-16">
                    Handgemacht, täglich frisch gebacken und mit Liebe verpackt.
                    Suche dir deine Lieblingssorten aus.
                </p>



                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                    {products?.map((product: any) => (
                        <ProductCard
                            key={product.id}
                            product={{
                                ...product,
                                emoji: emojiMap[product.name] || '🍪'
                            }}
                        />
                    ))}
                </div>

                {products?.length === 0 && !error && (
                    <div className="text-center py-20 bg-white/50 rounded-3xl border border-neutral-200">
                        <span className="text-6xl mb-4 block">👩‍🍳</span>
                        <p className="text-xl font-medium text-[var(--color-brand-text)]">
                            Wir backen gerade frisch! Bald gibt es hier wieder leckere Cookies.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
