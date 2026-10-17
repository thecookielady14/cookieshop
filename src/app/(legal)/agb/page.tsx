import type { Metadata } from "next";
import LegalSections from "@/components/LegalSections";
import { agb } from "@/lib/legal-texts";

export const metadata: Metadata = {
    title: "AGB – Allgemeine Geschäftsbedingungen",
    description: "Allgemeine Geschäftsbedingungen für den Online-Shop The Cookie Lady. Informationen zu Vertragsschluss, Zahlung, Lieferung und Gewährleistung.",
};

// Der Text steht in lib/legal-texts.ts, weil er auch in jede Bestellbestätigung geht.
export default function AGB() {
    return (
        <div className="bg-[var(--color-brand-bg)] min-h-screen pt-32 pb-20 px-6 lg:px-12">
            <div className="max-w-4xl mx-auto bg-white p-8 lg:p-12 rounded-3xl shadow-sm">
                <LegalSections text={agb} />
            </div>
        </div>
    );
}
