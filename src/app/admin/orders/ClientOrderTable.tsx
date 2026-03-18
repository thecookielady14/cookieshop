'use client';

import { supabase } from "@/lib/supabase";
import { format } from "date-fns";
import { de } from "date-fns/locale";
import { useState } from "react";
import { CheckCircle, Truck, Package, Clock } from "lucide-react";

export default function ClientOrderTable({ initialOrders }: { initialOrders: any[] }) {
    const [orders, setOrders] = useState(initialOrders);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const handleStatusChange = async (orderId: string, newStatus: string) => {
        setUpdatingId(orderId);
        try {
            const { error } = await supabase
                .from('orders')
                .update({ status: newStatus })
                .eq('id', orderId);

            if (error) throw error;

            // Optimistically update local state
            setOrders(orders.map(order =>
                order.id === orderId ? { ...order, status: newStatus } : order
            ));

            // Send shipping notification email automatically
            if (newStatus === 'shipped') {
                const res = await fetch('/api/notify-shipped', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
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
                    <th className="p-4 font-semibold text-gray-500">Datum</th>
                    <th className="p-4 font-semibold text-gray-500">Status</th>
                    <th className="p-4 font-semibold text-gray-500 text-right">Aktionen</th>
                </tr>
            </thead>
            <tbody>
                {orders.map((order: any) => {
                    const totalItems = order.order_items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0;
                    return (
                        <tr key={order.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                            <td className="p-4">
                                <span className="font-bold text-gray-900 block">#{order.order_number || order.id.substring(0, 8)}</span>
                                <span className="text-xs text-gray-500">{totalItems} Artikel • {new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR' }).format(order.total_amount)}</span>
                            </td>
                            <td className="p-4">
                                <span className="font-medium text-gray-900 block">{order.customer_email}</span>
                                {order.shipping_address && (
                                    <span className="text-xs text-gray-500 block truncate max-w-[200px]" title={`${order.shipping_address.line1}, ${order.shipping_address.city}`}>
                                        {order.shipping_address.name || order.customer_email} • {order.shipping_address.city}
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
