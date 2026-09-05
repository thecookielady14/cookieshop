import { CalendarClock } from 'lucide-react';
import { getShopSettings, DEFAULT_ORDERS_CLOSED_MESSAGE } from '@/lib/shop-settings';

/**
 * Hinweis, wenn die Bestellannahme im Admin geschlossen wurde.
 *
 * Rendert nichts, solange der Shop Bestellungen annimmt – die Seiten, die
 * diesen Banner einbinden, laufen ohnehin dynamisch.
 */
export default async function OrdersClosedBanner() {
    const settings = await getShopSettings();
    if (settings.ordersOpen) return null;

    return (
        <div className="mb-10">
            <div
                role="status"
                className="max-w-4xl mx-auto bg-white border-2 border-[var(--color-brand-accent)] rounded-3xl p-6 lg:p-8 flex flex-col sm:flex-row gap-5 items-center shadow-sm"
            >
                <div className="flex-shrink-0 bg-[var(--color-brand-bg)] p-4 rounded-full">
                    <CalendarClock className="w-8 h-8 text-[var(--color-brand-primary)]" />
                </div>
                <div className="text-center sm:text-left">
                    <h2 className="font-serif text-xl font-bold text-[var(--color-brand-text)] mb-1">
                        Zurzeit keine Bestellannahme
                    </h2>
                    <p className="text-[var(--color-brand-dark)] leading-relaxed">
                        {settings.ordersClosedMessage || DEFAULT_ORDERS_CLOSED_MESSAGE}
                    </p>
                </div>
            </div>
        </div>
    );
}
