import { create } from 'zustand';
import { persist } from 'zustand/middleware';

/** Eine Sorte innerhalb einer Warenkorbposition. */
export interface CartVariety {
    varietyId: string;
    /** Name zum Zeitpunkt des Hinzufügens – für Warenkorb, Stripe und E-Mail. */
    name: string;
    quantity: number;
}

export interface CartItem {
    /**
     * Identität der Position.
     *
     * Bis zum Konfigurator reichte die Produkt-ID. Ein selbst zusammengestellter
     * Karton kann aber mehrfach mit unterschiedlichem Inhalt im Korb liegen –
     * dann ist die Produkt-ID nicht mehr eindeutig, und ohne eigenen Schlüssel
     * würde der zweite Karton den ersten überschreiben.
     */
    key: string;
    /** products.id – das bleibt die verkaufte Einheit. */
    id: string;
    name: string;
    price: number;
    /** Anzahl Kartons, nicht Kekse. */
    quantity: number;
    imageUrl?: string;
    /** Nur bei zusammengestellten Kartons gesetzt. */
    varieties?: CartVariety[];
}

/**
 * Stabiler Schlüssel für eine Warenkorbposition.
 *
 * Sortiert, damit dieselbe Auswahl in anderer Klickreihenfolge denselben
 * Schlüssel ergibt und die Mengen zusammengezählt werden statt zwei Zeilen
 * anzulegen.
 */
export function makeCartKey(productId: string, varieties?: CartVariety[]): string {
    const parts = (varieties ?? [])
        .filter((v) => v.quantity > 0)
        .map((v) => `${v.varietyId}x${v.quantity}`)
        .sort();
    return parts.length === 0 ? productId : `${productId}#${parts.join('+')}`;
}

/** Zusammensetzung als Text: "3× Schoko, 3× Erdnuss". Leer, wenn es nichts zu zeigen gibt. */
export function describeVarieties(varieties?: CartVariety[]): string {
    if (!varieties || varieties.length === 0) return '';
    return varieties.map((v) => `${v.quantity}× ${v.name}`).join(' · ');
}

interface CartStore {
    items: CartItem[];
    addItem: (item: Omit<CartItem, 'key'>) => void;
    removeItem: (key: string) => void;
    updateQuantity: (key: string, quantity: number) => void;
    clearCart: () => void;
    getCartTotal: () => number;
    getCartCount: () => number;
}

export const useCartStore = create<CartStore>()(
    persist(
        (set, get) => ({
            items: [],

            addItem: (newItem) => {
                const key = makeCartKey(newItem.id, newItem.varieties);
                set((state) => {
                    const existing = state.items.find((item) => item.key === key);
                    if (existing) {
                        return {
                            items: state.items.map((item) =>
                                item.key === key
                                    ? { ...item, quantity: item.quantity + (newItem.quantity || 1) }
                                    : item
                            ),
                        };
                    }
                    return {
                        items: [...state.items, { ...newItem, key, quantity: newItem.quantity || 1 }],
                    };
                });
            },

            removeItem: (key) => {
                set((state) => ({ items: state.items.filter((item) => item.key !== key) }));
            },

            updateQuantity: (key, quantity) => {
                set((state) => ({
                    items: state.items.map((item) =>
                        item.key === key ? { ...item, quantity: Math.max(1, quantity) } : item
                    ),
                }));
            },

            clearCart: () => set({ items: [] }),

            getCartTotal: () =>
                get().items.reduce((total, item) => total + item.price * item.quantity, 0),

            getCartCount: () => get().items.reduce((count, item) => count + item.quantity, 0),
        }),
        {
            name: 'cookie-lady-cart',
            /**
             * Warenkörbe, die vor dieser Änderung im Browser lagen, haben kein
             * `key`. Ohne Umzug wäre er undefined – Ändern und Entfernen würden
             * dann stillschweigend ins Leere laufen.
             */
            version: 2,
            migrate: (persisted: unknown, version) => {
                const state = persisted as { items?: CartItem[] } | undefined;
                if (version < 2 && state && Array.isArray(state.items)) {
                    state.items = state.items.map((item) => ({
                        ...item,
                        key: item.key ?? makeCartKey(item.id, item.varieties),
                    }));
                }
                return state as never;
            },
        }
    )
);
