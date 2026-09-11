import { createClient } from '@supabase/supabase-js';

/**
 * Supabase-Client mit Service-Role-Key.
 *
 * Umgeht RLS und darf deshalb ausschliesslich in Route Handlers und Server
 * Components verwendet werden – NIEMALS in einer Client Component, sonst
 * landet der Schlüssel im Browser.
 *
 * Bisher baute sich jede Route ihren eigenen Client (Webhook,
 * /api/admin/orders, mehrere Adminseiten). Ein gemeinsamer Ort macht sichtbar,
 * wo erhöhte Rechte im Spiel sind.
 */
export const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || '',
    { auth: { persistSession: false } }
);
