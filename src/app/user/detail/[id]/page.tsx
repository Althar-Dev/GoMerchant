'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';
import { 
    RefreshCw, 
    ArrowLeft, 
    CheckCircle2, 
    AlertCircle,
    Copy,
    ChevronRight
} from 'lucide-react';

interface Transaction {
    trxId: string;
    refId: string;
    customerName: string;
    amount: number;
    totalAmount: number;
    paymentStatus: string;
    createdAt: string;
    merchant: { projectName: string };
}

export default function TransactionDetailPage() {
    const params = useParams();
    const router = useRouter();
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const trxId = params.id as string;

    const [tx, setTx] = useState<Transaction | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const merchantsRef = useMemoFirebase(() => {
        if (!firestore || !authUser?.uid) return null;
        return collection(firestore, 'users', authUser.uid, 'GomerchPays');
    }, [firestore, authUser?.uid]);

    const { data: merchants, isLoading: loadingMerchants } = useCollection<any>(merchantsRef);

    const fetchDetailFromApi = useCallback(async (merchant: any) => {
        setLoading(true);
        setError('');
        try {
            const res = await fetch('/api/user/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    merchantId: merchant.id, 
                    accessToken: merchant.accessToken, 
                    refreshToken: merchant.refreshToken, 
                    xUniqueid: merchant.xUniqueid 
                }),
            });
            
            const data = await res.json();
            
            if (data.status === 'success') {
                const found = data.data.recentTransactions.find((t: any) => t.trxId === trxId);
                
                if (found) {
                    setTx(found);
                } else {
                    setError('Transaksi tidak ditemukan dalam riwayat terbaru Gopay Merchant.');
                }

                if (data.data.tokenRefreshed && firestore && authUser) {
                    updateDocumentNonBlocking(doc(firestore, 'users', authUser.uid, 'GomerchPays', merchant.id), {
                        accessToken: data.data.newAccessToken,
                        refreshToken: data.data.newRefreshToken,
                        updatedAt: serverTimestamp()
                    });
                }
            } else {
                setError(data.message || 'Gagal mengambil data dari server.');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi ke server API.');
        } finally {
            setLoading(false);
        }
    }, [trxId, firestore, authUser]);

    useEffect(() => {
        if (merchants && merchants.length > 0) {
            fetchDetailFromApi(merchants[0]);
        } else if (!loadingMerchants && merchants?.length === 0) {
            setError('Merchant belum terhubung.');
            setLoading(false);
        }
    }, [merchants, loadingMerchants, fetchDetailFromApi]);

    if (loading || loadingMerchants) {
        return <div className="min-h-[60vh] flex items-center justify-center"><RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" /></div>;
    }

    if (error) {
        return (
            <div className="max-w-xl mx-auto pt-10 px-4">
                <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <AlertCircle className="w-8 h-8 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Pencarian Gagal</h2>
                    <p className="text-slate-500 text-sm mb-8">{error}</p>
                    <button onClick={() => router.back()} className="btn btn-primary w-full !rounded-xl font-bold uppercase tracking-widest text-xs">Kembali</button>
                </div>
            </div>
        );
    }

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleString('id-ID', { 
            day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
        });
    };

    const isSuccess = tx?.paymentStatus.toLowerCase() === 'paid' || 
                      tx?.paymentStatus.toLowerCase() === 'settlement' || 
                      tx?.paymentStatus.toLowerCase() === 'success';

    return (
        <div className="max-w-xl mx-auto space-y-6 animate-slide-up pb-20 px-4">
            {/* Simple Back Link */}
            <button 
                onClick={() => router.back()} 
                className="flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-sm font-medium group"
            >
                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                <span>Kembali ke Dashboard</span>
            </button>

            {/* Invoice Card */}
            <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden flex flex-col">
                {/* Invoice Status Header */}
                <div className={`px-8 py-10 text-center space-y-4 ${isSuccess ? 'bg-emerald-50/30' : 'bg-amber-50/30'}`}>
                    <div className={`w-16 h-16 rounded-full mx-auto flex items-center justify-center border-4 border-white shadow-sm ${isSuccess ? 'bg-emerald-500' : 'bg-amber-500'}`}>
                        {isSuccess ? <CheckCircle2 className="w-8 h-8 text-white" /> : <RefreshCw className="w-8 h-8 text-white animate-spin" />}
                    </div>
                    <div>
                        <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                            {isSuccess ? 'Pembayaran Berhasil' : 'Menunggu Pembayaran'}
                        </h2>
                        <p className="text-slate-500 text-xs font-medium mt-1 uppercase tracking-widest">
                            Invoice #{tx?.trxId.slice(-8)}
                        </p>
                    </div>
                </div>

                {/* Invoice Body */}
                <div className="p-8 space-y-10">
                    {/* Amount Section */}
                    <div className="text-center">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Total Transaksi</p>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tighter">
                            {tx ? formatCurrency(tx.totalAmount) : '-'}
                        </h1>
                    </div>

                    {/* Invoice Details Table */}
                    <div className="space-y-4 pt-8 border-t border-dashed border-slate-200">
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">ID Transaksi</span>
                            <span className="text-xs font-bold text-slate-900 text-right font-mono">{tx?.trxId}</span>
                        </div>
                        <div className="flex justify-between items-start gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Reference ID</span>
                            <span className="text-xs font-bold text-slate-900 text-right font-mono">{tx?.refId}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Waktu</span>
                            <span className="text-xs font-bold text-slate-900 text-right">{tx ? formatDate(tx.createdAt) : '-'}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer</span>
                            <span className="text-xs font-bold text-slate-900 text-right">{tx?.customerName || 'Guest'}</span>
                        </div>
                        <div className="flex justify-between items-center gap-4">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Merchant</span>
                            <span className="text-xs font-bold text-slate-900 text-right uppercase">{tx?.merchant.projectName}</span>
                        </div>
                    </div>

                    {/* Action */}
                    <div className="pt-4">
                        <button 
                            onClick={() => {
                                navigator.clipboard.writeText(tx?.trxId || '');
                                alert('TRX ID berhasil disalin!');
                            }}
                            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-slate-50 border border-slate-100 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-slate-100 transition-all"
                        >
                            <Copy className="w-3.5 h-3.5" />
                            Salin ID Transaksi
                        </button>
                    </div>
                </div>

                {/* Invoice Footer Decoration */}
                <div className="bg-slate-900 p-6 flex items-center justify-between">
                    <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em]">GomerchPay Invoice</span>
                    <div className="flex gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                    </div>
                </div>
            </div>
        </div>
    );
}
