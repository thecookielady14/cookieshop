import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminEmail } from '@/lib/admin-auth';
import { getShippingSettings, calculateShipping } from '@/lib/shipping';

const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

interface IncomingItem {
    id: string;
    quantity: number;
}

/**
 * Erfasst eine telefonisch aufgegebene Bestellung.
 *
 * Die Rechnung dafür schreibst du in Lexware – hier geht es nur darum, dass der
 * Shop den Lagerbestand kennt und die Bestellung in der Übersicht auftaucht.
 * Sonst verkauft der Shop dieselben Kekse ein zweites Mal online.
 *
 * Läuft serverseitig mit dem Service-Role-Key, weil die Tabelle `orders` per
 * RLS keine Schreibzugriffe aus dem Browser zulässt.
 */
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

        // Preise immer aus der Datenbank, nie aus dem Formular
        const { data: dbProducts, error: dbError } = await supabaseAdmin
            .from('products')
            .select('id, name, price, stock_count')
            .in('id', items.map((i) => i.id));

        if (dbError || !dbProducts) {
            return NextResponse.json({ error: 'Produkte konnten nicht geladen werden.' }, { status: 503 });
        }

        let goodsTotal = 0;
        const orderItems: { product_id: string; quantity: number; price_at_time: number }[] = [];

        for (const item of items) {
            const product = dbProducts.find((p) => p.id === item.id);
            if (!product) {
                return NextResponse.json({ error: 'Ein Produkt wurde nicht gefunden.' }, { status: 400 });
            }
            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return NextResponse.json(
                    { error: `Ungültige Menge bei "${product.name}".` },
                    { status: 400 }
                );
            }
            // is_available wird bewusst nicht geprüft: am Telefon weißt du selbst,
            // ob du noch etwas da hast. Der Bestand muss aber reichen.
            if (typeof product.stock_count === 'number' && item.quantity > product.stock_count) {
                return NextResponse.json(
                    { error: `Von "${product.name}" sind nur noch ${product.stock_count} Stück auf Lager.` },
                    { status: 400 }
                );
            }

            goodsTotal += product.price * item.quantity;
            orderItems.push({
                product_id: product.id,
                quantity: item.quantity,
                price_at_time: product.price,
            });
        }

        // Versandkosten: Vorgabe aus den Shop-Einstellungen, im Formular überschreibbar
        const settings = await getShippingSettings();
        const shippingCost =
            typeof body.shippingCost === 'number' && body.shippingCost >= 0
                ? body.shippingCost
                : calculateShipping(goodsTotal, settings);

        const totalAmount = Math.round((goodsTotal + shippingCost) * 100) / 100;

        const { data: order, error: orderError } = await supabaseAdmin
            .from('orders')
            .insert([{
                customer_name: customerName,
                // Ohne E-Mail geht die Bestätigung als ausgedruckte Rechnung mit ins Paket.
                customer_email: customerEmail || null,
                stripe_session_id: null,
                total_amount: totalAmount,
                status,
                source: 'phone',
                invoice_reference: invoiceReference || null,
                notes: notes || null,
                shipping_address: body.shippingAddress ?? null,
            }])
            .select()
            .single();

        if (orderError) throw orderError;

        const { error: itemsError } = await supabaseAdmin
            .from('order_items')
            .insert(orderItems.map((i) => ({ ...i, order_id: order.id })));

        if (itemsError) {
            // Halbe Bestellung ist schlimmer als gar keine: wieder aufräumen.
            await supabaseAdmin.from('orders').delete().eq('id', order.id);
            throw itemsError;
        }

        // Lagerbestand abziehen – dieselbe Funktion wie beim Online-Kauf.
        for (const item of orderItems) {
            const { error: stockError } = await supabaseAdmin.rpc('decrement_stock', {
                p_product_id: item.product_id,
                p_quantity: item.quantity,
            });
            if (stockError) {
                console.error(`Bestand für ${item.product_id} nicht abgezogen:`, stockError);
            }
        }

        return NextResponse.json({ order });
    } catch (error: any) {
        console.error('Telefonbestellung konnte nicht angelegt werden:', error);
        return NextResponse.json(
            { error: 'Die Bestellung konnte nicht gespeichert werden. Bitte noch einmal versuchen.' },
            { status: 500 }
        );
    }
}
