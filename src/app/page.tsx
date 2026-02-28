import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Cookie } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import ProductCard from "@/components/ProductCard";

// Initialize Supabase client for Server Component
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 60; // Cache the homepage for 60 seconds

export default async function Home() {
  // Fetch up to 3 active products for the "Bestseller" section
  const { data: featuredProducts, error } = await supabase
    .from('products')
    .select('*')
    .eq('is_available', true)
    .limit(3);

  if (error) {
    console.error("Error fetching featured products:", error);
  }

  return (
    <div className="bg-[var(--color-brand-bg)]">
      {/* Hero Section */}
      <section className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 px-6 lg:px-12 flex items-center justify-center overflow-hidden bg-[var(--color-brand-primary)]">
        {/* Decorative background blobs */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden -z-10">
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#2a1711] rounded-full blur-3xl opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[60%] bg-[var(--color-brand-accent)] rounded-full blur-3xl opacity-20"></div>
        </div>

        <div className="max-w-7xl mx-auto w-full flex flex-col md:flex-row items-center justify-between gap-12 md:gap-20 z-10">

          {/* Left: Large Logo */}
          <div className="flex-1 flex justify-center md:justify-end">
            <Image
              src="/logo_transparent.png"
              alt="The Cookie Lady Logo"
              width={600}
              height={600}
              className="w-[300px] h-[300px] md:w-[400px] md:h-[400px] lg:w-[500px] lg:h-[500px] object-cover"
              priority
            />
          </div>

          {/* Right: Text Content */}
          <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-normal mb-6 text-white tracking-tight">
              Mit Liebe gebacken. <br />
              <span className="text-[var(--color-brand-accent)] font-serif italic">Für dich gemacht.</span>
            </h1>
            <p className="text-xl lg:text-2xl max-w-xl mb-12 text-white/90">
              Entdecke handgemachte, unwiderstehliche Cookies aus besten Zutaten.
              Jeder Keks ein kleines Stückchen Glück – direkt zu dir nach Hause!
            </p>

            <div className="flex flex-col sm:flex-row gap-6">
              <Link
                href="/shop"
                className="group flex flex-1 items-center justify-center gap-3 bg-[var(--color-brand-accent)] text-[#2a1711] px-6 lg:px-10 py-5 rounded-full font-black text-lg lg:text-xl hover:bg-[#e0b836] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-1"
              >
                Jetzt shoppen
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="flex flex-1 items-center justify-center bg-transparent border-4 border-[var(--color-brand-accent)] text-[var(--color-brand-accent)] px-6 lg:px-10 py-5 rounded-full font-bold text-lg lg:text-xl hover:bg-[var(--color-brand-accent)]/10 transition-all shadow-sm"
              >
                Geschichte
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products Preview */}
      <section className="py-20 px-6 lg:px-12 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-end mb-12">
            <div>
              <h2 className="text-3xl font-bold mb-2">Bestseller</h2>
              <p className="text-[var(--color-brand-dark)]">Die absoluten Lieblinge unserer Kunden</p>
            </div>
            <Link href="/shop" className="hidden sm:flex items-center gap-2 font-medium text-[var(--color-brand-primary)] hover:underline">
              Alle ansehen <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-neutral-50 rounded-3xl border border-neutral-100">
              <Cookie className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
              <h3 className="text-xl font-bold text-neutral-800 mb-2">Der Ofen glüht schon vor!</h3>
              <p className="text-neutral-500 max-w-md mx-auto">
                Wir bereiten gerade die erste Fuhre frischer Cookies für die Neueröffnung vor.
                Schau in ein paar Stunden nochmal vorbei!
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
