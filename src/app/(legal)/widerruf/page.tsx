import type { Metadata } from "next";
import LegalSections from "@/components/LegalSections";
import { widerruf } from "@/lib/legal-texts";

export const metadata: Metadata = {
    title: "Widerrufsbelehrung",
    description: "Informationen zum Widerrufsrecht und dessen Ausschluss bei frischen Lebensmitteln im Online-Shop The Cookie Lady.",
};

// Der Text steht in lib/legal-texts.ts, weil er auch in jede Bestellbestätigung geht.
export default function Widerruf() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-4xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <LegalSections text={widerruf} />
            </div>
        </div>
    );
}
