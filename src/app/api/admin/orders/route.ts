import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { isAdminEmail } from '@/lib/admin-auth';
import { getShopSettings, calculateShipping } from '@/lib/shop-settings';
import { validateSelection } from '@/lib/catalog';

/**
 * Erfasst eine telefonisch aufgegebene Bestellung.
 *
 * Die Rechnung dafür schreibst du in Lexware – hier landet die Bestellung nur
 * in der Übersicht, damit Umsatz, Kundschaft und die Backliste an einer Stelle
 * stehen statt verstreut über zwei Systeme.
 *
 * Läuft serverseitig mit dem Service-Role-Key, weil die Tabelle orders per RLS
 * keine Schreibzugriffe aus dem Browser zulässt.
 */

interface IncomingItem {
    id: string;
    quantity: number;
    varieties?: { varietyId: string; quantity: number }[];
}

interface ProductRow {
    id: string;
    name: string;
    price: number | string;
    kind: 'fixed' | 'configurable';
    piece_count: number | null;
    line_id: string;
    product_varieties: {
        variety_id: string;
        quantity: number;
        varieties: { id: string; name: string } | null;
    }[] | null;
}

export async function POST(req: Request) {
    // Nur eingeloggte Admins: der Adminbereich schickt sein Supabase-Token mit.
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
    }
    const { data: { user } } = await supabaseAdmin.auth.getUser(authHeader.slice(7));
    if (!user) {
        return NextResponse.json({ error: 'Nicht angemeldet.' }, { status: 401 });
    }
    // Angemeldet zu sein reicht nicht – es muss ein Adminkonto sein.
    if (!isAdminEmail(user.email)) {
        return NextResponse.json({ error: 'Keine Berechtigung.' }, { status: 403 });
    }

    try {
        const body = await req.json();
        const items: IncomingItem[] = body.items ?? [];
        const customerName: string = (body.customerName ?? '').trim();
        const customerEmail: string = (body.customerEmail ?? '').trim();
        const invoiceReference: string = (body.invoiceReference ?? '').trim();
        const notes: string = (body.notes ?? '').trim();
        const status: string = body.status === 'paid' ? 'paid' : 'pending';

        if (items.length === 0) {
            return NextResponse.json({ error: 'Bitte mindestens ein Produkt auswählen.' }, { status: 400 });
        }
        if (!customerName) {
            return NextResponse.json({ error: 'Bitte einen Namen eintragen.' }, { status: 400 });
        }

        // Preise und feste Zusammensetzungen immer aus der Datenbank
        const { data: productRows, error: dbError } = await supabaseAdmin
            .from('products')
            .select('id, name, price, kind, piece_count, line_id, product_varieties(variety_id, quantity, varieties(id, name))')
            .in('id', items.map((i) => i.id));

        if (dbError || !productRows) {
            return NextResponse.json({ error: 'Produkte konnten nicht geladen werden.' }, { status: 503 });
        }
        const dbProducts = productRows as unknown as ProductRow[];

        // Wählbare Sorten je Linie – nur für Kartons zum Selbstzusammenstellen
        const configurableLineIds = [
            ...new Set(dbProducts.filter((p) => p.kind === 'configurable').map((p) => p.line_id)),
        ];
        const { data: lineVarieties } = configurableLineIds.length
            ? await supabaseAdmin
                  .from('varieties')
                  .select('id, name, line_id')
                  .eq('is_available', true)
                  .in('line_id', configurableLineIds)
            : { data: [] as { id: string; name: string; line_id: string }[] };

        let goodsTotal = 0;
        const orderItems: {
            product_id: string;
            quantity: number;
            price: number;
            varieties: { variety_id: string; name: string; quantity: number }[];
        }[] = [];

        for (const item of items) {
            const product = dbProducts.find((p) => p.id === item.id);
            if (!product) {
                return NextResponse.json({ error: 'Ein Produkt wurde nicht gefunden.' }, { status: 400 });
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return NextResponse.json({ error: `Ungültige Menge bei "${product.name}".` }, { status: 400 });
            }

            let composition: { variety_id: string; name: string; quantity: number }[];

            if (product.kind === 'configurable') {
                const allowed = (lineVarieties ?? [])
                    .filter((v) => v.line_id === product.line_id)
                    .map((v) => ({ id: v.id, name: v.name }));

                const check = validateSelection(
                    { kind: 'configurable', pieceCount: product.piece_count, name: product.name },
                    item.varieties ?? [],
                    allowed
                );
                if (!check.ok) {
                    return NextResponse.json({ error: check.error }, { status: 400 });
                }
                composition = check.entries.map((e) => ({
                    variety_id: e.varietyId,
                    name: e.name,
                    quantity: e.quantity,
                }));
            } else {
                composition = (product.product_varieties ?? [])
                    .filter((r) => r.varieties)
                    .map((r) => ({
                        variety_id: r.variety_id,
                        name: r.varieties!.name,
                        quantity: r.quantity,
                    }));
            }

            const price = Number(product.price);
            goodsTotal += price * item.quantity;
            orderItems.push({
                product_id: product.id,
                quantity: item.quantity,
                price,
                varieties: composition,
            });
        }

        // Versandkosten: Vorgabe aus den Shop-Einstellungen, im Formular überschreibbar
        const settings = await getShopSettings();
        const shippingCost =
            typeof body.shippingCost === 'number' && body.shippingCost >= 0
                ? body.shippingCost
                : calculateShipping(goodsTotal, settings);

        const totalAmount = Math.round((goodsTotal + shippingCost) * 100) / 100;

        // Kopf, Positionen und Sorten in einer Transaktion – eine halbe
        // Bestellung ist schlimmer als gar keine.
        const { data: orderId, error: orderError } = await supabaseAdmin.rpc('record_order', {
            payload: {
                customer_name: customerName,
                // Ohne E-Mail geht die Bestätigung als ausgedruckte Rechnung mit ins Paket.
                customer_email: customerEmail || null,
                stripe_session_id: null,
                total_amount: totalAmount,
                status,
                source: 'phone',
                shipping_address: body.shippingAddress ?? null,
                invoice_reference: invoiceReference || null,
                notes: notes || null,
                items: orderItems,
            },
        });

        if (orderError) throw orderError;

        return NextResponse.json({ orderId });
    } catch (error: unknown) {
        console.error('Telefonbestellung konnte nicht angelegt werden:', error);
        return NextResponse.json(
            { error: 'Die Bestellung konnte nicht gespeichert werden. Bitte noch einmal versuchen.' },
            { status: 500 }
        );
    }
}
