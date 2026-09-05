'use client';

import { usePathname } from 'next/navigation';

/**
 * Blendet die Kundennavigation im Adminbereich aus.
 *
 * Navbar und Fußzeile hängen im Root-Layout und galten damit auch für
 * /admin – über dem Dashboard mit seiner eigenen Seitenleiste sah das
 * unaufgeräumt aus. Die Kinder werden weiterhin auf dem Server gerendert und
 * hier nur noch je nach Pfad angezeigt.
 */
export default function HideOnAdmin({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    if (pathname?.startsWith('/admin')) return null;
    return <>{children}</>;
}
