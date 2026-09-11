import { supabase } from '@/lib/supabase';

/**
 * Zugriff auf das Sortiment: Linien, Sorten und verkaufbare Einheiten.
 *
 * Das Sortiment hat drei Ebenen:
 *   Linie (product_lines) -> Sorte/Rezept (varieties) -> Einheit (products)
 *
 * Eine Sorte wird nie direkt verkauft. Verkauft wird immer ein Produkt –
 * entweder mit fester Zusammenstellung (sortenrein, Probierkarton) oder zum
 * Selbstzusammenstellen. Alle Berechnungen rund um Füllmenge und Grundpreis
 * stehen hier, damit Produktseite, Warenkorb, Checkout und Adminbereich
 * garantiert dasselbe rechnen.
 */

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export interface Nutrition {
    energyKj: number | null;
    energyKcal: number | null;
    fatG: number | null;
    saturatedFatG: number | null;
    carbsG: number | null;
    sugarG: number | null;
    proteinG: number | null;
    saltG: number | null;
}

export interface ProductLine {
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    description: string | null;
    imageUrl: string | null;
    sortOrder: number;
    isActive: boolean;
}

export interface Variety {
    id: string;
    lineId: string;
    name: string;
    legalName: string | null;
    description: string | null;
    ingredients: string | null;
    allergens: string | null;
    consumerInfo: string | null;
    /** Gewicht eines einzelnen Kekses dieser Sorte. */
    pieceWeightGrams: number | null;
    imageUrl: string | null;
    isAvailable: boolean;
    sortOrder: number;
    nutrition: Nutrition;
}

/** Eine Sorte mit ihrer Menge innerhalb einer Verkaufseinheit. */
export interface CompositionEntry {
    variety: Variety;
    quantity: number;
}

export type ProductKind = 'fixed' | 'configurable';

export interface Product {
    id: string;
    lineId: string;
    name: string;
    legalName: string | null;
    description: string | null;
    price: number;
    kind: ProductKind;
    /** Anzahl Kekse in der Einheit; null bei Ware, die nach Gewicht verkauft wird. */
    pieceCount: number | null;
    /** Nur die deklarierte Nennfüllmenge. Bei Stückware aus den Sorten gerechnet. */
    weightGrams: number | null;
    consumerInfo: string | null;
    imageUrl: string | null;
    isAvailable: boolean;
    isBestseller: boolean;
    sortOrder: number;
}

export interface ProductDetail extends Product {
    line: ProductLine | null;
    /** Bei kind === 'fixed': was tatsächlich drin ist. */
    composition: CompositionEntry[];
    /** Bei kind === 'configurable': woraus gewählt werden kann. */
    selectableVarieties: Variety[];
}

// ---------------------------------------------------------------------------
// Umwandlung aus den Datenbankzeilen
// ---------------------------------------------------------------------------

const num = (v: unknown): number | null =>
    v === null || v === undefined ? null : Number(v);

function toLine(row: any): ProductLine {
    return {
        id: row.id,
        slug: row.slug,
        name: row.name,
        tagline: row.tagline ?? null,
        description: row.description ?? null,
        imageUrl: row.image_url ?? null,
        sortOrder: row.sort_order ?? 0,
        isActive: row.is_active !== false,
    };
}

function toVariety(row: any): Variety {
    return {
        id: row.id,
        lineId: row.line_id,
        name: row.name,
        legalName: row.legal_name ?? null,
        description: row.description ?? null,
        ingredients: row.ingredients ?? null,
        allergens: row.allergens ?? null,
        consumerInfo: row.consumer_info ?? null,
        pieceWeightGrams: num(row.piece_weight_grams),
        imageUrl: row.image_url ?? null,
        isAvailable: row.is_available === true,
        sortOrder: row.sort_order ?? 0,
        nutrition: {
            energyKj: num(row.energy_kj),
            energyKcal: num(row.energy_kcal),
            fatG: num(row.fat_g),
            saturatedFatG: num(row.saturated_fat_g),
            carbsG: num(row.carbs_g),
            sugarG: num(row.sugar_g),
            proteinG: num(row.protein_g),
            saltG: num(row.salt_g),
        },
    };
}

