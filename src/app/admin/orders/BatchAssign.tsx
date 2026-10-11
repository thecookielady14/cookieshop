'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import type { SupabaseClient } from '@supabase/supabase-js';
import { assertWritten } from '@/lib/admin-write';

export interface OpenBatch {
    id: string;
    code: string;
    variety_id: string | null;
    variety_name: string;
}

export interface AssignedBatch {
    batch_id: string;
    code: string;
}

/**
 * Beim Packen: aus welcher Backcharge stammen die Kekse dieser Sorte?
 *
 * Hängt an der Sorte der Bestellposition, nicht an der Bestellung – eine
 * Mischbox enthält mehrere Sorten und damit mehrere Chargen. Reicht eine
 * Charge nicht für alle Kekse einer Sorte, kommt eine zweite dazu.
 */
export default function BatchAssign({
    supabase,
    oivId,
    varietyId,
    varietyName,
    quantity,
    assigned,
    openBatches,
    onChange,
}: {
    supabase: SupabaseClient;
    oivId: string;
    varietyId: string | null;
    varietyName: string;
    quantity: number;
    assigned: AssignedBatch[];
    openBatches: OpenBatch[];
    onChange: (next: AssignedBatch[]) => void;
}) {
    const [busy, setBusy] = useState(false);

    // Über die ID, ersatzweise über den Namen – die Sorte kann inzwischen
    // gelöscht sein, der Name zum Bestellzeitpunkt bleibt.
    const passend = openBatches.filter((b) =>
        (varietyId ? b.variety_id === varietyId : b.variety_name === varietyName) &&
        !assigned.some((a) => a.batch_id === b.id)
    );

    const add = async (batchId: string) => {
        const batch = openBatches.find((b) => b.id === batchId);
        if (!batch) return;
        setBusy(true);
        try {
            const { data, error } = await supabase.from('order_item_variety_batches')
                .insert({ order_item_variety_id: oivId, batch_id: batchId }).select('batch_id');
            if (error) throw error;
            assertWritten(data, 'Die Chargenzuordnung');
            onChange([...assigned, { batch_id: batchId, code: batch.code }]);
        } catch (err) {
            alert('Charge nicht zugeordnet: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setBusy(false);
        }
    };

    const remove = async (batchId: string) => {
        setBusy(true);
        try {
            const { data, error } = await supabase.from('order_item_variety_batches')
                .delete().eq('order_item_variety_id', oivId).eq('batch_id', batchId).select('batch_id');
            if (error) throw error;
            assertWritten(data, 'Das Entfernen');
            onChange(assigned.filter((a) => a.batch_id !== batchId));
        } catch (err) {
            alert('Charge nicht entfernt: ' + (err instanceof Error ? err.message : String(err)));
        } finally {
            setBusy(false);
        }
    };

    return (
        <span className="flex flex-wrap items-center gap-1 text-xs mt-1">
            <span className={assigned.length === 0 ? 'text-amber-700 font-medium' : 'text-gray-600'}>
                {quantity}× {varietyName}:
            </span>
            {assigned.map((a) => (
                <span key={a.batch_id} className="inline-flex items-center gap-0.5 bg-green-100 text-green-800 font-mono font-bold pl-2 pr-0.5 py-0.5 rounded-full">
                    {a.code}
                    <button type="button" onClick={() => remove(a.batch_id)} disabled={busy}
                        aria-label={`${a.code} entfernen`} className="p-0.5 rounded-full hover:bg-black/10">
                        <X className="w-3 h-3" />
                    </button>
                </span>
            ))}
            {passend.length > 0 ? (
                <select
                    value=""
                    disabled={busy}
                    onChange={(e) => e.target.value && add(e.target.value)}
                    aria-label={`Backcharge für ${varietyName} zuordnen`}
                    className="bg-white border border-gray-200 rounded-lg px-1.5 py-0.5 outline-none focus:border-[var(--color-brand-primary)] cursor-pointer disabled:opacity-50"
                >
                    <option value="">{assigned.length === 0 ? '+ Charge' : '+ weitere'}</option>
                    {passend.map((b) => <option key={b.id} value={b.id}>{b.code}</option>)}
                </select>
            ) : assigned.length === 0 ? (
                <span className="text-gray-400 italic">keine offene Charge</span>
            ) : null}
        </span>
    );
}
