import { supabase } from '@/lib/supabase';

export interface ShippingSettings {
    /** Versandkosten in Euro */
    shippingCost: number;
    /** Ab diesem Warenkorbwert ist der Versand kostenlos. null = nie kostenlos. */
    freeShippingThreshold: number | null;
    deliveryDaysMin: number;
    deliveryDaysMax: number;
}

/**
 * Fallback, falls die Tabelle `shop_settings` noch nicht existiert oder die DB
 * nicht erreichbar ist. Entspricht den Werten, die früher im Code standen.
 */
export const DEFAULT_SHIPPING_SETTINGS: ShippingSettings = {
    shippingCost: 4.9,
    freeShippingThreshold: 30,
    deliveryDaysMin: 2,
    deliveryDaysMax: 4,
};

/**
 * Lädt die Versandeinstellungen aus der Datenbank. Schlägt das fehl, werden die
 * Standardwerte geliefert – der Shop bleibt also auch ohne die Tabelle bestellbar.
 */
export async function getShippingSettings(): Promise<ShippingSettings> {
    try {
        const { data, error } = await supabase
            .from('shop_settings')
            .select('shipping_cost, free_shipping_threshold, delivery_days_min, delivery_days_max')
            .eq('id', 1)
            .maybeSingle();

        if (error || !data) return DEFAULT_SHIPPING_SETTINGS;

        return {
            shippingCost: Number(data.shipping_cost),
            freeShippingThreshold:
                data.free_shipping_threshold === null ? null : Number(data.free_shipping_threshold),
            deliveryDaysMin: data.delivery_days_min,
            deliveryDaysMax: data.delivery_days_max,
        };
    } catch {
        return DEFAULT_SHIPPING_SETTINGS;
    }
}

/**
 * Versandkosten für eine Zwischensumme (Warenwert OHNE Versand).
 * Einzige Stelle, an der die Freigrenze ausgewertet wird – damit Warenkorb,
 * Stripe-Checkout und E-Mail garantiert dasselbe Ergebnis liefern.
 */
export function calculateShipping(subtotal: number, settings: ShippingSettings): number {
    const { shippingCost, freeShippingThreshold } = settings;
    if (freeShippingThreshold !== null && subtotal >= freeShippingThreshold) return 0;
    return shippingCost;
}

/** Preis im deutschen Format, z.B. "4,90 €" */
export function formatEuro(value: number): string {
    return `${value.toFixed(2).replace('.', ',')} €`;
}