function toProduct(row: any): Product {
    return {
        id: row.id,
        lineId: row.line_id,
        name: row.name,
        legalName: row.legal_name ?? null,
        description: row.description ?? null,
        price: Number(row.price),
        kind: row.kind === 'configurable' ? 'configurable' : 'fixed',
        pieceCount: row.piece_count ?? null,
        weightGrams: row.weight_grams ?? null,
        consumerInfo: row.consumer_info ?? null,
        imageUrl: row.image_url ?? null,
        isAvailable: row.is_available === true,
        isBestseller: row.is_bestseller === true,
        sortOrder: row.sort_order ?? 0,
    };
}

const VARIETY_COLUMNS =
    'id, line_id, name, legal_name, description, ingredients, allergens, consumer_info, ' +
    'piece_weight_grams, image_url, is_available, sort_order, ' +
    'energy_kj, energy_kcal, fat_g, saturated_fat_g, carbs_g, sugar_g, protein_g, salt_g';

// ---------------------------------------------------------------------------
// Laden
// ---------------------------------------------------------------------------
// Alle Funktionen liefern im Fehlerfall leere Listen statt zu werfen – ein
// Datenbankausfall soll die Seite nicht abstürzen lassen, sondern zu einem
// leeren Sortiment führen.

export async function getProductLines(includeInactive = false): Promise<ProductLine[]> {
    try {
        let query = supabase.from('product_lines').select('*').order('sort_order');
        if (!includeInactive) query = query.eq('is_active', true);

        const { data, error } = await query;
        if (error || !data) return [];
        return data.map(toLine);
    } catch {
        return [];
    }
}

export async function getLineBySlug(slug: string): Promise<ProductLine | null> {
    try {
        const { data, error } = await supabase
            .from('product_lines')
            .select('*')
            .eq('slug', slug)
            .maybeSingle();
        if (error || !data) return null;
        return toLine(data);
    } catch {
        return null;
    }
}

/**
 * Verkaufbare Einheiten, optional auf eine Linie eingeschränkt.
 * `onlyAvailable` filtert Entwürfe weg – im Shop immer true, im Admin false.
 */
export async function getProducts(options: {
    lineId?: string;
    onlyAvailable?: boolean;
} = {}): Promise<Product[]> {
    try {
        let query = supabase.from('products').select('*').order('sort_order');
        if (options.lineId) query = query.eq('line_id', options.lineId);
        if (options.onlyAvailable) query = query.eq('is_available', true);

        const { data, error } = await query;
        if (error || !data) return [];
        return data.map(toProduct);
    } catch {
        return [];
    }
}

/** Freigegebene Sorten einer Linie – die Auswahl für den Konfigurator. */
export async function getLineVarieties(lineId: string, onlyAvailable = true): Promise<Variety[]> {
    try {
        let query = supabase
            .from('varieties')
            .select(VARIETY_COLUMNS)
            .eq('line_id', lineId)
            .order('sort_order');
        if (onlyAvailable) query = query.eq('is_available', true);

        const { data, error } = await query;
        if (error || !data) return [];
        return data.map(toVariety);
    } catch {
        return [];
    }
}

/**
 * Ein Produkt mit allem, was die Produktseite braucht: Linie, tatsächliche
 * Zusammensetzung (bei festen Produkten) beziehungsweise die wählbaren Sorten
 * (beim Konfigurator).
 */
export async function getProductDetail(id: string): Promise<ProductDetail | null> {
    try {
        const { data, error } = await supabase
            .from('products')
            .select(`*, product_lines(*), product_varieties(quantity, varieties(${VARIETY_COLUMNS}))`)
            .eq('id', id)
            .maybeSingle();

        if (error || !data) return null;

        const product = toProduct(data);
        const line = data.product_lines ? toLine(data.product_lines) : null;

        const composition: CompositionEntry[] = (data.product_varieties ?? [])
            .filter((pv: any) => pv.varieties)
            .map((pv: any) => ({ variety: toVariety(pv.varieties), quantity: pv.quantity }))
            .sort((a: CompositionEntry, b: CompositionEntry) =>
                a.variety.sortOrder - b.variety.sortOrder || a.variety.name.localeCompare(b.variety.name, 'de')
            );

        const selectableVarieties =
            product.kind === 'configurable' ? await getLineVarieties(product.lineId) : [];

        return { ...product, line, composition, selectableVarieties };
    } catch {
        return null;
    }
}

