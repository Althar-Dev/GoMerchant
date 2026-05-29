
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { SiteSettingsProvider, SiteLogo } from '@/components/SiteSettingsProvider';
import { useAuth, useUser, initiateEmailSignUp } from '@/firebase';
import { RefreshCw, ArrowRight, ShieldCheck, MessageSquare, AlertCircle, Check } from 'lucide-react';

export default function RegisterPage() {
    const router = useRouter();
    const auth = useAuth();
    const { user, isUserLoading } = useUser();
    
    const [step, setLoginStep] = useState<'form' | 'otp'>('form');
    const [form, setForm] = useState({
        displayName: '',
        email: '',
        telegramId: '',
        password: '',
        confirmPassword: '',
    });
    
    const [acceptTerms, setAcceptTerms] = useState(false);
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (user && !isUserLoading) {
            router.push('/dashboard');
        }
    }, [user, isUserLoading, router]);

    useEffect(() => {
        if (step === 'otp' && inputRef.current) {
            inputRef.current.focus();
        }
    }, [step]);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        if (!acceptTerms) {
            setError('Anda harus menyetujui Ketentuan Layanan & Kebijakan Privasi.');
            setLoading(false);
            return;
        }

        if (form.password !== form.confirmPassword) {
            setError('Konfirmasi password tidak cocok');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: form.displayName,
                    email: form.email,
                    telegramId: form.telegramId,
                    password: form.password,
                    confirmPassword: form.confirmPassword
                })
            });
            const data = await res.json();

            if (data.status === 'success') {
                setLoginStep('otp');
            } else {
                setError(data.message || 'Gagal mengirim OTP');
            }
        } catch (err) {
            setError('Kesalahan jaringan. Coba lagi.');
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyAndSignUp = async (e: React.FormEvent) => {
        e.preventDefault();
        if (otp.length < 6) return;
        
        setLoading(true);
        setError('');

        try {
            const res = await fetch('/api/auth/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.email,
                    otp: otp,
                    username: form.displayName,
                    telegramId: form.telegramId,
                    hashedPassword: 'verified'
                })
            });
            const data = await res.json();

            if (data.status === 'success') {
                const profileData = {
                    displayName: form.displayName.trim(),
                    telegramId: form.telegramId.trim(),
                    timestamp: Date.now()
                };
                localStorage.setItem('pending_registration_data', JSON.stringify(profileData));
                initiateEmailSignUp(auth, form.email, form.password, form.displayName.trim());
            } else {
                setError(data.message || 'Kode OTP tidak valid');
                setLoading(false);
            }
        } catch (err) {
            setError('Gagal verifikasi. Silakan coba lagi.');
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
            <div className="min-h-screen flex items-center justify-center px-4 py-12 relative overflow-hidden bg-[#f8fafc]">
                {/* Decoration Background */}
                <div className="fixed inset-0 pointer-events-none">
                    <div className="absolute top-[-10%] left-[-5%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[120px]" />
                    <div className="absolute bottom-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
                </div>

                <div className="w-full max-w-md relative z-10 animate-slide-up">
                    <div className="text-center mb-8">
                        <Link href="/" className="inline-flex items-center gap-2 mb-6 hover:opacity-80 transition-opacity">
                            <SiteLogo size="lg" />
                        </Link>
                        <h1 className="text-3xl font-black text-slate-900 uppercase tracking-tight">
                            {step === 'form' ? 'Daftar Akun' : 'Verifikasi Akun'}
                        </h1>
                        <p className="text-slate-500 text-sm font-medium mt-2">
                            {step === 'form' ? 'Mulai integrasi pembayaran Anda hari ini' : 'Kami telah mengirimkan kode ke Telegram Anda, Pastikan anda sudah berinteraksi dengan @GomerchPay_bot agar bisa mendapatkan kode verifikasi'}
                        </p>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-3xl p-8 md:p-10 shadow-2xl shadow-slate-200/50 relative overflow-hidden">
                        {/* Status Step Indicator */}
                        <div className="flex items-center justify-center gap-2 mb-8">
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'form' ? 'w-8 bg-[#619BF3]' : 'w-4 bg-slate-100'}`} />
                            <div className={`h-1.5 rounded-full transition-all duration-500 ${step === 'otp' ? 'w-8 bg-[#619BF3]' : 'w-4 bg-slate-100'}`} />
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl text-xs mb-6 font-bold flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </div>
                        )}

                        {step === 'form' ? (
                            <form onSubmit={handleRequestOtp} className="space-y-5">
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Nama Lengkap</label>
                                        <input
                                            type="text"
                                            value={form.displayName}
                                            onChange={(e) => setForm({ ...form, displayName: e.target.value })}
                                            placeholder="Masukkan Nama Lengkap"
                                            required
                                            disabled={loading}
                                            className="!rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-50 font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Email Aktif</label>
                                        <input
                                            type="email"
                                            value={form.email}
                                            onChange={(e) => setForm({ ...form, email: e.target.value })}
                                            placeholder="nama@example.com"
                                            required
                                            disabled={loading}
                                            className="!rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-50 font-bold"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Telegram ID (Numerik)</label>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={form.telegramId}
                                                onChange={(e) => setForm({ ...form, telegramId: e.target.value.replace(/\D/g, '') })}
                                                placeholder="e.g 12345..."
                                                required
                                                disabled={loading}
                                                className="!rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-50 font-mono font-bold"
                                            />
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2">
                                                <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center">
                                                    <ShieldCheck className="w-3 h-3 text-[#619BF3]" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Password</label>
                                            <input
                                                type="password"
                                                value={form.password}
                                                onChange={(e) => setForm({ ...form, password: e.target.value })}
                                                placeholder="••••••••"
                                                required
                                                disabled={loading}
                                                className="!rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-50 font-bold"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 ml-1">Konfirmasi</label>
                                            <input
                                                type="password"
                                                value={form.confirmPassword}
                                                onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
                                                placeholder="••••••••"
                                                required
                                                disabled={loading}
                                                className="!rounded-2xl border-slate-200 focus:ring-4 focus:ring-blue-50 font-bold"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-start gap-3 py-2 px-1">
                                    <input 
                                        type="checkbox" 
                                        id="terms" 
                                        checked={acceptTerms}
                                        onChange={(e) => setAcceptTerms(e.target.checked)}
                                        className="mt-1 w-4 h-4 rounded border-slate-300 text-[#619BF3] focus:ring-[#619BF3] cursor-pointer"
                                    />
                                    <label htmlFor="terms" className="text-[11px] text-slate-500 font-medium leading-relaxed cursor-pointer">
                                        Saya menyetujui <Link href="/terms" className="text-[#619BF3] font-bold hover:underline">Ketentuan Layanan</Link> serta <Link href="/privacy" className="text-[#619BF3] font-bold hover:underline">Kebijakan Privasi</Link> yang berlaku di GomerchPay.
                                    </label>
                                </div>

                                <button 
                                    type="submit" 
                                    className={`btn btn-primary w-full py-5 mt-4 font-black uppercase tracking-widest text-[11px] !rounded-2xl shadow-xl shadow-blue-100 group ${!acceptTerms ? 'opacity-50 cursor-not-allowed' : ''}`} 
                                    disabled={loading || !acceptTerms}
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : (
                                        <>Daftar Sekarang<ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" /></>
                                    )}
                                </button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyAndSignUp} className="space-y-10 text-center">
                                <div className="space-y-6">
                                    <div className="w-16 h-16 bg-blue-50 rounded-3xl flex items-center justify-center mx-auto rotate-3 shadow-inner">
                                        <MessageSquare className="w-8 h-8 text-[#619BF3]" />
                                    </div>
                                    
                                    <div className="space-y-1">
                                        <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">Verification Code</p>
                                        <p className="text-[11px] text-slate-400">Masukkan 6 digit kode yang dikirim ke ID <b>{form.telegramId}</b></p>
                                    </div>
                                    
                                    <div className="relative flex justify-center gap-2 md:gap-3 py-4" onClick={() => inputRef.current?.focus()}>
                                        {/* Visual Boxes */}
                                        {[...Array(6)].map((_, i) => {
                                            const digit = otp[i];
                                            const isActive = otp.length === i;
                                            const isFilled = i < otp.length;
                                            
                                            return (
                                                <div 
                                                    key={i}
                                                    className={`w-10 h-14 md:w-12 md:h-16 flex items-center justify-center rounded-2xl border-2 transition-all duration-200 
                                                    ${isActive ? 'border-[#619BF3] bg-blue-50/30 ring-4 ring-blue-50 scale-105' : 
                                                      isFilled ? 'border-slate-300 bg-white' : 'border-slate-100 bg-slate-50/50'}`}
                                                >
                                                    {isFilled ? (
                                                        <span className="text-2xl md:text-3xl font-black text-slate-900 animate-in zoom-in-75 duration-200">
                                                            {digit}
                                                        </span>
                                                    ) : (
                                                        <div className={`w-2 h-2 rounded-full transition-colors ${isActive ? 'bg-[#619BF3]' : 'bg-slate-200'}`} />
                                                    )}
                                                </div>
                                            );
                                        })}

                                        {/* Hidden Input */}
                                        <input
                                            ref={inputRef}
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            value={otp}
                                            onChange={(e) => {
                                                const val = e.target.value.replace(/\D/g, '').slice(0, 6);
                                                setOtp(val);
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-default"
                                            maxLength={6}
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <button 
                                        type="submit" 
                                        className="btn btn-primary w-full py-5 !rounded-2xl font-black uppercase tracking-widest text-[11px] shadow-xl shadow-blue-100 disabled:opacity-50" 
                                        disabled={loading || otp.length < 6}
                                    >
                                        {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <><Check className="w-4 h-4 mr-2" /> Verifikasi</>}
                                    </button>
                                    
                                    <button 
                                        type="button" 
                                        onClick={() => { setLoginStep('form'); setOtp(''); }} 
                                        className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:text-slate-900 transition-colors"
                                    >
                                        Ganti Telegram ID
                                    </button>
                                </div>
                            </form>
                        )}

                        <div className="mt-10 text-center pt-8 border-t border-slate-50">
                            <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Sudah punya akun? </span>
                            <Link href="/signin" className="text-[#619BF3] hover:text-[#4a86e8] text-[10px] font-black uppercase tracking-widest ml-1 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors">
                                Masuk Disini
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </SiteSettingsProvider>
    );
}


