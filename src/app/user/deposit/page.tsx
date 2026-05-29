'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useUser, useFirestore, useCollection, useDoc, useMemoFirebase, addDocumentNonBlocking } from '@/firebase';
import { collection, query, where, orderBy, limit, doc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { RefreshCw, Wallet, History, CreditCard, Clock, CheckCircle2, AlertCircle, QrCode, X, Search } from 'lucide-react';

interface DepositHistory {
    id: string;
    amount: number;
    balanceBefore: number;
    balanceAfter: number;
    description: string | null;
    createdAt: any;
}

interface ActiveDeposit {
    id: string;
    trxId: string;
    amount: number;
    uniqueCode: number;
    totalAmount: number;
    qrImage: string | null;
    expiresAt: string;
}

export default function DepositPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    
    const [amount, setAmount] = useState('');
    const [depositLoading, setDepositLoading] = useState(false);
    const [checkLoading, setCheckLoading] = useState(false);
    const [error, setError] = useState('');
    const [activeDeposit, setActiveDeposit] = useState<ActiveDeposit | null>(null);
    const [paymentStatus, setPaymentStatus] = useState<'pending' | 'paid' | 'expired'>('pending');
    const [timeLeft, setTimeLeft] = useState(0);
    
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'business', 'settings');
    }, [firestore]);
    const { data: businessSettings } = useDoc<any>(settingsRef);

    const logsQuery = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return query(
            collection(firestore, 'users', user.uid, 'saldoLogs'),
            orderBy('createdAt', 'desc'),
            limit(20)
        );
    }, [firestore, user?.uid]);
    const { data: history, isLoading: loadingHistory } = useCollection<DepositHistory>(logsQuery);
    const activeTxRef = useMemoFirebase(() => {
        if (!firestore || !activeDeposit?.id) return null;
        return doc(firestore, 'transactions', activeDeposit.id);
    }, [firestore, activeDeposit?.id]);
    const { data: txData } = useDoc<any>(activeTxRef);

    useEffect(() => {
        if (txData?.paymentStatus === 'paid') {
            setPaymentStatus('paid');
            if (timerRef.current) clearInterval(timerRef.current);
        }
    }, [txData]);

    const handleDeposit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore) return;
        
        setDepositLoading(true);
        setError('');

        const numAmount = parseInt(amount);
        if (!numAmount || numAmount < 5000) {
            setError('Minimal deposit Rp 5.000');
            setDepositLoading(false);
            return;
        }

        const baseQrString = businessSettings?.gopayBaseQr;
        if (!baseQrString) {
            setError('Sistem pembayaran belum siap (BaseQR kosong). Silakan hubungi admin.');
            setDepositLoading(false);
            return;
        }

        try {
            const uniqueCode = Math.floor(Math.random() * 51);
            const totalAmount = numAmount + uniqueCode;
            const now = new Date();
            const expiresAtDate = new Date(now.getTime() + 15 * 60 * 1000);
            const trxId = `DEP-${Date.now()}-${Math.random().toString(36).substring(2, 5).toUpperCase()}`;
            
            const transactionData = {
                userId: user.uid,
                merchantId: 'SYSTEM_GOPAY',
                toolType: 'deposit',
                trxId,
                refId: `DEPOSIT-${user.uid.slice(0, 5)}-${Date.now()}`,
                customerName: 'Topup Saldo User',
                amount: numAmount,
                uniqueCode,
                totalAmount,
                paymentStatus: 'pending',
                createdAt: serverTimestamp(),
                expiresAt: Timestamp.fromDate(expiresAtDate),
            };

            const docRef = await addDocumentNonBlocking(collection(firestore, 'transactions'), transactionData);
            
            if (docRef) {
                setActiveDeposit({
                    id: docRef.id,
                    trxId,
                    amount: numAmount,
                    uniqueCode,
                    totalAmount,
                    qrImage: `https://quickchart.io/qr?text=${encodeURIComponent(baseQrString)}&size=300`,
                    expiresAt: expiresAtDate.toISOString(),
                });
                setPaymentStatus('pending');

                timerRef.current = setInterval(() => {
                    const diff = Math.max(0, Math.floor((expiresAtDate.getTime() - Date.now()) / 1000));
                    setTimeLeft(diff);
                    if (diff <= 0) {
                        setPaymentStatus('expired');
                        if (timerRef.current) clearInterval(timerRef.current);
                    }
                }, 1000);
            }
        } catch (err: any) {
            setError('Gagal membuat permintaan deposit. Coba lagi nanti.');
        } finally {
            setDepositLoading(false);
        }
    };

    const handleCheckStatus = async () => {
        if (!activeDeposit?.id || checkLoading) return;
        setCheckLoading(true);
        setError('');

        try {
            const res = await fetch(`/api/user/subscribe/status?id=${activeDeposit.id}`);
            const data = await res.json();
            
            if (data.status === 'success') {
                if (data.data.payment_status === 'pending') {
                    setError(data.data.message || 'Pembayaran belum terdeteksi. Silakan tunggu sebentar lagi.');
                }
            } else {
                setError(data.message || 'Gagal memeriksa status.');
            }
        } catch (err) {
            setError('Kesalahan koneksi saat memeriksa status.');
        } finally {
            setCheckLoading(false);
        }
    };

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const closeDeposit = () => {
        setActiveDeposit(null);
        setAmount('');
        if (timerRef.current) clearInterval(timerRef.current);
    };

    const formatDate = (ts: any) => {
        if (!ts) return '';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        return d.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    };

    return (
        <div className="space-y-8 animate-slide-up max-w-6xl mx-auto pb-12">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Deposit Saldo</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Isi ulang saldo untuk menggunakan layanan kami.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <RefreshCw className="w-4 h-4 text-[#619BF3]" />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Buat Deposit</h2>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs mb-6 font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </div>
                        )}

                        {!activeDeposit ? (
                            <form onSubmit={handleDeposit} className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nominal Deposit (IDR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                        <input 
                                            type="number" 
                                            value={amount}
                                            onChange={(e) => setAmount(e.target.value)}
                                            placeholder="50.000" 
                                            min="5000" 
                                            required 
                                            className="!pl-11 !rounded-xl border-slate-200 !py-4 font-black text-lg tracking-tight" 
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-2">
                                    {[10000, 25000, 50000, 100000, 250000, 500000].map((a) => (
                                        <button 
                                            key={a} 
                                            type="button"
                                            onClick={() => setAmount(a.toString())}
                                            className={`rounded-xl py-2.5 text-xs font-black transition-all border ${amount === a.toString() ? 'border-[#619BF3] text-[#619BF3] bg-blue-50' : 'border-slate-100 text-slate-400 bg-slate-50/50'}`}
                                        >
                                            {(a / 1000).toFixed(0)}K
                                        </button>
                                    ))}
                                </div>

                                <button type="submit" className="btn btn-primary w-full !rounded-xl py-4 font-black uppercase tracking-widest text-xs" disabled={depositLoading}>
                                    {depositLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Proses Deposit'}
                                </button>
                            </form>
                        ) : (
                            <div className="text-center space-y-6">
                                {paymentStatus === 'expired' ? (
                                    <div className="py-8">
                                        <Clock className="w-12 h-12 text-rose-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-slate-900">Pembayaran Kadaluarsa</h3>
                                        <button onClick={closeDeposit} className="btn btn-outline mt-6 w-full">Tutup</button>
                                    </div>
                                ) : paymentStatus === 'paid' ? (
                                    <div className="py-8">
                                        <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-4" />
                                        <h3 className="text-lg font-bold text-slate-900">Pembayaran Sukses!</h3>
                                        <p className="text-slate-500 text-sm">Saldo Anda telah ditambahkan secara otomatis.</p>
                                        <button onClick={closeDeposit} className="btn btn-primary mt-6 w-full">Selesai</button>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="relative w-64 h-[320px] mx-auto flex items-center justify-center overflow-hidden">
                                            <img 
                                                src="/img/bg-qris.png" 
                                                alt="QRIS Frame" 
                                                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                            />
                                            
                                            <div className="relative z-10 mb-4">
                                                {activeDeposit.qrImage ? (
                                                    <img 
                                                        src={activeDeposit.qrImage} 
                                                        alt="QRIS" 
                                                        className="w-44 h-44 mix-blend-darken" 
                                                    />
                                                ) : (
                                                    <div className="w-44 h-44 flex items-center justify-center">
                                                        <QrCode className="w-12 h-12 text-slate-200" />
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="bg-slate-50 border border-slate-100 rounded-xl p-5 text-sm max-w-xs mx-auto">
                                            <div className="flex justify-between items-center mb-2">
                                                <span className="text-slate-400 font-bold text-xs uppercase">Total Bayar</span>
                                                <span className="text-slate-900 font-black text-xl">Rp {activeDeposit.totalAmount.toLocaleString('id-ID')}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-xs">
                                                <span className="text-slate-400">Sisa Waktu</span>
                                                <span className="text-[#619BF3] font-mono font-black">{formatTime(timeLeft)}</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4">
                                            <div className="flex items-center justify-center gap-2 text-[#619BF3] text-[10px] font-black uppercase tracking-widest pt-2">
                                                <RefreshCw className="w-3 h-3 animate-spin" />
                                                <span>Menunggu Pembayaran</span>
                                            </div>

                                            <button 
                                                onClick={handleCheckStatus}
                                                disabled={checkLoading}
                                                className="btn btn-primary w-full !rounded-xl py-4 font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100"
                                            >
                                                {checkLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                                                Cek Status Pembayaran
                                            </button>
                                        </div>

                                        <button onClick={closeDeposit} className="text-[10px] text-slate-400 hover:text-rose-500 font-black uppercase tracking-widest flex items-center justify-center gap-1 mx-auto">
                                            <X className="w-3 h-3" /> Batalkan
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-7 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm min-h-[400px]">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                                <History className="w-4 h-4 text-emerald-500" />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Riwayat Transaksi</h2>
                        </div>

                        {loadingHistory ? (
                            <div className="flex items-center justify-center py-20">
                                <RefreshCw className="w-6 h-6 text-slate-200 animate-spin" />
                            </div>
                        ) : !history || history.length === 0 ? (
                            <div className="text-center py-20">
                                <p className="text-slate-300 text-sm font-bold uppercase tracking-widest">Belum ada riwayat</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {history.map((h) => (
                                    <div key={h.id} className="flex items-center justify-between p-5 rounded-2xl bg-white border border-slate-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="text-slate-900 text-sm font-black">
                                                    {h.amount > 0 ? '+' : ''}{h.amount.toLocaleString('id-ID')} Poin
                                                </p>
                                                <p className="text-slate-400 text-[10px] font-bold uppercase mt-0.5">{h.description || 'Deposit'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-slate-900 text-xs font-black">{h.balanceAfter.toLocaleString('id-ID')}P</p>
                                            <p className="text-slate-400 text-[9px] font-black uppercase mt-1">{formatDate(h.createdAt)}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

