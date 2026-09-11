import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, Building2, Package } from "lucide-react";
import type { Metadata } from "next";

import AddToCartButton from "./AddToCartButton";
import BoxConfigurator from "./BoxConfigurator";
import VarietyLabel from "./VarietyLabel";
import OrdersClosedBanner from "@/components/OrdersClosedBanner";
import { siteUrl, VAT_PERCENTAGE, foodBusinessOperator } from "@/lib/site";
import { getShopSettings } from "@/lib/shop-settings";
import { getProductDetail, netWeightGrams, pricePerKg } from "@/lib/catalog";

export const dynamic = 'force-dynamic';

export async function generateMetadata(
    { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
    const { id } = await params;
    const product = await getProductDetail(id);
    if (!product) return { title: "Produkt nicht gefunden" };

    return {
        title: product.name,
        description:
            product.description ||
            `${product.name} – handgemacht, frisch gebacken und mit Liebe verpackt. Jetzt bei The Cookie Lady bestellen.`,
        alternates: { canonical: `${siteUrl}/produkt/${id}` },
        openGraph: {
            title: `${product.name} – The Cookie Lady`,
            description: product.description || undefined,
            url: `${siteUrl}/produkt/${id}`,
            type: 'website',
            images: product.imageUrl ? [product.imageUrl] : undefined,
        },
    };
}

export default async function ProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const [product, settings] = await Promise.all([getProductDetail(id), getShopSettings()]);

    if (!product) notFound();

    const configurable = product.kind === 'configurable';

    // Bei fester Zusammenstellung steht die Füllmenge fest. Beim Konfigurator
    // hängt sie von der Auswahl ab und wird dort live berechnet.
    const netGrams = configurable ? null : netWeightGrams(product, product.composition);
    const perKg = netGrams !== null ? pricePerKg(product.price, netGrams) : null;

    /** Sorten, deren Angaben auf dieser Seite stehen müssen. */
    const labelledVarieties = configurable
        ? product.selectableVarieties.map((variety) => ({ variety, quantity: undefined }))
        : product.composition.map((entry) => ({ variety: entry.variety, quantity: entry.quantity }));

    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description || undefined,
        image: product.imageUrl ? [product.imageUrl] : undefined,
        brand: { "@type": "Brand", name: "The Cookie Lady" },
        ...(netGrams
            ? { weight: { "@type": "QuantitativeValue", value: netGrams, unitCode: "GRM" } }
            : {}),
        offers: {
            "@type": "Offer",
            url: `${siteUrl}/produkt/${product.id}`,
            priceCurrency: "EUR",
            price: product.price.toFixed(2),
            availability: product.isAvailable
                ? "https://schema.org/InStock"
                : "https://schema.org/OutOfStock",
            itemCondition: "https://schema.org/NewCondition",
            shippingDetails: {
                "@type": "OfferShippingDetails",
                shippingDestination: { "@type": "DefinedRegion", addressCountry: "DE" },
            },
        },
    };

    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
            />
            <div className="max-w-6xl mx-auto">
                <OrdersClosedBanner />

                <Link
                    href={product.line ? `/shop/${product.line.slug}` : '/shop'}
                    className="inline-flex items-center gap-2 text-[var(--color-brand-dark)] hover:text-[var(--color-brand-primary)] transition-colors mb-8 font-medium"
                >
                    <ArrowLeft className="w-5 h-5" />
                    {product.line ? `Zurück zur ${product.line.name}` : 'Zurück zum Shop'}
                </Link>

                <div className="bg-white rounded-[3rem] shadow-xl overflow-hidden border border-neutral-100 flex flex-col lg:flex-row">
                    {/* Bild */}
                    <div className="lg:w-1/2 bg-[var(--color-brand-secondary)] flex items-center justify-center min-h-[400px] lg:min-h-[600px] relative overflow-hidden">
                        {product.imageUrl ? (
                            <Image
                                src={product.imageUrl}
                                alt={product.name}
                                fill
                                className="object-cover"
                                priority
                                sizes="(max-width: 1024px) 100vw, 50vw"
                            />
                        ) : (
                            <div className="text-9xl">🍪</div>
                        )}
                    </div>

                    {/* Angaben */}
                    <div className="lg:w-1/2 p-8 lg:p-14 flex flex-col">
                        {product.line && (
                            <Link
                                href={`/shop/${product.line.slug}`}
                                className="text-[var(--color-brand-primary)] font-bold tracking-widest uppercase text-sm mb-2 hover:underline w-max"
                            >
                                {product.line.name}
                            </Link>
                        )}

                        <h1 className="font-serif text-4xl lg:text-5xl font-extrabold text-[var(--color-brand-text)] mb-3">
                            {product.name}
                        </h1>

                        {product.legalName && (
                            <p className="text-sm text-neutral-500 mb-4">Bezeichnung: {product.legalName}</p>
                        )}

                        {product.description && (
                            <p className="text-lg text-[var(--color-brand-dark)] mb-8 leading-relaxed">
                                {product.description}
                            </p>
                        )}

                        <div className="border-t border-b border-neutral-100 py-8 mb-8">
                            <div className="flex flex-col gap-2 mb-2">
                                <span className="text-4xl font-black text-[var(--color-brand-text)]">
                                    {product.price.toFixed(2).replace('.', ',')} €
                                </span>
                                <span className="text-sm text-neutral-500 font-medium">
                                    {perKg !== null && (
                                        <>Grundpreis: {perKg.toFixed(2).replace('.', ',')} € / kg<br /></>
                                    )}
                                    inkl. {VAT_PERCENTAGE} % MwSt., zzgl.{' '}
                                    <Link href="/versand" className="underline hover:text-[var(--color-brand-primary)]">
                                        Versandkosten
                                    </Link>
                                </span>
                                {netGrams !== null && (
                                    <span className="text-sm font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-1 rounded-md inline-block w-max mt-2">
                                        Nettofüllmenge: {String(netGrams).replace('.', ',')} g
                                    </span>
                                )}
                                {configurable && product.pieceCount && (
                                    <span className="text-sm font-bold text-[var(--color-brand-primary)] bg-[var(--color-brand-primary)]/10 px-3 py-1 rounded-md inline-block w-max mt-2">
                                        {product.pieceCount} Kekse nach deiner Wahl
                                    </span>
                                )}
                            </div>

                            {!product.isAvailable ? (
                                <div className="mt-6">
                                    <button
                                        disabled
                                        className="w-full px-8 py-4 rounded-full font-bold text-lg bg-gray-200 text-gray-500 cursor-not-allowed"
                                    >
                                        Zurzeit nicht bestellbar
                                    </button>
                                </div>
                            ) : configurable ? (
                                <div className="mt-6">
                                    <BoxConfigurator
                                        productId={product.id}
                                        productName={product.name}
                                        price={product.price}
                                        pieceCount={product.pieceCount ?? 0}
                                        imageUrl={product.imageUrl}
                                        ordersOpen={settings.ordersOpen}
                                        varieties={product.selectableVarieties.map((v) => ({
                                            id: v.id,
                                            name: v.name,
                                            description: v.description,
                                            imageUrl: v.imageUrl,
                                            pieceWeightGrams: v.pieceWeightGrams,
                                        }))}
                                    />
                                </div>
                            ) : (
                                <AddToCartButton
                                    product={{
                                        id: product.id,
                                        name: product.name,
                                        price: product.price,
                                        imageUrl: product.imageUrl,
                                    }}
                                    disabled={!settings.ordersOpen}
                                    disabledLabel={settings.ordersOpen ? undefined : 'Zurzeit keine Bestellannahme'}
                                />
                            )}
                        </div>

                        {/* Pflichtangaben je Sorte */}
                        {labelledVarieties.length > 0 && (
                            <div className="space-y-6">
                                <div>
                                    <h2 className="font-bold text-lg text-[var(--color-brand-text)] mb-1 flex items-center gap-2">
                                        <Package className="w-5 h-5 text-[var(--color-brand-primary)] flex-shrink-0" />
                                        {configurable ? 'Diese Sorten stehen zur Wahl' : 'Das steckt drin'}
                                    </h2>
                                    <p className="text-sm text-neutral-500 mb-4">
                                        Zutaten, Allergene und Nährwerte findest du bei jeder Sorte – ein
                                        gemischter Karton hat kein gemeinsames Zutatenverzeichnis.
                                    </p>
                                    <div className="space-y-2">
                                        {labelledVarieties.map(({ variety, quantity }) => (
                                            <VarietyLabel key={variety.id} variety={variety} quantity={quantity} />
                                        ))}
                                    </div>
                                </div>

                                {product.consumerInfo && (
                                    <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">
                                        {product.consumerInfo}
                                    </p>
                                )}

                                <div>
                                    <h3 className="font-bold text-lg text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                                        <Building2 className="w-5 h-5 text-[var(--color-brand-primary)] flex-shrink-0" />
                                        Lebensmittelunternehmer
                                    </h3>
                                    <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">
                                        {foodBusinessOperator.name}<br />
                                        {foodBusinessOperator.street}<br />
                                        {foodBusinessOperator.city}<br />
                                        {foodBusinessOperator.country}
                                    </p>
                                    <p className="text-xs text-neutral-400 mt-2">
                                        Mindestens haltbar bis: siehe Aufdruck auf der Verpackung.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
