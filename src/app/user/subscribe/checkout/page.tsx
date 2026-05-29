'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { 
    RefreshCw, 
    ArrowLeft, 
    CheckCircle2, 
    Zap,
    AlertCircle,
    ShieldCheck,
    CreditCard,
    QrCode,
    Clock,
    X,
    Search
} from 'lucide-react';

interface CheckoutData {
    trxId: string;
    totalAmount: number;
    uniqueCode: number;
    qrString: string;
    expiresAt: string;
}

export default function SubscriptionCheckoutPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useUser();
    const firestore = useFirestore();
    const planId = searchParams.get('id');

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [checkLoading, setCheckLoading] = useState(false);
    const [error, setError] = useState('');
    const [checkoutData, setCheckoutData] = useState<CheckoutData | null>(null);
    const [timeLeft, setTimeLeft] = useState(0);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const planRef = useMemoFirebase(() => {
        if (!firestore || !planId) return null;
        return doc(firestore, 'plans', planId);
    }, [firestore, planId]);
    const { data: plan } = useDoc<any>(planRef);

    useEffect(() => {
        if (!planId) {
            router.replace('/subscribe');
            return;
        }
        if (plan) setLoading(false);
    }, [planId, plan, router]);

    const handleCreateInvoice = async () => {
        if (!user || !plan) return;
        setActionLoading(true);
        setError('');

        try {
            const res = await fetch('/api/user/subscribe/payment', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ planId: plan.id, userId: user.uid })
            });
            const data = await res.json();

            if (data.status === 'success') {
                if (plan.price === 0) {
                    router.push('/dashboard');
                    return;
                }
                setCheckoutData(data.data);
                startTimer(new Date(data.data.expiresAt));
            } else {
                setError(data.message || 'Gagal membuat invoice pembayaran.');
            }
        } catch (err) {
            setError('Terjadi kesalahan saat menghubungi server.');
        } finally {
            setActionLoading(false);
        }
    };

    const startTimer = (expiry: Date) => {
        if (timerRef.current) clearInterval(timerRef.current);
        
        timerRef.current = setInterval(() => {
            const diff = Math.max(0, Math.floor((expiry.getTime() - Date.now()) / 1000));
            setTimeLeft(diff);
            if (diff <= 0) {
                setPaymentStatus('expired');
                if (timerRef.current) clearInterval(timerRef.current);
            }
        }, 1000);
    };

    const handleCheckStatus = async () => {
        if (!checkoutData?.trxId || checkLoading) return;
        setCheckLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/user/subscribe/status?id=${checkoutData.trxId}`);
            const data = await res.json();
            
            if (data.status === 'success') {
                if (data.data.payment_status === 'paid') {
                    setPaymentStatus('paid');
                    if (timerRef.current) clearInterval(timerRef.current);
                } else {
                    setError('Pembayaran belum terdeteksi. Pastikan Anda mentransfer Rp ' + checkoutData.totalAmount.toLocaleString('id-ID') + ' (termasuk kode unik).');
                }
            } else {
                setError(data.message || 'Gagal memeriksa status pembayaran.');
            }
        } catch (err) {
            setError('Kesalahan koneksi saat verifikasi.');
        } finally {
            setCheckLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#f8fafc]"><RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" /></div>;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-slide-up pb-20 px-4 pt-10">
            <button 
                onClick={() => router.push('/subscribe')} 
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-sm font-medium group"
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Batal & Kembali</span>
            </button>

            <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
                {!checkoutData ? (
                    <div className="p-8 md:p-12 space-y-10">
                        <div className="text-center space-y-4">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-[#619BF3]">
                                <CreditCard className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Konfirmasi Paket</h1>
                                <p className="text-slate-500 text-sm font-medium">Anda akan berlangganan paket <b>{plan?.name}</b></p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-5 py-4 rounded-2xl text-xs font-bold flex items-center gap-3 animate-slide-up">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </div>
                        )}

                        <div className="bg-slate-50 rounded-2xl p-8 space-y-6 border border-slate-100">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Durasi Aktif</span>
                                <span className="text-sm font-bold text-slate-700">{plan?.durationDays} Hari</span>
                            </div>
                            <div className="flex justify-between items-center pt-6 border-t border-slate-200">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Harga Paket</span>
                                <span className="text-xl font-black text-slate-900">Rp {plan?.price?.toLocaleString('id-ID')}</span>
                            </div>
                        </div>

                        <button 
                            onClick={handleCreateInvoice}
                            disabled={actionLoading}
                            className="btn btn-primary w-full py-5 !rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100"
                        >
                            {actionLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : 'Lanjutkan ke Pembayaran'}
                        </button>
                    </div>
                ) : (
                    <div className="p-8 md:p-12 text-center">
                        {paymentStatus === 'paid' ? (
                            <div className="space-y-8 animate-slide-up">
                                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mx-auto border-4 border-white shadow-lg">
                                    <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                                </div>
                                <div>
                                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Pembayaran Sukses!</h1>
                                    <p className="text-slate-500 text-sm font-medium mt-2">Paket Anda telah aktif secara otomatis.</p>
                                </div>
                                <button onClick={() => router.push('/dashboard')} className="btn btn-primary w-full py-4 !rounded-2xl font-black uppercase tracking-widest text-xs">Ke Dashboard Sekarang</button>
                            </div>
                        ) : paymentStatus === 'expired' ? (
                            <div className="space-y-8">
                                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                                    <X className="w-10 h-10 text-rose-500" />
                                </div>
                                <h1 className="text-xl font-black text-slate-900 uppercase tracking-tight">Invoice Kadaluarsa</h1>
                                <p className="text-slate-500 text-sm">Waktu pembayaran telah habis. Silakan buat invoice baru.</p>
                                <button onClick={() => setCheckoutData(null)} className="btn btn-outline w-full py-4 !rounded-xl font-bold uppercase tracking-widest text-xs">Buat Ulang</button>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                <div>
                                    <h2 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-1">Total Pembayaran</h2>
                                    <h1 className="text-4xl font-black text-slate-900 tracking-tighter">Rp {checkoutData.totalAmount.toLocaleString('id-ID')}</h1>
                                    <p className="text-[10px] text-emerald-600 font-bold uppercase mt-2">Termasuk kode unik: +{checkoutData.uniqueCode}</p>
                                </div>

                                <div className="relative w-64 h-[320px] mx-auto flex items-center justify-center overflow-hidden">
                                    <img src="/img/bg-qris.png" alt="Frame" className="absolute inset-0 w-full h-full object-contain pointer-events-none" />
                                    <div className="relative z-10 mb-4">
                                        <img src={`https://quickchart.io/qr?text=${encodeURIComponent(checkoutData.qrString)}&size=300`} alt="QRIS" className="w-44 h-44 mix-blend-darken" />
                                    </div>
                                </div>

                                <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 space-y-2 max-w-xs mx-auto">
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                        <span>Sisa Waktu</span>
                                        <span className="text-[#619BF3] font-mono">{formatTime(timeLeft)}</span>
                                    </div>
                                    <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase">
                                        <span>Status</span>
                                        <span className="text-amber-500 animate-pulse">Menunggu Transfer</span>
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-rose-50 text-rose-600 px-5 py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2">
                                        <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                                    </div>
                                )}

                                <div className="space-y-4">
                                    <button 
                                        onClick={handleCheckStatus}
                                        disabled={checkLoading}
                                        className="btn btn-primary w-full py-5 !rounded-2xl font-black uppercase tracking-widest text-sm shadow-xl shadow-blue-100"
                                    >
                                        {checkLoading ? <RefreshCw className="w-5 h-5 animate-spin mr-2" /> : <Search className="w-5 h-5 mr-2" />}
                                        Saya Sudah Bayar
                                    </button>
                                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">
                                        Transfer tepat <b>Rp {checkoutData.totalAmount.toLocaleString('id-ID')}</b> agar sistem dapat mendeteksi pembayaran Anda secara otomatis.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                <div className="bg-slate-900 px-8 py-5 flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">GomerchPay Payment</span>
                    <div className="flex gap-1.5">
                        <div className="w-1 h-1 rounded-full bg-[#619BF3]" />
                        <div className="w-1 h-1 rounded-full bg-[#3BDAFA]" />
                    </div>
                </div>
            </div>
        </div>
    );
}