// ---------------------------------------------------------------------------
// Berechnungen
// ---------------------------------------------------------------------------

/**
 * Nettofüllmenge einer Verkaufseinheit in Gramm.
 *
 * Ein gemischter Karton hat kein festes Gewicht – es hängt davon ab, welche
 * Sorten drin sind. Deshalb wird bei Stückware aus den Sorten gerechnet und
 * nur ersatzweise auf die deklarierte Nennfüllmenge zurückgegriffen.
 * Fehlt bei einer Sorte das Stückgewicht, ist das Ergebnis null statt einer
 * zu kleinen Zahl – lieber keine Angabe als eine falsche.
 */
export function netWeightGrams(
    product: Pick<Product, 'weightGrams'>,
    composition: { variety: Pick<Variety, 'pieceWeightGrams'>; quantity: number }[]
): number | null {
    if (composition.length > 0) {
        let total = 0;
        for (const entry of composition) {
            if (entry.variety.pieceWeightGrams === null) return product.weightGrams;
            total += entry.variety.pieceWeightGrams * entry.quantity;
        }
        return Math.round(total * 10) / 10;
    }
    return product.weightGrams;
}

/** Grundpreis je Kilogramm (PAngV). null, wenn das Gewicht unbekannt ist. */
export function pricePerKg(price: number, netGrams: number | null): number | null {
    if (!netGrams || netGrams <= 0) return null;
    return price / (netGrams / 1000);
}

/**
 * Zusammensetzung als kurzer Text: "3x Schoko, 3x Erdnuss".
 * Leer bei sortenreinen Einheiten – dort steht die Sorte schon im Produktnamen.
 */
export function describeComposition(
    composition: { name: string; quantity: number }[],
    maxLength = 200
): string {
    if (composition.length <= 1) return '';
    const text = composition.map((c) => `${c.quantity}× ${c.name}`).join(', ');
    return text.length > maxLength ? `${text.slice(0, maxLength - 1)}…` : text;
}

/**
 * Prüft eine Kundenauswahl gegen die erlaubten Sorten und die Zielstückzahl.
 * Wird von Konfigurator, Checkout und Telefonbestellung gemeinsam benutzt,
 * damit Anzeige und Abrechnung nicht auseinanderlaufen können.
 */
export function validateSelection(
    product: Pick<Product, 'kind' | 'pieceCount' | 'name'>,
    selection: { varietyId: string; quantity: number }[],
    allowed: Pick<Variety, 'id' | 'name'>[]
): { ok: true; entries: { varietyId: string; name: string; quantity: number }[] } | { ok: false; error: string } {
    const byId = new Map(allowed.map((v) => [v.id, v.name]));
    const entries: { varietyId: string; name: string; quantity: number }[] = [];
    let pieces = 0;

    for (const item of selection) {
        const quantity = Number(item.quantity);
        if (!Number.isInteger(quantity) || quantity <= 0) continue;

        const name = byId.get(item.varietyId);
        if (!name) {
            return {
                ok: false,
                error: 'Eine der gewählten Sorten ist nicht mehr verfügbar. Bitte stelle deinen Karton neu zusammen.',
            };
        }
        entries.push({ varietyId: item.varietyId, name, quantity });
        pieces += quantity;
    }

    if (product.kind === 'configurable') {
        const target = product.pieceCount ?? 0;
        if (pieces !== target) {
            return {
                ok: false,
                error: `Bitte stelle "${product.name}" mit genau ${target} Keksen zusammen – aktuell sind es ${pieces}.`,
            };
        }
    }

    return { ok: true, entries };
}
