import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Cookie } from "lucide-react";
import type { Metadata } from "next";
import AnimateIn from "@/components/AnimateIn";
import OrdersClosedBanner from "@/components/OrdersClosedBanner";
import ProductCard from "@/components/ProductCard";
import { getLineBySlug, getProducts, getProductLines } from "@/lib/catalog";
import { siteUrl } from "@/lib/site";

export const dynamic = 'force-dynamic';

/** Eigene Seite je Produktlinie – gut teilbar und einzeln auffindbar. */
export async function generateMetadata(
    { params }: { params: Promise<{ line: string }> }
): Promise<Metadata> {
    const { line: slug } = await params;
    const line = await getLineBySlug(slug);
    if (!line) return { title: "Linie nicht gefunden" };

    return {
        title: line.name,
        description: line.description ?? line.tagline ?? undefined,
        alternates: { canonical: `${siteUrl}/shop/${line.slug}` },
        openGraph: {
            title: `${line.name} – The Cookie Lady`,
            description: line.description ?? line.tagline ?? undefined,
            url: `${siteUrl}/shop/${line.slug}`,
            type: 'website',
        },
    };
}

export default async function LinePage({ params }: { params: Promise<{ line: string }> }) {
    const { line: slug } = await params;
    const line = await getLineBySlug(slug);

    if (!line || !line.isActive) notFound();

    const [products, allLines] = await Promise.all([
        getProducts({ lineId: line.id, onlyAvailable: true }),
        getProductLines(),
    ]);

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-7xl mx-auto">
                <OrdersClosedBanner />

                <Link
                    href="/shop"
                    className="inline-flex items-center gap-2 text-[var(--color-brand-dark)] hover:text-[var(--color-brand-primary)] transition-colors mb-8 font-medium"
                >
                    <ArrowLeft className="w-5 h-5" /> Alle Linien
                </Link>

                <AnimateIn>
                    <h1 className="font-serif text-4xl lg:text-5xl font-extrabold mb-4 text-[var(--color-brand-text)]">
                        {line.name}
                    </h1>
                    {line.description && (
                        <p className="text-lg text-[var(--color-brand-dark)] max-w-2xl mb-12 leading-relaxed">
                            {line.description}
                        </p>
                    )}
                </AnimateIn>

                {products.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {products.map((product, index) => (
                            <AnimateIn key={product.id} delay={index * 80}>
                                <ProductCard product={product} />
                            </AnimateIn>
                        ))}
                    </div>
                ) : (
                    <AnimateIn>
                        <div className="text-center py-20 bg-white/50 rounded-3xl border border-neutral-200">
                            <Cookie className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                            <h2 className="text-xl font-bold text-neutral-800 mb-2 font-serif">
                                Hier wird noch gebacken
                            </h2>
                            <p className="text-neutral-500 max-w-md mx-auto">
                                In dieser Linie ist gerade nichts bestellbar. Schau bald wieder vorbei.
                            </p>
                        </div>
                    </AnimateIn>
                )}

                {/* Zu den anderen Linien, ohne den Umweg über die Übersicht */}
                {allLines.length > 1 && (
                    <div className="mt-20 pt-10 border-t border-black/10">
                        <h2 className="font-serif text-2xl font-bold mb-6 text-[var(--color-brand-text)]">
                            Andere Linien
                        </h2>
                        <div className="flex flex-wrap gap-3">
                            {allLines
                                .filter((l) => l.id !== line.id)
                                .map((l) => (
                                    <Link
                                        key={l.id}
                                        href={`/shop/${l.slug}`}
                                        className="px-6 py-3 rounded-full font-bold text-sm bg-white/70 text-[var(--color-brand-dark)] hover:bg-white border border-neutral-200 transition-colors"
                                    >
                                        {l.name}
                                    </Link>
                                ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
