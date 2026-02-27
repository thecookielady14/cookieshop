'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock } from 'lucide-react';
import Image from 'next/image';

export default function AdminLogin() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Simulate login for dev environment if Supabase isn't really connected yet
            if (!process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL.includes('dummy')) {
                if (email === 'admin@thecookielady.de' && password === 'admin') {
                    document.cookie = "admin_auth=true; path=/";
                    router.push('/admin');
                    return;
                } else {
                    throw new Error('Ungültige Anmeldedaten (Dev-Modus: admin@thecookielady.de / admin)');
                }
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            if (data.session) {
                // Set a gentle custom cookie just for basic middleware routing checks
                document.cookie = "admin_auth=true; path=/; max-age=86400";
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
                        src="/logo_transparent.png"
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
