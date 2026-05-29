'use client';

import { useEffect, useState, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { 
    RefreshCw, 
    CheckCircle2, 
    AlertCircle, 
    ShieldCheck, 
    ArrowRight,
    Loader2,
    ShieldAlert
} from 'lucide-react';
import Link from 'next/link';

export default function PaymentVerificationPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const trxId = searchParams.get('ref');
    
    const [status, setStatus] = useState<'verifying' | 'success' | 'already_paid' | 'error'>('verifying');
    const [message, setMessage] = useState('Sedang memverifikasi transaksi Anda...');
    const verificationTriggered = useRef(false);

    useEffect(() => {
        if (!trxId && !verificationTriggered.current) {
            router.replace('/dashboard');
            return;
        }

        if (trxId && !verificationTriggered.current) {
            verificationTriggered.current = true;
            verifyPayment();
        }
    }, [trxId, router]);

    const verifyPayment = async () => {
        try {
            const res = await fetch('/api/user/subscribe/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ trxId })
            });
            const data = await res.json();

            if (data.status === 'success') {
                setStatus('success');
                setMessage(data.message);
            } else if (data.status === 'already_paid') {
                setStatus('already_paid');
                setMessage(data.message);
            } else {
                setStatus('error');
                setMessage(data.message || 'Gagal memverifikasi pembayaran. Harap pastikan Anda telah menyelesaikan transfer.');
            }
        } catch (err) {
            setStatus('error');
            setMessage('Terjadi kesalahan koneksi saat memproses verifikasi.');
        }
    };

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center">
            <div className="max-w-md w-full bg-white border border-slate-200 rounded-3xl p-10 shadow-2xl shadow-slate-200/50 animate-slide-up">
                {status === 'verifying' && (
                    <div className="space-y-6">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                            <Loader2 className="w-10 h-10 text-[#619BF3] animate-spin" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verifikasi Pembayaran</h1>
                            <p className="text-slate-500 text-sm font-medium leading-relaxed">{message}</p>
                        </div>
                    </div>
                )}

                {status === 'success' && (
                    <div className="space-y-8">
                        <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                            <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Aktivasi Berhasil!</h1>
                            <p className="text-slate-500 text-sm font-medium px-4">{message}</p>
                        </div>
                        <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 flex gap-3 text-left">
                            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                            <p className="text-[10px] text-emerald-700 font-bold uppercase leading-relaxed">
                                Transaksi Anda telah divalidasi. Paket Anda kini telah aktif dan siap digunakan sepenuhnya.
                            </p>
                        </div>
                        <Link href="/dashboard" className="btn btn-primary w-full py-4 !rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100">
                            Masuk ke Dashboard <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                    </div>
                )}

                {status === 'already_paid' && (
                    <div className="space-y-8">
                        <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto">
                            <ShieldAlert className="w-10 h-10 text-[#619BF3]" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Transaksi Sudah Diproses</h1>
                            <p className="text-slate-500 text-sm font-medium px-4">{message}</p>
                        </div>
                        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                            <p className="text-[10px] text-blue-700 font-bold uppercase leading-relaxed text-center">
                                Anda sudah melakukan klaim paket ini sebelumnya. Tidak ada perubahan yang dilakukan.
                            </p>
                        </div>
                        <Link href="/dashboard" className="btn btn-primary w-full py-4 !rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100">
                            Kembali ke Dashboard
                        </Link>
                    </div>
                )}

                {status === 'error' && (
                    <div className="space-y-8">
                        <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="w-10 h-10 text-rose-500" />
                        </div>
                        <div className="space-y-2">
                            <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Verifikasi Gagal</h1>
                            <p className="text-slate-500 text-sm font-medium px-4 leading-relaxed">{message}</p>
                        </div>
                        <div className="flex flex-col gap-3">
                            <button onClick={verifyPayment} className="btn btn-primary w-full py-4 !rounded-2xl font-black uppercase tracking-widest text-xs">
                                <RefreshCw className="w-4 h-4 mr-2" /> Coba Verifikasi Ulang
                            </button>
                            <Link href="/subscribe" className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                Kembali ke Halaman Paket
                            </Link>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
