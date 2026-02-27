import { supabase } from "@/lib/supabase";
import Image from "next/image";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import AddToCartButton from "./AddToCartButton"; // We will create this client component

export const revalidate = 60;

export default async function ProductPage({ params }: { params: { id: string } }) {
    let product = null;

    // Fetch real products from our Supabase Database
    try {
        const { data, error } = await supabase
            .from('products')
            .select('*')
            .eq('id', params.id)
            .single();

        if (!error && data) {
            product = data;
        }
    } catch (err) {
        // Ignore supabase errors in dev mode without connection
    }

    // Mock Backend data for development without DB connection
    if (!product) {
        const mockProducts = [
            {
                id: '1',
                name: 'Classic Chocolate Chip',
                description: 'Der absolute Klassiker. Aussen knusprig, innen herrlich zart (chewy) mit großen, schmelzenden belgischen Schokoladenstückchen. Ein Traum für jeden Keks-Liebhaber.',
                price: 3.50,
                image_url: '',
                weight_grams: 125,
                ingredients: 'Weizenmehl, Butter, Zucker, Brauner Rohrrohrzucker, Schokoladentropfen (Kakaomasse, Zucker, Kakaobutter, Emulgator: Sojalecithin, natürliches Vanillearoma), Eier, Vanilleextrakt, Backpulver, Speisesalz.',
                allergens: 'Glutenhaltiges Getreide (Weizen), Milch, Eier, Soja. Kann Spuren von Schalenfrüchten enthalten.',
                consumer_info: 'Kühl und trocken lagern. Nach dem Öffnen rasch verzehren. Für den ultimativen Genuss: Keks für 10-15 Sekunden in die Mikrowelle geben.'
            },
            {
                id: '2',
                name: 'Double Choc Fudge',
                description: 'Für alle echten Schokoholics. Ein dunkler, reichhaltiger Keks-Teig mit extra viel Kakaopulver und doppelten Schokoladenstückchen.',
                price: 3.90,
                image_url: '',
                weight_grams: 130,
                ingredients: 'Weizenmehl, Butter, Brauner Rohrrohrzucker, Zucker, Kakaopulver, Zartbitterschokolade, Eier, Vanilleextrakt, Backpulver, Speisesalz.',
                allergens: 'Glutenhaltiges Getreide (Weizen), Milch, Eier, Soja. Kann Spuren von Schalenfrüchten enthalten.',
                consumer_info: 'Kühl und trocken lagern. Nach dem Öffnen rasch verzehren. Schmeckt fantastisch mit einem kalten Glas Milch.'
            },
            {
                id: '3',
                name: 'Peanut Butter Crunch',
                description: 'Salzig trifft süß. Cremige Erdnussbutter im Teig und knackige gesalzene Erdnüsse obendrauf.',
                price: 3.90,
                image_url: '',
                weight_grams: 120,
                ingredients: 'Weizenmehl, Erdnussbutter (Erdnüsse, Palmöl, Salz), Butter, Brauner Zucker, Zucker, Eier, geröstete Erdnüsse, Vanilleextrakt, Backpulver, Speisesalz.',
                allergens: 'Glutenhaltiges Getreide (Weizen), Erdnüsse, Milch, Eier. Kann Spuren von Soja und anderen Nüssen enthalten.',
                consumer_info: 'Kühl und trocken lagern. Vor Wärme schützen.'
            }
        ];
        product = mockProducts.find(p => p.id === params.id) || mockProducts[0];
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
                    <div className="lg:w-1/2 bg-[var(--color-brand-secondary)] flex items-center justify-center p-12 min-h-[400px] lg:min-h-[600px] relative">
                        <div className="text-9xl transform transition-transform hover:scale-110 duration-500">
                            {emoji}
                        </div>
                        {/* If we had real images, it would be:
            <Image src={product.image_url} alt={product.name} fill className="object-cover" />
            */}
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
                            <div>
                                <h3 className="font-bold text-lg text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                                    🌾 Zutatenverzeichnis
                                </h3>
                                <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">
                                    {product.ingredients || 'Keine Zutaten hinterlegt.'}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                                    ⚠️ Allergene
                                </h3>
                                <p className="text-sm text-red-800 font-medium leading-relaxed bg-red-50 p-4 rounded-xl border border-red-100">
                                    {product.allergens || 'Keine Allergene hinterlegt.'}
                                </p>
                            </div>

                            <div>
                                <h3 className="font-bold text-lg text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                                    💡 Verbraucherhinweise
                                </h3>
                                <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">
                                    {product.consumer_info || 'Keine Verbraucherhinweise hinterlegt.'}
                                </p>
                            </div>
                        </div>

                    </div>

                </div>
            </div>
        </div>
    );
}
