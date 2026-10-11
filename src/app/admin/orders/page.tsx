import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
import { Phone } from "lucide-react";
import ClientOrderTable, { type Traceability } from "./ClientOrderTable";

// Initialize Supabase client for Server Component
const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const revalidate = 0; // Disable caching for the admin orders page

export default async function AdminOrders() {
    // Fetch orders from Supabase
    const { data: orders, error } = await supabase
        .from('orders')
        .select(`
            *,
            order_items (
                quantity,
                products ( name ),
                order_item_varieties ( id, variety_id, variety_name, quantity )
            )
        `)
        .order('created_at', { ascending: false })
        // Obergrenze, damit die Seite nicht irgendwann alles auf einmal lädt.
        // Für den Alltag reicht das weit: gefiltert wird im Browser, und die
        // Arbeitsliste "Zu erledigen" ist immer kurz. Wird sie einmal
        // überschritten, gehört hier echtes Blättern hin.
        .limit(500);

    if (error) console.error("Error fetching admin orders:", error);

    const traceability = await loadTraceability(orders ?? []);

    return (
        <div>
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Bestellungen</h1>
                <Link
                    href="/admin/orders/new"
                    className="flex items-center gap-2 bg-[var(--color-brand-primary)] text-white px-5 py-3 rounded-xl font-bold hover:opacity-90 transition-opacity"
                >
                    <Phone className="w-4 h-4" />
                    Telefonbestellung
                </Link>
            </div>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-x-auto">
                <ClientOrderTable initialOrders={orders || []} traceability={traceability} />
            </div>
        </div>
    );
}

/**
 * Backchargen fürs Packen: offene Chargen zur Auswahl und die bereits
 * zugeordneten je Sorte einer Bestellposition.
 *
 * Bewusst getrennt von der Bestellabfrage: solange rueckverfolgung.sql nicht
 * ausgeführt ist, fehlen die Tabellen. Eingebettet würde dann die ganze
 * Bestellliste nicht laden – so fällt nur die Chargenspalte weg (null).
 */
async function loadTraceability(orders: any[]): Promise<Traceability | null> {
    const { data: openBatches, error } = await supabase
        .from('bake_batches')
        .select('id, code, variety_id, variety_name')
        .eq('is_closed', false)
        .order('batch_number', { ascending: false });
    if (error) return null;

    const oivIds: string[] = orders.flatMap((o) =>
        (o.order_items ?? []).flatMap((i: any) => (i.order_item_varieties ?? []).map((v: any) => v.id))
    );

    // In Häppchen, weil die IDs in der URL landen und PostgREST ohnehin nur
    // 1000 Zeilen je Abfrage liefert.
    const assigned: Traceability['assigned'] = {};
    for (let i = 0; i < oivIds.length; i += 150) {
        const { data, error: e } = await supabase
            .from('order_item_variety_batches')
            .select('order_item_variety_id, batch_id, bake_batches(code)')
            .in('order_item_variety_id', oivIds.slice(i, i + 150));
        if (e) return null;
        for (const row of (data ?? []) as any[]) {
            (assigned[row.order_item_variety_id] ??= []).push({
                batch_id: row.batch_id,
                code: row.bake_batches?.code ?? '?',
            });
        }
    }

    return { openBatches: openBatches ?? [], assigned };
}
