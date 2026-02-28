import Link from "next/link";
import { Instagram, Mail, Heart } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-[var(--color-brand-text)] text-[var(--color-brand-secondary)] py-12 px-6 lg:px-12 mt-20 rounded-t-3xl">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold mb-4 text-white">The Cookie Lady</h3>
                    <p className="max-w-sm mb-6 opacity-80">
                        Handgemachte Cookies mit puren Zutaten und ganz viel Liebe gebacken.
                        Jeder Keks ist ein kleines Kunstwerk.
                    </p>
                    <div className="flex gap-4">
                        <a href="#" className="hover:text-white transition-colors bg-white/10 p-2 rounded-full"><Instagram className="w-5 h-5" /></a>
                        <a href="mailto:kontakt@thecookielady.de" className="hover:text-white transition-colors bg-white/10 p-2 rounded-full"><Mail className="w-5 h-5" /></a>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-4">Shop</h4>
                    <ul className="space-y-2 opacity-80">
                        <li><Link href="/shop" className="hover:text-white hover:underline transition">Alle Cookies</Link></li>
                        <li><Link href="/about" className="hover:text-white hover:underline transition">Über Mich</Link></li>
                        <li><Link href="/faq" className="hover:text-white hover:underline transition">FAQ</Link></li>
                    </ul>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-4">Rechtliches</h4>
                    <ul className="space-y-2 opacity-80">
                        <li><Link href="/impressum" className="hover:text-white hover:underline transition">Impressum</Link></li>
                        <li><Link href="/datenschutz" className="hover:text-white hover:underline transition">Datenschutz</Link></li>
                        <li><Link href="/agb" className="hover:text-white hover:underline transition">AGB</Link></li>
                        <li><Link href="/widerruf" className="hover:text-white hover:underline transition">Widerrufsbelehrung</Link></li>
                    </ul>
                </div>
            </div>
            <div className="max-w-7xl mx-auto mt-12 pt-8 border-t border-white/10 text-sm opacity-60 flex flex-col sm:flex-row justify-between items-center text-center sm:text-left">
                <p>© {new Date().getFullYear()} The Cookie Lady. Alle Rechte vorbehalten.</p>
                <p className="flex items-center gap-1 mt-2 sm:mt-0">Made with <Heart className="w-4 h-4 text-[var(--color-brand-accent)] fill-[var(--color-brand-accent)]" /></p>
            </div>
        </footer>
    );
}
