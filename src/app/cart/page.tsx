import type { Metadata } from "next";
import { getShippingSettings } from "@/lib/shipping";
import CartClient from "./CartClient";

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
    title: "Dein Warenkorb",
    robots: { index: false, follow: true },
};

export default async function CartPage() {
    // Versandkosten kommen aus den Shop-Einstellungen, damit Warenkorb und
    // Stripe-Checkout garantiert denselben Betrag anzeigen.
    const settings = await getShippingSettings();

    return <CartClient settings={settings} />;
}
