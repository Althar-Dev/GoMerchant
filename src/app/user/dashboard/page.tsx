
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'next/navigation';
import { useUser, useFirestore, useCollection, updateDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { collection, doc, serverTimestamp, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { 
    RefreshCw, 
    Wallet, 
    Zap, 
    ArrowUpRight, 
    Clock, 
    ChevronLeft,
    ChevronRight,
    QrCode,
    AlertCircle,
    LogOut,
    Settings2,
    CheckCircle2,
    X,
    ShieldCheck,
    Loader2
} from 'lucide-react';
import { useUserContext } from '../layout';
import Link from 'next/link';

interface Stats {
    totalRevenue: number;
}

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

interface Merchant {
    id: string;
    projectName: string;
    phoneNumber: string;
    qrString: string | null;
    uniqueCodeDigits: number;
    accessToken: string;
    refreshToken: string;
    xUniqueid: string;
}

export default function DashboardPage() {
    const searchParams = useSearchParams();
    const { user: authUser } = useUser();
    const { user: profile } = useUserContext();
    const firestore = useFirestore();

    const [stats, setStats] = useState<Stats | null>(null);
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [loadingStats, setLoadingStats] = useState(false);
    const [dailyUsage, setDailyUsage] = useState<{ current: number; limit: number } | null>(null);

    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    const merchantsRef = useMemoFirebase(() => {
        if (!firestore || !authUser?.uid) return null;
        return collection(firestore, 'users', authUser.uid, 'GomerchPays');
    }, [firestore, authUser?.uid]);

    const { data: merchants, isLoading: loadingMerchants } = useCollection<Merchant>(merchantsRef);
    const merchant = merchants && merchants.length > 0 ? merchants[0] : null;

    const [showConnectModal, setShowConnectModal] = useState(false);
    const [showQrisModal, setShowQrisModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    
    const [addForm, setAddForm] = useState({ projectName: '', phoneNumber: '' });
    const [otpState, setOtpState] = useState<{ step: 'form' | 'otp'; otpToken: string; xUniqueid: string; otpLength: number; }>({ step: 'form', otpToken: '', xUniqueid: '', otpLength: 4 });
    const [otp, setOtp] = useState('');

    const [qrisForm, setQrisForm] = useState({ qrString: '', uniqueCodeDigits: 2 });

    const fetchUsage = useCallback(async (apiKey: string) => {
        try {
            const res = await fetch('/api/profile', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ apikey: apiKey })
            });
            const data = await res.json();
            if (data.status === 'Success') {
                setDailyUsage({
                    current: data.data.usage,
                    limit: data.data.limit
                });
            }
        } catch (err) {
            console.error('Failed to fetch usage:', err);
        }
    }, []);

    const fetchRealStats = useCallback(async (m: Merchant) => {
        setLoadingStats(true);
        try {
            const res = await fetch('/api/user/stats', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    merchantId: m.id, 
                    accessToken: m.accessToken, 
                    refreshToken: m.refreshToken, 
                    xUniqueid: m.xUniqueid 
                }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                setStats(data.data.stats);
                setRecentTransactions(data.data.recentTransactions || []);
                setCurrentPage(1);
                
                if (data.data.tokenRefreshed && firestore && authUser) {
                    updateDocumentNonBlocking(doc(firestore, 'users', authUser.uid, 'GomerchPays', m.id), {
                        accessToken: data.data.newAccessToken,
                        refreshToken: data.data.newRefreshToken,
                        updatedAt: serverTimestamp()
                    });
                }
            }
        } catch (err) { 
            console.error(err); 
        } finally { 
            setLoadingStats(false); 
        }
    }, [firestore, authUser]);

    useEffect(() => { 
        if (merchant) fetchRealStats(merchant); 
    }, [merchant, fetchRealStats]);

    useEffect(() => {
        if (profile?.apiKey) {
            fetchUsage(profile.apiKey);
        }
    }, [profile?.apiKey, fetchUsage]);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setErrorMsg('');
        try {
            const res = await fetch('/api/merchant', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(addForm) });
            const data = await res.json();
            if (data.status !== 'success') { setErrorMsg(data.message); return; }
            if (data.data.requiresOtp) {
                setOtpState({ 
                    step: 'otp', 
                    otpToken: data.data.otpToken, 
                    xUniqueid: data.data.xUniqueid, 
                    otpLength: data.data.otpLength || 4 
                });
            }
        } catch { setErrorMsg('Koneksi gagal'); } finally { setActionLoading(false); }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch('/api/merchant/verify-otp', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ otp, otpToken: otpState.otpToken, xUniqueid: otpState.xUniqueid }) });
            const data = await res.json();
            if (data.status === 'success' && firestore && authUser) {
                const { addDoc, collection } = await import('firebase/firestore');
                await addDoc(collection(firestore, 'users', authUser.uid, 'GomerchPays'), {
                    userId: authUser.uid, 
                    projectName: addForm.projectName, 
                    phoneNumber: addForm.phoneNumber,
                    accessToken: data.data.accessToken, 
                    refreshToken: data.data.refreshToken,
                    xUniqueid: data.data.xUniqueid, 
                    qrString: null, 
                    uniqueCodeDigits: 2, 
                    createdAt: serverTimestamp(),
                });
                setShowConnectModal(false);
            } else { 
                setErrorMsg(data.message || 'Gagal verifikasi'); 
            }
        } catch { setErrorMsg('Koneksi gagal'); } finally { setActionLoading(false); }
    };

    const handleQrisUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!merchant || !firestore || !authUser) return;
        setActionLoading(true);
        setErrorMsg('');
        setSuccessMsg('');

        try {
            updateDocumentNonBlocking(doc(firestore, 'users', authUser.uid, 'GomerchPays', merchant.id), {
                qrString: qrisForm.qrString,
                uniqueCodeDigits: qrisForm.uniqueCodeDigits,
                updatedAt: serverTimestamp()
            });
            setSuccessMsg('Konfigurasi QRIS berhasil disimpan!');
            setTimeout(() => {
                setShowQrisModal(false);
                setSuccessMsg('');
            }, 1500);
        } catch {
            setErrorMsg('Gagal menyimpan konfigurasi.');
        } finally {
            setActionLoading(false);
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const getStatusBadge = (status: string) => {
        const s = status.toLowerCase();
        if (s === 'paid' || s === 'settlement' || s === 'success') {
            return <span className="badge badge-success text-[10px]">Sukses</span>;
        }
        if (s === 'pending') {
            return <span className="badge badge-warning text-[10px]">Pending</span>;
        }
        return <span className="badge badge-danger text-[10px]">{status}</span>;
    };

    const totalPages = Math.ceil(recentTransactions.length / ITEMS_PER_PAGE);
    const paginatedTransactions = recentTransactions.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    if (loadingMerchants) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" /></div>;

    return (
        <div className="max-w-6xl mx-auto space-y-8 animate-slide-up pb-20">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="flex flex-col md:flex-row md:items-center gap-4 md:gap-8 flex-1">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Overview</h1>
                        <p className="text-slate-500 text-sm font-medium mt-1">Selamat datang kembali, <span className="text-slate-900 font-bold">{profile?.displayName}</span></p>
                    </div>
                    
                    <div className="flex items-center justify-between w-full md:w-[320px] bg-white border border-slate-200 rounded-xl px-5 py-3 shadow-sm">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">API Daily Usage</span>
                            <div className="flex items-center gap-2 mt-0.5">
                                {dailyUsage ? (
                                    <span className="text-sm font-black text-slate-900">
                                        {dailyUsage.limit === -1 ? 'Unlimited' : `${dailyUsage.current} / ${dailyUsage.limit} Requests`}
                                    </span>
                                ) : (
                                    <RefreshCw className="w-3.5 h-3.5 text-slate-300 animate-spin" />
                                )}
                            </div>
                        </div>
                        
                        <div className="flex flex-col text-right">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">Current Plan</span>
                            <span className="text-sm font-black text-[#619BF3] uppercase flex items-center justify-end gap-1.5">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                {profile?.plan?.name || 'Free Plan'}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <Link href="/generate" className="btn btn-primary !h-11 !rounded-xl px-6 text-sm font-bold shadow-lg shadow-blue-100 w-full sm:w-auto">
                        <QrCode className="w-4 h-4 mr-2" /> Generate QRIS
                    </Link>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                        <Wallet className="w-16 h-16 text-slate-900" />
                    </div>
                    <div className="space-y-4 relative z-10">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Total Pendapatan</p>
                        <div className="flex items-baseline gap-1">
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter">
                                {loadingStats ? '---' : formatCurrency(stats?.totalRevenue || 0).replace('Rp', '').trim()}
                            </h2>
                            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">IDR</span>
                        </div>
                        <div className="flex items-center gap-1.5 text-emerald-500 font-bold text-xs bg-emerald-50 w-fit px-2 py-1 rounded-lg">
                            <ArrowUpRight className="w-3 h-3" /> Real-time Update
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 p-8 shadow-sm group">
                    <div className="space-y-4">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Merchant</p>
                        {merchant ? (
                            <div className="flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 font-black text-xl">
                                            {merchant.projectName[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-slate-900 truncate max-w-[150px]">{merchant.projectName}</h3>
                                            <p className="text-slate-400 text-[10px] font-mono">+{merchant.phoneNumber}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Connected
                                        </span>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => {
                                        setQrisForm({ qrString: merchant.qrString || '', uniqueCodeDigits: merchant.uniqueCodeDigits || 2 });
                                        setShowQrisModal(true);
                                    }}
                                    className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-slate-100 bg-slate-50 text-[10px] font-black text-slate-600 uppercase tracking-widest hover:bg-white hover:border-[#619BF3] hover:text-[#619BF3] transition-all"
                                >
                                    <Settings2 className="w-3.5 h-3.5" />
                                    {merchant.qrString ? 'Edit Setup BaseQR' : 'Setup BaseQR Sekarang'}
                                </button>
                            </div>
                        ) : (
                            <div className="py-2">
                                <button onClick={() => setShowConnectModal(true)} className="text-[#619BF3] text-xs font-black uppercase tracking-widest flex items-center gap-2 hover:translate-x-1 transition-transform">
                                    Hubungkan Sekarang <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="flex items-center justify-between px-2">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center">
                            <Clock className="w-4 h-4 text-slate-500" />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Transaksi Terbaru</h2>
                    </div>
                    <button onClick={() => merchant && fetchRealStats(merchant)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors text-slate-400 hover:text-slate-900">
                        <RefreshCw className={`w-4 h-4 ${loadingStats ? 'animate-spin' : ''}`} />
                    </button>
                </div>

                <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                    {!merchant ? (
                        <div className="p-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto">
                                <AlertCircle className="w-8 h-8 text-slate-300" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Merchant belum terhubung</p>
                        </div>
                    ) : recentTransactions.length === 0 ? (
                        <div className="p-20 text-center space-y-4">
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tidak ada transaksi ditemukan</p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            <th>Waktu</th>
                                            <th>TRX ID / Customer</th>
                                            <th>Nominal</th>
                                            <th>Status</th>
                                            <th className="text-right">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {paginatedTransactions.map((tx, idx) => (
                                            <tr key={`${tx.trxId}-${idx}`} className="hover:bg-slate-50/50 transition-colors group">
                                                <td className="text-slate-400 font-mono text-[11px] whitespace-nowrap">
                                                    {new Date(tx.createdAt).toLocaleString('id-ID', { 
                                                        day: '2-digit', 
                                                        month: 'short', 
                                                        hour: '2-digit', 
                                                        minute: '2-digit' 
                                                    }).replace(',', '')}
                                                </td>
                                                <td className="min-w-[200px]">
                                                    <p className="font-bold text-slate-900 text-sm whitespace-nowrap">{tx.customerName}</p>
                                                    <p className="text-[10px] text-slate-400 font-mono truncate">{tx.trxId}</p>
                                                </td>
                                                <td className="whitespace-nowrap">
                                                    <p className="font-black text-slate-900 text-sm">Rp {tx.totalAmount.toLocaleString('id-ID')}</p>
                                                </td>
                                                <td className="whitespace-nowrap">{getStatusBadge(tx.paymentStatus)}</td>
                                                <td className="text-right whitespace-nowrap">
                                                    <Link href={`/detail/${tx.trxId}`} className="p-2 rounded-lg hover:bg-slate-100 inline-block transition-colors">
                                                        <ChevronRight className="w-4 h-4 text-slate-300" />
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-slate-50 flex items-center justify-between bg-slate-50/30">
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        Halaman {currentPage} dari {totalPages}
                                    </p>
                                    <div className="flex gap-2">
                                        <button 
                                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                            disabled={currentPage === 1}
                                            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronLeft className="w-4 h-4 text-slate-600" />
                                        </button>
                                        <button 
                                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                            disabled={currentPage === totalPages}
                                            className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-30 transition-colors"
                                        >
                                            <ChevronRight className="w-4 h-4 text-slate-600" />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Modal Connect */}
            {showConnectModal && (
                <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
                    <div className="modal-content max-w-md !p-0 !rounded-xl overflow-hidden border-none shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">
                                {otpState.step === 'form' ? 'Connect Merchant' : 'Security Check'}
                            </h2>
                            <button onClick={() => setShowConnectModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition">
                                <LogOut className="w-4 h-4 text-slate-400 rotate-90" />
                            </button>
                        </div>
                        <div className="p-8">
                            {errorMsg && <div className="bg-rose-50 text-rose-600 px-5 py-4 rounded-xl text-xs mb-6 font-bold flex items-center gap-3"><AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}</div>}
                            
                            {otpState.step === 'form' ? (
                                <form onSubmit={handleRequestOtp} className="space-y-6">
                                    <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-2">
                                        <p className="text-[10px] text-blue-700 font-bold leading-relaxed uppercase">
                                            Pastikan nomor yang anda masukkan terdaftar di aplikasi Gopay Merchant.
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Project Name</label>
                                        <input type="text" className="!rounded-xl border-slate-200 font-bold" placeholder="Contoh: Toko Utama" value={addForm.projectName} onChange={e => setAddForm({ ...addForm, projectName: e.target.value })} required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nomor WhatsApp Gopay Merchant</label>
                                        <input type="text" className="!rounded-xl border-slate-200 font-mono font-bold" value={addForm.phoneNumber} onChange={e => setAddForm({ ...addForm, phoneNumber: e.target.value })} placeholder="62812..." required />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full py-4 !rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100" disabled={actionLoading}>
                                        {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                                        Request OTP Code
                                    </button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-8 text-center">
                                    <div className="space-y-2">
                                        <p className="text-sm text-slate-500 font-medium">Masukkan kode verifikasi yang dikirim ke nomor Anda</p>
                                        <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest">Wait for {otpState.otpLength} Digits</p>
                                    </div>
                                    <input 
                                        type="text" 
                                        value={otp} 
                                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} 
                                        placeholder="••••" 
                                        className="text-center text-4xl tracking-[0.5em] font-black text-slate-900 !bg-slate-50 !border-none !rounded-xl !py-8 focus:ring-4 focus:ring-blue-100 transition-all" 
                                        maxLength={6} 
                                        required 
                                        autoFocus 
                                    />
                                    <button type="submit" className="btn btn-primary w-full py-4 !rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100" disabled={actionLoading}>
                                        Verify & Complete
                                    </button>
                                    <button type="button" onClick={() => setOtpState({...otpState, step: 'form'})} className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-slate-900 transition-colors">
                                        Gunakan Nomor Lain
                                    </button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Setup QRIS */}
            {showQrisModal && merchant && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowQrisModal(false)}>
                    <div className="modal-content max-w-md !p-0 !rounded-xl overflow-hidden border-none shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Konfigurasi BaseQR</h2>
                            <button onClick={() => setShowQrisModal(false)} className="p-2 rounded-xl hover:bg-slate-100 transition">
                                <X className="w-4 h-4 text-slate-400" />
                            </button>
                        </div>
                        <div className="p-8">
                            {errorMsg && <div className="bg-rose-50 text-rose-600 px-5 py-4 rounded-xl text-xs mb-6 font-bold flex items-center gap-3"><AlertCircle className="w-4 h-4 shrink-0" /> {errorMsg}</div>}
                            {successMsg && <div className="bg-emerald-50 text-emerald-600 px-5 py-4 rounded-xl text-xs mb-6 font-bold flex items-center gap-3"><CheckCircle2 className="w-4 h-4 shrink-0" /> {successMsg}</div>}

                            <form onSubmit={handleQrisUpdate} className="space-y-6">
                                <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 mb-2">
                                    <p className="text-[10px] text-amber-700 font-bold leading-relaxed uppercase">
                                        Salin QRIS String statis dari aplikasi Gopay Merchant Anda (biasanya diawali dengan 000201...).
                                    </p>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">QRIS String (BaseQR)</label>
                                    <textarea 
                                        className="!rounded-xl border-slate-200 font-mono text-[11px] bg-slate-50 focus:bg-white transition-colors p-4" 
                                        rows={5}
                                        placeholder="00020101021126670016COM.GOJEK.ID03030005144..." 
                                        value={qrisForm.qrString} 
                                        onChange={e => setQrisForm({ ...qrisForm, qrString: e.target.value })} 
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Jumlah Digit Kode Unik</label>
                                    <select 
                                        className="!rounded-xl border-slate-200 font-bold text-sm"
                                        value={qrisForm.uniqueCodeDigits}
                                        onChange={e => setQrisForm({ ...qrisForm, uniqueCodeDigits: parseInt(e.target.value) })}
                                    >
                                        <option value={2}>2 Digit (10 - 99)</option>
                                        <option value={3}>3 Digit (100 - 999)</option>
                                    </select>
                                </div>
                                <button type="submit" className="btn btn-primary w-full py-4 !rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100" disabled={actionLoading}>
                                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Simpan Konfigurasi
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

