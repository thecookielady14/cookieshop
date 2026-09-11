import Image from "next/image";
import Link from "next/link";
import { Shuffle } from "lucide-react";
import { VAT_PERCENTAGE } from "@/lib/site";
import type { Product } from "@/lib/catalog";

/**
 * Kachel für eine verkaufbare Einheit.
 *
 * Preisangaben nach PAngV: Bruttopreis mit Hinweis auf Steuer und Versand.
 * Der Grundpreis je Kilo steht auf der Produktseite – hier fehlt dafür die
 * Zusammensetzung, und bei einem Karton zum Selbstzusammenstellen hinge er
 * ohnehin von der Auswahl ab.
 */
export default function ProductCard({ product }: { product: Product }) {
    const unavailable = product.isAvailable === false;

    return (
        <Link
            href={`/produkt/${product.id}`}
            prefetch={false}
            className="group block transition-transform duration-300 hover:-translate-y-1"
        >
            <div
                className={`aspect-square bg-[var(--color-brand-secondary)] rounded-3xl mb-4 overflow-hidden relative border border-neutral-100 shadow-sm group-hover:shadow-2xl transition-shadow duration-300 ${
                    unavailable ? 'grayscale opacity-70' : ''
                }`}
            >
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-700"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                        🍪
                    </div>
                )}

                {product.kind === 'configurable' && !unavailable && (
                    <span className="absolute top-3 left-3 inline-flex items-center gap-1.5 bg-white/95 text-[var(--color-brand-primary)] px-3 py-1.5 rounded-full text-xs font-bold shadow-sm">
                        <Shuffle className="w-3.5 h-3.5" />
                        Selbst zusammenstellen
                    </span>
                )}
            </div>

            <h3 className="text-xl font-bold mb-1 group-hover:text-[var(--color-brand-primary)] transition-colors">
                {product.name}
            </h3>
            <p className="text-[var(--color-brand-dark)] mb-4 text-sm line-clamp-2 min-h-[2.5rem]">
                {product.description}
            </p>

            <div className="flex justify-between items-center mt-auto">
                <div className="flex flex-col">
                    <span className="font-bold text-xl text-[var(--color-brand-text)]">
                        {product.price.toFixed(2).replace('.', ',')} €
                    </span>
                    <span className="text-[11px] text-neutral-400 leading-tight">
                        inkl. {VAT_PERCENTAGE} % MwSt., zzgl. Versand
                    </span>
                </div>
                {unavailable ? (
                    <span className="flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm bg-gray-100 text-gray-500">
                        Nicht bestellbar
                    </span>
                ) : (
                    <span className="flex items-center gap-1 px-4 py-2 rounded-full font-bold text-sm bg-[var(--color-brand-bg)] text-[var(--color-brand-primary)] group-hover:bg-[var(--color-brand-primary)] group-hover:text-white transition-all">
                        {product.kind === 'configurable' ? 'Zusammenstellen' : 'Zum Artikel'}
                    </span>
                )}
            </div>
        </Link>
    );
}
