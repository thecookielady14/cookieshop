import { supabase } from "@/lib/supabase";
import { Cookie } from "lucide-react";
import AnimateIn from "@/components/AnimateIn";
import ShopTabs from "@/components/ShopTabs";
import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Shop – The Cookie Lady | Handgemachte Kekse bestellen",
    description: "Entdecke alle handgemachten Kekse von The Cookie Lady. Frisch gebacken, aus besten Zutaten – jetzt online bestellen und nach Hause liefern lassen.",
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

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-36 pb-20 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <AnimateIn>
                    <h1 className="text-4xl lg:text-5xl font-extrabold mb-4 text-[var(--color-brand-text)] text-center">
                        Meine Kekse
                    </h1>
                    <p className="text-center text-lg text-[var(--color-brand-dark)] max-w-2xl mx-auto mb-4">
                        Handgemacht, frisch auf Bestellung gebacken und mit Liebe verpackt.
                        Such dir deine Lieblingssorten aus.
                    </p>
                    <p className="text-center text-[var(--color-brand-primary)] font-semibold text-sm mb-10">
                        Ab 10. August 2026 bestellbar
                    </p>
                </AnimateIn>

                {products && products.length > 0 ? (
                    <ShopTabs products={products} />
                ) : (
                    <AnimateIn>
                        <div className="text-center py-20 bg-white/50 rounded-3xl border border-neutral-200">
                            <Cookie className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                            <h3 className="text-xl font-bold text-neutral-800 mb-2 font-serif">Der Ofen glüht schon vor!</h3>
                            <p className="text-neutral-500 max-w-md mx-auto mb-4">
                                Ich bereite gerade die ersten Sorten für die Neueröffnung vor.
                                Schau bald wieder vorbei!
                            </p>
                            <p className="text-[var(--color-brand-primary)] font-semibold text-sm">
                                Ab 10. August 2026 bestellbar
                            </p>
                        </div>
                    </AnimateIn>
                )}
            </div>
        </div>
    );
}
