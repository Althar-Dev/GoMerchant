'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SiteSettingsProvider, SiteLogo } from '@/components/SiteSettingsProvider';
import { useAuth, useUser } from '@/firebase';
import { initiateEmailSignIn } from '@/firebase/non-blocking-login';
import { RefreshCw } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (user && !isUserLoading) {
            router.push('/dashboard');
        }
    }, [user, isUserLoading, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            initiateEmailSignIn(auth, form.email, form.password);
        } catch (err: any) {
            setError(err.message || 'Gagal masuk. Periksa kembali email dan password Anda.');
            setLoading(false);
        }
    };

    if (isUserLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" />
            </div>
        );
    }

    return (
        <SiteSettingsProvider>
            <div className="min-h-screen flex items-center justify-center px-4 relative overflow-hidden bg-slate-50">
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-200px] right-[-200px] w-[500px] h-[500px] bg-[#619BF3] rounded-full opacity-[0.03] blur-[100px]" />
                    <div className="absolute bottom-[-200px] left-[-200px] w-[500px] h-[500px] bg-[#3BDAFA] rounded-full opacity-[0.03] blur-[100px]" />
                </div>

                <div className="w-full max-w-md relative z-10 animate-slide-up">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-4">
                            <SiteLogo size="lg" />
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Selamat Datang</h1>
                        <p className="text-slate-500 text-sm font-medium">Masuk ke akun GomerchPay Anda</p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xl">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {error && (
                                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-sm mb-4 font-bold">
                                    {error}
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    placeholder="nama@email.com"
                                    required
                                    className="border-slate-200"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                                    placeholder="••••••••"
                                    required
                                    className="border-slate-200"
                                />
                            </div>

                            <button type="submit" className="btn btn-primary w-full py-3 font-bold" disabled={loading}>
                                {loading ? <RefreshCw className="w-5 h-5 animate-spin" /> : 'Masuk'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <span className="text-slate-400 text-sm font-medium">Belum punya akun? </span>
                            <Link href="/signup" className="text-[#619BF3] hover:text-[#4a86e8] text-sm font-bold transition">
                                Daftar Sekarang
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </SiteSettingsProvider>
    );
}
