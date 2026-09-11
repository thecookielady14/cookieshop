import Link from "next/link";
import Image from "next/image";
import { Cookie, ArrowRight } from "lucide-react";
import type { Metadata } from "next";
import AnimateIn from "@/components/AnimateIn";
import OrdersClosedBanner from "@/components/OrdersClosedBanner";
import ProductCard from "@/components/ProductCard";
import { getProductLines, getProducts } from "@/lib/catalog";

export const metadata: Metadata = {
    title: "Shop – Handgemachte Kekse bestellen",
    description: "Entdecke alle handgemachten Kekse von The Cookie Lady: Classic Line im Sechserkarton, Athletic Line mit Proteinkeksen und Pure Line ohne zugesetzten Zucker.",
};

export const dynamic = 'force-dynamic';

/**
 * Einstieg in den Shop: die Linien als große Kacheln.
 *
 * Jede Linie hat ihre eigene Seite unter /shop/[slug] – so bleibt die
 * Übersicht auch dann ruhig, wenn später Linien und Sorten dazukommen.
 */
export default async function ShopOverview() {
    const lines = await getProductLines();
    const products = await getProducts({ onlyAvailable: true });

    const countForLine = (lineId: string) => products.filter((p) => p.lineId === lineId).length;
    const hasAnything = lines.length > 0;

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <OrdersClosedBanner />
                <AnimateIn>
                    <h1 className="font-serif text-4xl lg:text-5xl font-extrabold mb-4 text-[var(--color-brand-text)] text-center">
                        Meine Kekse
                    </h1>
                    <p className="text-center text-lg text-[var(--color-brand-dark)] max-w-2xl mx-auto mb-12">
                        Handgemacht, frisch auf Bestellung gebacken und mit Liebe verpackt.
                        Drei Linien – such dir aus, wonach dir ist.
                    </p>
                </AnimateIn>

                {hasAnything ? (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
                        {lines.map((line, index) => (
                            <AnimateIn key={line.id} delay={index * 120}>
                                <Link
                                    href={`/shop/${line.slug}`}
                                    className="group block h-full bg-white rounded-3xl overflow-hidden border border-neutral-100 shadow-sm hover:shadow-2xl transition-shadow duration-300"
                                >
                                    <div className="aspect-[4/3] bg-[var(--color-brand-secondary)] relative overflow-hidden">
                                        {line.imageUrl ? (
                                            <Image
                                                src={line.imageUrl}
                                                alt={line.name}
                                                fill
                                                className="object-cover group-hover:scale-105 transition-transform duration-700"
                                                sizes="(max-width: 768px) 100vw, 33vw"
                                            />
                                        ) : (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <Cookie className="w-16 h-16 text-[var(--color-brand-primary)]/30" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-6">
                                        <h2 className="font-serif text-2xl font-bold mb-2 text-[var(--color-brand-text)] group-hover:text-[var(--color-brand-primary)] transition-colors">
                                            {line.name}
                                        </h2>
                                        {line.tagline && (
                                            <p className="text-[var(--color-brand-dark)] text-sm mb-4 leading-relaxed">
                                                {line.tagline}
                                            </p>
                                        )}
                                        <span className="inline-flex items-center gap-2 font-bold text-sm text-[var(--color-brand-primary)]">
                                            {countForLine(line.id) > 0
                                                ? `${countForLine(line.id)} ${countForLine(line.id) === 1 ? 'Angebot' : 'Angebote'} ansehen`
                                                : 'Bald verfügbar'}
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </span>
                                    </div>
                                </Link>
                            </AnimateIn>
                        ))}
                    </div>
                ) : (
                    <AnimateIn>
                        <div className="text-center py-20 bg-white/50 rounded-3xl border border-neutral-200">
                            <Cookie className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                            <h3 className="text-xl font-bold text-neutral-800 mb-2 font-serif">Der Ofen glüht schon vor!</h3>
                            <p className="text-neutral-500 max-w-md mx-auto">
                                Ich bereite gerade die ersten Sorten vor. Schau bald wieder vorbei!
                            </p>
                        </div>
                    </AnimateIn>
                )}

                {products.length > 0 && (
                    <>
                        <AnimateIn>
                            <h2 className="font-serif text-3xl font-bold mb-8 text-[var(--color-brand-text)] text-center">
                                Alles auf einen Blick
                            </h2>
                        </AnimateIn>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {products.map((product, index) => (
                                <AnimateIn key={product.id} delay={index * 80}>
                                    <ProductCard product={product} />
                                </AnimateIn>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
