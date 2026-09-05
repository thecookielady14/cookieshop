import Link from "next/link";
import Image from "next/image";
import { ArrowRight, Cookie, Flame, Wheat, Handshake, CalendarCheck, ChefHat, Package } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import ProductCard from "@/components/ProductCard";
import AnimateIn from "@/components/AnimateIn";

// Initialize Supabase client for Server Component
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Force dynamic rendering to guarantee fresh featured products
export const dynamic = 'force-dynamic';

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
              <span className="text-[var(--color-brand-accent)] font-serif italic">Dauerhaft lecker.</span>
              <br />
              Mit Liebe gebacken. <br />
              <span className="text-[var(--color-brand-accent)] font-serif italic">Für dich gemacht.</span>
            </h1>
            <p className="text-xl lg:text-2xl max-w-xl mb-12 text-white/90">
              Entdecke handgemachte Kekse aus regionalen Zutaten und echtem Dinkelmehl.
              Knusprig, ehrlich und mit Liebe gebacken – direkt zu dir nach Hause.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 lg:gap-6 mt-4">
              <Link
                href="/shop"
                className="group flex flex-1 items-center justify-center gap-3 bg-[var(--color-brand-accent)] text-[var(--color-brand-primary)] px-8 py-4 rounded-full font-serif font-extrabold tracking-wide text-lg hover:shadow-xl hover:-translate-y-0.5 transition-all shadow-lg"
              >
                Jetzt shoppen
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/about"
                className="flex flex-1 items-center justify-center bg-transparent border-2 border-[var(--color-brand-accent)] text-[var(--color-brand-accent)] px-8 py-4 rounded-full font-serif font-extrabold tracking-wide text-lg hover:bg-[var(--color-brand-accent)]/10 transition-all shadow-sm"
              >
                Über mich
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Band */}
      <div className="bg-[var(--color-brand-primary)] py-5">
        <div className="max-w-7xl mx-auto px-6 lg:px-12 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-12">
          <div className="flex items-center gap-2 text-[var(--color-brand-secondary)] text-sm font-semibold">
            <Flame className="w-4 h-4 text-[var(--color-brand-accent)] flex-shrink-0" />
            Frisch gebacken auf Bestellung
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2 text-[var(--color-brand-secondary)] text-sm font-semibold">
            <Handshake className="w-4 h-4 text-[var(--color-brand-accent)] flex-shrink-0" />
            100% Handgemacht
          </div>
          <div className="hidden sm:block w-px h-4 bg-white/20" />
          <div className="flex items-center gap-2 text-[var(--color-brand-secondary)] text-sm font-semibold">
            <Wheat className="w-4 h-4 text-[var(--color-brand-accent)] flex-shrink-0" />
            Dinkelmehl aus der Region
          </div>
        </div>
      </div>

      {/* So läuft's – die Backwoche erklären, bevor jemand fragt */}
      <section className="py-16 px-6 lg:px-12">
        <div className="max-w-5xl mx-auto">
          <AnimateIn>
            <h2 className="font-serif text-3xl font-bold text-center mb-3">Frisch gebacken, nicht auf Vorrat</h2>
            <p className="text-center text-[var(--color-brand-dark)] mb-12 max-w-2xl mx-auto">
              Ich backe einmal pro Woche – damit jeder Keks so ankommt, wie er aus dem Ofen kommt.
            </p>
          </AnimateIn>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
            {[
              {
                Icon: CalendarCheck,
                title: 'Bis Dienstag bestellen',
                text: 'Alles, was bis Dienstag 12 Uhr eingeht, kommt in die Backwoche.',
              },
              {
                Icon: ChefHat,
                title: 'Von Hand gebacken',
                text: 'Jeder Teigling wird einzeln geformt – kein Fließband, kein Vorrat.',
              },
              {
                Icon: Package,
                title: 'Noch dieselbe Woche unterwegs',
                text: 'Sorgfältig verpackt und mit DHL zu dir, in 2–4 Werktagen.',
              },
            ].map((step, index) => (
              <AnimateIn key={step.title} delay={index * 120}>
                <div className="text-center">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-[var(--color-brand-primary)] flex items-center justify-center">
                    <step.Icon className="w-7 h-7 text-[var(--color-brand-accent)]" />
                  </div>
                  <h3 className="font-bold text-lg mb-2 text-[var(--color-brand-text)]">{step.title}</h3>
                  <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">{step.text}</p>
                </div>
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products Preview */}
      <section className="py-20 px-6 lg:px-12 bg-transparent">
        <div className="max-w-7xl mx-auto">
          <AnimateIn>
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-3xl font-bold mb-2">Bestseller</h2>
                <p className="text-[var(--color-brand-dark)]">Die absoluten Lieblinge meiner Kunden</p>
              </div>
              <Link href="/shop" prefetch={false} className="hidden sm:flex items-center gap-2 font-medium text-[var(--color-brand-primary)] hover:underline">
                Alle ansehen <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </AnimateIn>

          {featuredProducts && featuredProducts.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredProducts.map((product, index) => (
                <AnimateIn key={product.id} delay={index * 120}>
                  <ProductCard product={product} />
                </AnimateIn>
              ))}
            </div>
          ) : (
            <AnimateIn>
              <div className="text-center py-16 bg-neutral-50 rounded-3xl border border-neutral-100">
                <Cookie className="w-16 h-16 mx-auto text-neutral-300 mb-4" />
                <h3 className="text-xl font-bold text-neutral-800 mb-2 font-serif">Der Ofen glüht schon vor!</h3>
                <p className="text-neutral-500 max-w-md mx-auto mb-4">
                  Ich bereite gerade die ersten Sorten für die Neueröffnung vor.
                  Schau bald wieder vorbei!
                </p>
                <p className="text-[var(--color-brand-primary)] font-semibold text-sm">
                  Ab 01. Oktober 2026 bestellbar
                </p>
              </div>
            </AnimateIn>
          )}
        </div>
      </section>
    </div>
  );
}
