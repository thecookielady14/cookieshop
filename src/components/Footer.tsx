import Link from "next/link";
import { Instagram, Mail, Heart } from "lucide-react";

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
        </svg>
    );
}

export default function Footer() {
    return (
        <footer className="bg-[var(--color-brand-text)] text-[var(--color-brand-secondary)] py-12 px-6 lg:px-12 mt-20">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
                <div className="md:col-span-2">
                    <h3 className="text-2xl font-bold mb-4 text-white">The Cookie Lady</h3>
                    <p className="max-w-sm mb-6 opacity-80">
                        Handgemachte Cookies mit regionalen Zutaten und ganz viel Liebe gebacken.
                        Jeder Keks ist ein kleines Kunstwerk.
                    </p>
                    <div className="flex gap-4">
                        <a href="https://www.instagram.com/the.cookie_lady?igsh=dmZxbWloeTdnemZz" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors bg-white/10 p-2 rounded-full"><Instagram className="w-5 h-5" /></a>
                        <a href="https://wa.me/4915129786411" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors bg-white/10 p-2 rounded-full"><WhatsAppIcon className="w-5 h-5" /></a>
                        <a href="mailto:kontakt@thecookielady.de" className="hover:text-white transition-colors bg-white/10 p-2 rounded-full"><Mail className="w-5 h-5" /></a>
                    </div>
                </div>

                <div>
                    <h4 className="font-bold text-white mb-4">Shop</h4>
                    <ul className="space-y-2 opacity-80">
                        <li><Link href="/shop" prefetch={false} className="hover:text-white hover:underline transition">Alle Cookies</Link></li>
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
                <p className="flex items-center gap-1 mt-2 sm:mt-0">Made with <Heart className="w-4 h-4 text-[var(--color-brand-accent)]" strokeWidth={4} /></p>
            </div>
        </footer>
    );
}
