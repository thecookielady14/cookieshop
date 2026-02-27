import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

export default function Home() {
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
            <h1 className="font-serif text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-black mb-6 text-white tracking-tight">
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Dummy Product 1 */}
            <div className="group cursor-pointer">
              <div className="aspect-square bg-[var(--color-brand-secondary)] rounded-3xl mb-4 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                  🍪
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">Classic Chocolate Chip</h3>
              <p className="text-[var(--color-brand-dark)] mb-2">Der Klassiker mit zarter Schokolade.</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">3,50 €</span>
                <span className="text-sm font-medium bg-[var(--color-brand-bg)] px-3 py-1 rounded-full text-[var(--color-brand-dark)]">+ Warenkorb</span>
              </div>
            </div>

            {/* Dummy Product 2 */}
            <div className="group cursor-pointer">
              <div className="aspect-square bg-[#f4a261]/20 rounded-3xl mb-4 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                  🍫
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">Double Choc Fudge</h3>
              <p className="text-[var(--color-brand-dark)] mb-2">Für alle Schokoholics.</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">3,90 €</span>
                <span className="text-sm font-medium bg-[var(--color-brand-bg)] px-3 py-1 rounded-full text-[var(--color-brand-dark)]">+ Warenkorb</span>
              </div>
            </div>

            {/* Dummy Product 3 */}
            <div className="group cursor-pointer">
              <div className="aspect-square bg-[#2a9d8f]/20 rounded-3xl mb-4 overflow-hidden relative">
                <div className="absolute inset-0 flex items-center justify-center text-5xl opacity-50 group-hover:scale-110 transition-transform duration-500">
                  🥜
                </div>
              </div>
              <h3 className="text-xl font-bold mb-1">Peanut Butter Crunch</h3>
              <p className="text-[var(--color-brand-dark)] mb-2">Salzig trifft süß.</p>
              <div className="flex justify-between items-center">
                <span className="font-bold text-lg">3,90 €</span>
                <span className="text-sm font-medium bg-[var(--color-brand-bg)] px-3 py-1 rounded-full text-[var(--color-brand-dark)]">+ Warenkorb</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
