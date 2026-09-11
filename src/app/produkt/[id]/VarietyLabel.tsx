import Image from "next/image";
import { Wheat, AlertTriangle, Lightbulb, BarChart3, ChevronDown } from "lucide-react";
import { highlightAllergens } from "@/lib/allergens";
import type { Variety } from "@/lib/catalog";

/**
 * Pflichtangaben einer Sorte.
 *
 * Ein gemischter Karton hat kein einzelnes Zutatenverzeichnis – jede Sorte
 * braucht ihre eigenen Angaben. Dieser Block wird deshalb je enthaltener
 * beziehungsweise wählbarer Sorte gerendert, und zwar serverseitig: nach
 * Art. 14 LMIV müssen die Angaben vor dem Kaufabschluss verfügbar sein und
 * dürfen nicht hinter einer Klickstrecke im Browser liegen.
 */
export default function VarietyLabel({
    variety,
    quantity,
}: {
    variety: Variety;
    /** Stückzahl in der Verkaufseinheit; fehlt beim Konfigurator. */
    quantity?: number;
}) {
    const nutritionRows = [
        {
            label: 'Energie',
            value: [
                variety.nutrition.energyKj !== null ? `${format(variety.nutrition.energyKj)} kJ` : null,
                variety.nutrition.energyKcal !== null ? `${format(variety.nutrition.energyKcal)} kcal` : null,
            ].filter(Boolean).join(' / '),
            indented: false,
        },
        { label: 'Fett', value: unit(variety.nutrition.fatG), indented: false },
        { label: 'davon gesättigte Fettsäuren', value: unit(variety.nutrition.saturatedFatG), indented: true },
        { label: 'Kohlenhydrate', value: unit(variety.nutrition.carbsG), indented: false },
        { label: 'davon Zucker', value: unit(variety.nutrition.sugarG), indented: true },
        { label: 'Eiweiß', value: unit(variety.nutrition.proteinG), indented: false },
        { label: 'Salz', value: unit(variety.nutrition.saltG), indented: false },
    ].filter((row) => row.value);

    return (
        <details className="group border border-neutral-200 rounded-2xl overflow-hidden bg-white">
            <summary className="flex items-center justify-between gap-4 p-4 cursor-pointer list-none hover:bg-[var(--color-brand-secondary)]/40 transition-colors">
                <span className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="relative flex-shrink-0 w-14 h-14 rounded-xl overflow-hidden bg-[var(--color-brand-secondary)]">
                        {variety.imageUrl ? (
                            <Image src={variety.imageUrl} alt={variety.name} fill className="object-cover" sizes="56px" />
                        ) : (
                            <span className="absolute inset-0 flex items-center justify-center text-2xl">🍪</span>
                        )}
                        {quantity !== undefined && (
                            <span
                                className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[var(--color-brand-primary)] text-white text-xs font-bold flex items-center justify-center ring-2 ring-white"
                                aria-label={`${quantity} Stück`}
                            >
                                {quantity}
                            </span>
                        )}
                    </span>
                    <span className="min-w-0">
                        <span className="font-bold text-[var(--color-brand-text)] block truncate">{variety.name}</span>
                        {variety.legalName && (
                            <span className="text-xs text-neutral-500 block truncate">{variety.legalName}</span>
                        )}
                    </span>
                </span>
                {/* Auf dem Handy nur der Pfeil: ausgeschrieben belegte dieser
                    Hinweis 138 von 390 Pixeln und quetschte den Sortennamen auf
                    zwei Buchstaben zusammen. Bei einem Lebensmittel ist aber
                    genau die Sorte die Information, die lesbar bleiben muss. */}
                <span className="flex items-center gap-1.5 text-sm font-medium text-[var(--color-brand-primary)] whitespace-nowrap flex-shrink-0">
                    <span className="hidden sm:inline">
                        Angaben <span className="group-open:hidden">einblenden</span><span className="hidden group-open:inline">ausblenden</span>
                    </span>
                    <span className="sr-only sm:hidden">Angaben ein- oder ausblenden</span>
                    <ChevronDown className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" aria-hidden="true" />
                </span>
            </summary>

            <div className="px-4 pb-5 pt-1 space-y-5 border-t border-neutral-100">
                {variety.description && (
                    <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed pt-4">
                        {variety.description}
                    </p>
                )}

                {variety.ingredients && (
                    <div>
                        <h4 className="font-bold text-sm text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                            <Wheat className="w-4 h-4 text-[var(--color-brand-primary)] flex-shrink-0" />
                            Zutatenverzeichnis
                        </h4>
                        <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">
                            {highlightAllergens(variety.ingredients, variety.allergens).map((part, i) =>
                                part.isAllergen ? (
                                    <strong key={i} className="font-bold text-[var(--color-brand-text)]">{part.text}</strong>
                                ) : (
                                    <span key={i}>{part.text}</span>
                                )
                            )}
                        </p>
                        <p className="text-xs text-neutral-400 mt-2">
                            Allergene sind <strong className="font-bold">fett</strong> hervorgehoben.
                        </p>
                    </div>
                )}

                {variety.allergens && (
                    <div>
                        <h4 className="font-bold text-sm text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                            <AlertTriangle className="w-4 h-4 text-[var(--color-brand-primary)] flex-shrink-0" />
                            Allergene
                        </h4>
                        <p className="text-sm text-red-800 font-medium leading-relaxed bg-red-50 p-3 rounded-xl border border-red-100">
                            {variety.allergens}
                        </p>
                    </div>
                )}

                {variety.consumerInfo && (
                    <div>
                        <h4 className="font-bold text-sm text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                            <Lightbulb className="w-4 h-4 text-[var(--color-brand-primary)] flex-shrink-0" />
                            Verbraucherhinweise
                        </h4>
                        <p className="text-sm text-[var(--color-brand-dark)] leading-relaxed">{variety.consumerInfo}</p>
                    </div>
                )}

                {nutritionRows.length > 0 && (
                    <div>
                        <h4 className="font-bold text-sm text-[var(--color-brand-text)] mb-2 flex items-center gap-2">
                            <BarChart3 className="w-4 h-4 text-[var(--color-brand-primary)] flex-shrink-0" />
                            Nährwerte je 100 g
                        </h4>
                        <table className="w-full text-sm text-[var(--color-brand-dark)]">
                            <tbody>
                                {nutritionRows.map((row) => (
                                    <tr key={row.label} className="border-b border-neutral-100 last:border-0">
                                        <td className={`py-1.5 ${row.indented ? 'pl-4 text-neutral-500' : ''}`}>{row.label}</td>
                                        <td className="py-1.5 text-right font-medium whitespace-nowrap">{row.value}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

                {variety.pieceWeightGrams !== null && (
                    <p className="text-xs text-neutral-400">
                        Ein Keks wiegt etwa {format(variety.pieceWeightGrams)} g.
                    </p>
                )}
            </div>
        </details>
    );
}

function format(value: number): string {
    return String(value).replace('.', ',');
}

function unit(value: number | null): string {
    return value === null ? '' : `${format(value)} g`;
}
