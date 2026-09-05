/**
 * Allergene im Zutatenverzeichnis hervorheben.
 *
 * Die LMIV verlangt, dass allergene Zutaten im Zutatenverzeichnis optisch
 * hervorgehoben werden (Art. 21 Abs. 1 lit. b) – etwa durch Fettdruck. Statt
 * das beim Eintippen von Hand zu erledigen, werden die im Feld „Allergene“
 * genannten Begriffe hier automatisch im Zutatentext markiert.
 */

export type IngredientPart = { text: string; isAllergen: boolean };

function escapeForRegex(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Zerlegt den Zutatentext in Abschnitte und markiert die Stellen, an denen ein
 * Allergen vorkommt. Gibt es nichts zu markieren, kommt der Text als einzelner
 * Abschnitt zurück.
 */
export function highlightAllergens(
    ingredients: string,
    allergens: string | null | undefined
): IngredientPart[] {
    if (!ingredients) return [];
    if (!allergens) return [{ text: ingredients, isAllergen: false }];

    const terms = allergens
        .split(/[,;/]|\bund\b/i)
        .map((t) => t.trim())
        // Sehr kurze Fragmente würden quer durch den Text treffen ("Ei" in "Eiweiß"
        // ist gewollt, "e" wäre Unsinn), deshalb erst ab zwei Zeichen.
        .filter((t) => t.length >= 2)
        // Längere Begriffe zuerst, damit "Hartweizengrieß" nicht von "Weizen"
        // zerschnitten wird.
        .sort((a, b) => b.length - a.length);

    if (terms.length === 0) return [{ text: ingredients, isAllergen: false }];

    const pattern = new RegExp(`(${terms.map(escapeForRegex).join('|')})`, 'gi');
    const parts: IngredientPart[] = [];
    let lastIndex = 0;

    for (const match of ingredients.matchAll(pattern)) {
        const index = match.index ?? 0;
        if (index > lastIndex) {
            parts.push({ text: ingredients.slice(lastIndex, index), isAllergen: false });
        }
        parts.push({ text: match[0], isAllergen: true });
        lastIndex = index + match[0].length;
    }

    if (lastIndex < ingredients.length) {
        parts.push({ text: ingredients.slice(lastIndex), isAllergen: false });
    }

    return parts;
}
