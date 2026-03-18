import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function GET() {
    try {
        const { error } = await supabase.rpc('exec_sql', {
            sql_string: 'ALTER TABLE public.products ADD COLUMN IF NOT EXISTS consumer_info TEXT;'
        });

        if (error) {
            // Function might not exist, fallback to running raw SQL if possible or direct insert test
            return NextResponse.json({ error: error.message, details: error }, { status: 500 });
        }

        return NextResponse.json({ success: true, message: 'Column added successfully' });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
