import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddToCartButton from "./AddToCartButton";
import type { Metadata } from "next";

export const dynamic = 'force-dynamic';

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await params;
    const { data: product } = await supabase
        .from('products')
        .select('name, description')
        .eq('id', id)
        .single();

    if (!product) {
        return { title: "Cookie nicht gefunden – The Cookie Lady" };
    }

    return {
        title: `${product.name} – The Cookie Lady | Handgemachter Cookie`,
        description: product.description || `${product.name} – Handgemacht, frisch gebacken und mit Liebe verpackt. Jetzt bei The Cookie Lady bestellen.`,
    };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    let product = null;
    const { id } = await params;

    // Fetch real products from our Supabase Database
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', id)
            .single();

        if (!error && data) {
            product = data;
        }
    } catch (err) {
        // Ignore supabase errors in dev mode without connection
    }

    if (!product) {
        return (
            <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12 flex items-center justify-center">
                <div className="text-center p-12 bg-white rounded-3xl shadow-sm border border-neutral-100">
                    <h1 className="text-2xl font-bold mb-4">Keks nicht gefunden</h1>
                    <p className="text-neutral-500 mb-8">Dieser Cookie scheint aufgegessen oder aus dem Sortiment genommen worden zu sein.</p>
                    <Link href="/shop" className="bg-[var(--color-brand-primary)] text-white px-6 py-3 rounded-full font-bold hover:bg-[var(--color-brand-accent)] transition-colors">
                        Zurück zur Auswahl
                    </Link>
                </div>
            </div>
        );
    }

    // Calculate price per kg
    const weightInKg = product.weight_grams ? product.weight_grams / 1000 : 0.1; // fallback to 100g
    const pricePerKg = product.price / weightInKg;

    // Fallback emoji
    const emojiMap: Record<string, string> = {
        'Classic Chocolate Chip': '🍪',
        'Double Choc Fudge': '🍫',
        'Peanut Butter Crunch': '🥜',
    };
    const emoji = emojiMap[product.name] || '🍪';

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-6xl mx-auto">

                <Link href="/shop" className="inline-flex items-center gap-2 text-[var(--color-brand-dark)] hover:text-[var(--color-brand-primary)] transition-colors mb-8 font-medium">
                    <ArrowLeft className="w-5 h-5" /> Zurück zum Shop
                </Link>

                <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-neutral-100 flex flex-col lg:flex-row">

                    {/* Left Side: Product Image */}
                    <div className="lg:w-1/2 bg-[var(--color-brand-secondary)] flex items-center justify-center min-h-[400px] lg:min-h-[600px] relative overflow-hidden">
                        {product.image_url ? (
                            <Image 
                                src={product.image_url} 
                                alt={product.name} 
                                fill 
                                className="object-cover hover:scale-105 transition-transform duration-700"
                                priority
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                        ) : (
                            <div className="text-9xl transform transition-transform hover:scale-110 duration-500">
                                {emoji}
                            </div>
                        )}
                    </div>

                    {/* Right Side: Product Details */}
                    <div className="lg:w-1/2 p-8 lg:p-16 flex flex-col">
                        <span className="text-[var(--color-brand-primary)] font-bold tracking-widest uppercase text-sm mb-2">
                            Handgemacht
                        </span>
                        <h1 className="font-serif text-4xl lg:text-5xl font-extrabold text-[var(--color-brand-text)] mb-4">
                            {product.name}
                        </h1>

                        <p className="text-lg text-[var(--color-brand-dark)] mb-8 leading-relaxed">
                            {product.description}
                        </p>

                        {/* Price and Add to Cart logic (Client Component) */}
                        <div className="border-t border-b border-neutral-100 py-8 mb-8">
                            <div className="flex flex-col gap-2 mb-6">
                                <span className="text-4xl font-black text-[var(--color-brand-text)]">
                                    {product.price.toFixed(2).replace('.', ',')} €
                                </span>
                                <span className="text-sm text-neutral-500 font-medium">
                                    Grundpreis: {pricePerKg.toFixed(2).replace('.', ',')} € / kg <br />
                                    inkl. MwSt., zzgl. <Link href="/widerruf" className="underline hover:text-[var(--color-brand-primary)]">Versand</Link>
                                </span>
                                <span className="text-sm font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-1 rounded-md inline-block w-max mt-2">
                                    Gewicht: ca. {product.weight_grams}g
                                </span>
                            </div>

                            {/* Client component that handles the quantity state and Zustand store injection */}
                            <AddToCartButton product={product} />
                        </div>

                        {/* Detailed Information (Accordions/Sections) */}
                        <div className="space-y-6">
                            {product.ingredients && (
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                                        🌾 Zutatenverzeichnis
                                    </h3>
                                    <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">
                                        {product.ingredients}
                                    </p>
                                </div>
                            )}

                            {product.allergens && (
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                                        ⚠️ Allergene
                                    </h3>
                                    <p className="text-sm text-red-800 font-medium leading-relaxed bg-red-50 p-4 rounded-xl border border-red-100">
                                        {product.allergens}
                                    </p>
                                </div>
                            )}

                            {product.consumer_info && (
                                <div>
                                    <h3 className="font-bold text-lg text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                                        💡 Verbraucherhinweise
                                    </h3>
                                    <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">
                                        {product.consumer_info}
                                    </p>
                                </div>
                            )}
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
