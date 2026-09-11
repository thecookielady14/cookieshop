'use client';

import { createBrowserClient } from "@supabase/ssr";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useState } from "react";
import { CheckCircle, Truck, Package, Clock, Phone, Copy, Check, AlertTriangle, ExternalLink } from "lucide-react";
import { addressLines, addressText, isDeliverable } from "@/lib/address";

export default function ClientOrderTable({ initialOrders }: { initialOrders: any[] }) {
    /**
     * Bewusst createBrowserClient aus @supabase/ssr, nicht der einfache Client.
     * Die Anmeldeseite legt die Sitzung in Cookies ab; der einfache Client sucht
     * sie im localStorage und findet dort nichts. Folge war: Änderungen liefen
     * ohne Sitzung und damit an der RLS vorbei ins Leere – PostgREST antwortet
     * darauf mit 200 und null Zeilen, also ohne Fehler. Der Status sah im
     * Browser geändert aus und war es in der Datenbank nie.
     */
    const [supabase] = useState(() =>
        createBrowserClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
        )
    );
    const [orders, setOrders] = useState(initialOrders);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    /** Welche Adresse gerade kopiert wurde – nur für die kurze Rückmeldung. */
    const [copiedId, setCopiedId] = useState<string | null>(null);

    const handleCopyAddress = async (orderId: string, text: string) => {
        try {
            await navigator.clipboard.writeText(text);
            setCopiedId(orderId);
            setTimeout(() => setCopiedId((id) => (id === orderId ? null : id)), 2000);
        } catch {
            // Ohne Zwischenablage (altes Browserfenster, kein HTTPS) bleibt die
            // Adresse trotzdem lesbar – sie steht ja vollständig daneben.
            alert('Kopieren hat nicht geklappt. Die Adresse steht vollständig in der Spalte.');
        }
    };

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            // .select() zurückfordern und prüfen, dass wirklich eine Zeile
            // geändert wurde. Ohne das bleibt ein wirkungsloser Schreibversuch
            // unbemerkt, und die Anzeige behauptet etwas Falsches.
            const { data, error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId)
                .select('id');

            if (error) throw error;
            if (!data || data.length === 0) {
                throw new Error(
                    'Die Änderung wurde nicht gespeichert – vermutlich ist die Anmeldung abgelaufen. ' +
                    'Bitte die Seite neu laden und erneut anmelden.'
                );
            }

            // Optimistically update local state
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

            // Versandbenachrichtigung nur, wenn eine E-Mail vorliegt. Bei
            // Telefonbestellungen liegt die Rechnung oft ausgedruckt im Paket.
            const order = orders.find(o => o.id === orderId);
            if (newStatus === 'shipped' && !order?.customer_email) {
                alert('✅ Status aktualisiert. Es ist keine E-Mail hinterlegt, daher wurde keine Versandbenachrichtigung verschickt.');
            } else if (newStatus === 'shipped') {
                const { data: { session } } = await supabase.auth.getSession();
                const res = await fetch('/api/notify-shipped', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session?.access_token ?? ''}`,
                    },
                    body: JSON.stringify({ orderId }),
                });
                if (res.ok) {
                    alert('✅ Status aktualisiert & Versand-Email an Kunden gesendet!');
                } else {
                    alert('✅ Status aktualisiert – aber Email konnte nicht gesendet werden (RESEND_API_KEY prüfen).');
                }
            }
        } catch (error: any) {
            alert('Fehler beim Aktualisieren des Status: ' + error.message);
        } finally {
            setUpdatingId(null);
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
            case 'processing': return <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Package className="w-3 h-3"/> In Bearbeitung</span>;
            case 'shipped': return <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Truck className="w-3 h-3"/> Versendet</span>;
            case 'delivered': return <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><CheckCircle className="w-3 h-3"/> Zugestellt</span>;
            case 'pending': return <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 w-max"><Clock className="w-3 h-3"/> Unbezahlt</span>;
            default: return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-xs font-bold">{status}</span>;
        }
    }

    if (orders.length === 0) {
        return (
            <div className="p-12 text-center text-gray-500">
                Noch keine Bestellungen eingegangen.
            </div>
        );
    }

    return (
        <table className="w-full text-left border-collapse">
            <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="p-4 font-semibold text-gray-500">Bestellung</th>
                    <th className="p-4 font-semibold text-gray-500">Kunde</th>
                    <th className="p-4 font-semibold text-gray-500">Lieferadresse</th>
                    <th className="p-4 font-semibold text-gray-500">Datum</th>
                    <th className="p-4 font-semibold text-gray-500">Status</th>
                    <th className="p-4 font-semibold text-gray-500 text-right">Aktionen</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((order: any) => {
                    const totalItems = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                    const zeilen = addressLines(order.shipping_address);
                    const versandfertig = isDeliverable(order.shipping_address);
                    return (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="p-4 align-top">
                                <span className="font-bold text-gray-900 block">#{order.order_number || order.id.substring(0, 8)}</span>
                                <span className="text-xs text-gray-500">{totalItems} Artikel • {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(order.total_amount)}</span>
                                {/* Rechnungsnummer: eigener Zähler, deshalb nie
                                    gleich der Bestellnummer. Ohne sie lässt sich
                                    eine Rückfrage zu „SHOP-0007" nicht zuordnen. */}
                                {order.invoice_reference && (
                                    <span className="text-xs text-gray-500 block mt-0.5">
                                        Rechnung{' '}
                                        {order.invoice_url ? (
                                            <a
                                                href={order.invoice_url}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="font-medium text-[var(--color-brand-primary)] hover:underline inline-flex items-center gap-1"
                                            >
                                                {order.invoice_reference}
                                                <ExternalLink className="w-3 h-3" />
                                            </a>
                                        ) : (
                                            <span className="font-medium text-gray-700">{order.invoice_reference}</span>
                                        )}
                                    </span>
                                )}
                                {/* Beim Packen muss sichtbar sein, was in den Karton kommt. */}
                                {(order.order_items ?? []).map((item: any, i: number) => (
                                    <span key={i} className="block text-xs text-gray-600 mt-1">
                                        {item.quantity}× {item.products?.name ?? 'Artikel'}
                                        {(item.order_item_varieties ?? []).length > 0 && (
                                            <span className="text-gray-400">
                                                {' – '}
                                                {item.order_item_varieties
                                                    .map((v: any) => `${v.quantity}× ${v.variety_name}`)
                                                    .join(', ')}
                                            </span>
                                        )}
                                    </span>
                                ))}
                            </td>
                            <td className="p-4">
                                <span className="font-medium text-gray-900 block">
                                    {order.customer_name || order.customer_email || 'Ohne Namen'}
                                </span>
                                {order.source === 'phone' && (
                                    <span className="inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[11px] font-bold my-1">
                                        <Phone className="w-3 h-3" /> Telefon
                                    </span>
                                )}
                                {order.customer_email
                                    ? <span className="text-xs text-gray-500 block">{order.customer_email}</span>
                                    : <span className="text-xs text-gray-400 block italic">keine E-Mail hinterlegt</span>}
                            </td>
                            {/* Eigene Spalte: beim Packen wird die vollständige
                                Adresse gebraucht, nicht nur der Ort. */}
                            <td className="p-4 align-top">
                                {zeilen.length > 0 ? (
                                    <div className="flex items-start gap-2">
                                        <address className="not-italic text-sm text-gray-700 leading-snug">
                                            {zeilen.map((zeile: string, i: number) => (
                                                <span key={i} className="block">{zeile}</span>
                                            ))}
                                        </address>
                                        <button
                                            type="button"
                                            onClick={() => handleCopyAddress(order.id, addressText(order.shipping_address))}
                                            title="Adresse kopieren"
                                            aria-label={`Lieferadresse der Bestellung ${order.order_number ?? ''} kopieren`}
                                            className="p-1.5 rounded-lg border border-gray-200 text-gray-400 hover:text-gray-700 hover:bg-white transition-colors flex-shrink-0"
                                        >
                                            {copiedId === order.id
                                                ? <Check className="w-4 h-4 text-green-600" />
                                                : <Copy className="w-4 h-4" />}
                                        </button>
                                    </div>
                                ) : (
                                    <span className="text-xs text-gray-400 italic">keine Adresse hinterlegt</span>
                                )}
                                {zeilen.length > 0 && !versandfertig && (
                                    <span className="mt-2 inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full text-[11px] font-bold">
                                        <AlertTriangle className="w-3 h-3" /> unvollständig
                                    </span>
                                )}
                            </td>
                            <td className="p-4 text-gray-600">
                                {format(new Date(order.created_at), 'dd.MM., HH:mm', { locale: de })}
                            </td>
                            <td className="p-4">
                                {getStatusBadge(order.status)}
                            </td>
                            <td className="p-4 text-right">
                                <div className="flex justify-end gap-2">
                                    <select 
                                        value={order.status}
                                        disabled={updatingId === order.id}
                                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                                        className="text-sm bg-white border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[var(--color-brand-primary)] cursor-pointer disabled:opacity-50"
                                    >
                                        <option value="pending">Unbezahlt</option>
                                        <option value="paid">Bezahlt / Bearbeitung</option>
                                        <option value="shipped">Versendet</option>
                                        <option value="delivered">Zugestellt</option>
                                        <option value="cancelled">Storniert</option>
                                    </select>
                                </div>
                            </td>
                        </tr>
                    );
                })}
            </tbody>
        </table>
    );
}
