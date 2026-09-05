import { supabase } from '@/lib/supabase';

export interface ShopSettings {
    /** Versandkosten in Euro */
    shippingCost: number;
    /** Ab diesem Warenkorbwert ist der Versand kostenlos. null = nie kostenlos. */
    freeShippingThreshold: number | null;
    deliveryDaysMin: number;
    deliveryDaysMax: number;
    /** false = der Shop nimmt zurzeit keine Bestellungen an. */
    ordersOpen: boolean;
    /** Eigener Hinweistext bei geschlossener Bestellannahme; null = Standardtext. */
    ordersClosedMessage: string | null;
}

/** Text, der bei geschlossener Bestellannahme angezeigt wird. */
export const DEFAULT_ORDERS_CLOSED_MESSAGE =
    'Ich backe gerade die Bestellungen dieser Woche und nehme deshalb vorübergehend keine neuen an. Schau bald wieder vorbei – es lohnt sich!';

/**
 * Fallback, falls die Tabelle `shop_settings` noch nicht existiert oder die DB
 * nicht erreichbar ist. Entspricht den Werten, die früher im Code standen.
 */
export const DEFAULT_SHOP_SETTINGS: ShopSettings = {
    shippingCost: 4.9,
    freeShippingThreshold: 30,
    deliveryDaysMin: 2,
    deliveryDaysMax: 4,
    ordersOpen: true,
    ordersClosedMessage: null,
};

/**
 * Lädt die Shop-Einstellungen aus der Datenbank. Schlägt das fehl, werden die
 * Standardwerte geliefert – der Shop bleibt also auch ohne die Tabelle bestellbar.
 */
export async function getShopSettings(): Promise<ShopSettings> {
    try {
        const { data, error } = await supabase
            .from('shop_settings')
            .select('shipping_cost, free_shipping_threshold, delivery_days_min, delivery_days_max, orders_open, orders_closed_message')
            .eq('id', 1)
            .maybeSingle();

        if (error || !data) return DEFAULT_SHOP_SETTINGS;

        return {
            shippingCost: Number(data.shipping_cost),
            freeShippingThreshold:
                data.free_shipping_threshold === null ? null : Number(data.free_shipping_threshold),
            deliveryDaysMin: data.delivery_days_min,
            deliveryDaysMax: data.delivery_days_max,
            ordersOpen: data.orders_open !== false,
            ordersClosedMessage: data.orders_closed_message ?? null,
        };
    } catch {
        return DEFAULT_SHOP_SETTINGS;
    }
}

/**
 * Versandkosten für eine Zwischensumme (Warenwert OHNE Versand).
 * Einzige Stelle, an der die Freigrenze ausgewertet wird – damit Warenkorb,
 * Stripe-Checkout und E-Mail garantiert dasselbe Ergebnis liefern.
 */
export function calculateShipping(subtotal: number, settings: ShopSettings): number {
    const { shippingCost, freeShippingThreshold } = settings;
    if (freeShippingThreshold !== null && subtotal >= freeShippingThreshold) return 0;
    return shippingCost;
}

/** Preis im deutschen Format, z.B. "4,90 €" */
export function formatEuro(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} €`;
}
