'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createBrowserClient } from '@supabase/ssr';
import { Lock } from 'lucide-react';
import Image from 'next/image';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    // Die Middleware leitet mit ?error=no-access hierher um, wenn jemand
    // angemeldet ist, aber kein Adminkonto verwendet.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('error') === 'no-access') {
            setError('Dieses Konto hat keinen Zugriff auf den Adminbereich.');
        }
    }, []);

    // createBrowserClient from @supabase/ssr stores the session in cookies
    // so the middleware can verify the JWT on every request
    const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                router.push('/admin');
                router.refresh();
            }
        } catch (err: any) {
            setError(err.message || 'Ein Fehler ist aufgetreten.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[var(--color-brand-bg)] flex items-center justify-center p-6">
            <div className="bg-white p-8 lg:p-12 rounded-3xl shadow-xl w-full max-w-md border border-neutral-100">

                <div className="flex flex-col items-center mb-8">
                    <Image
                        src="/logo.jpeg"
                        alt="The Cookie Lady Logo"
                        width={80}
                        height={80}
                        className="shadow-md mb-4 bg-[var(--color-brand-primary)] rounded-full"
                    />
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Lock className="w-5 h-5 text-[var(--color-brand-primary)]" />
                        Admin Login
                    </h1>
                    <p className="text-neutral-500 text-sm mt-2 text-center">
                        Hier kommst du in deine Backstube.
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-6 border border-red-200 text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">E-Mail</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-neutral-700 mb-1">Passwort</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-neutral-300 focus:border-[var(--color-brand-primary)] focus:ring-1 focus:ring-[var(--color-brand-primary)] outline-none transition-all"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[var(--color-brand-text)] text-white font-bold py-3 rounded-xl hover:bg-neutral-800 transition-colors disabled:opacity-70"
                    >
                        {loading ? 'Lade...' : 'Einloggen'}
                    </button>
                </form>
            </div>
        </div>
    );
}
