
'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
    RefreshCw, 
    Users, 
    CreditCard, 
    Wallet, 
    ArrowUpRight, 
    TrendingUp, 
    Clock
} from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase, useUser } from '@/firebase';
import { collection, query, orderBy, limit } from 'firebase/firestore';

export default function AdminDashboardPage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalTransactions: 0,
        totalRevenue: 0
    });
    const [loadingStats, setLoadingStats] = useState(true);

    const recentTransactionsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'transactions'), orderBy('createdAt', 'desc'), limit(5));
    }, [firestore]);
    const { data: recentTransactions, isLoading: loadingTx } = useCollection<any>(recentTransactionsQuery);

    const usersQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'users'), orderBy('createdAt', 'desc'), limit(5));
    }, [firestore]);
    const { data: recentUsers, isLoading: loadingUsers } = useCollection<any>(usersQuery);

    const fetchStats = async () => {
        setLoadingStats(true);
        try {
            const res = await fetch('/api/admin/stats', {
                headers: {
                    'x-user-id': authUser?.uid || ''
                }
            });
            const resData = await res.json();
            if (resData.status === 'success') {
                setStats({
                    totalUsers: resData.data.totalUsers || 0,
                    totalTransactions: resData.data.totalTransactions || 0,
                    totalRevenue: resData.data.totalRevenue || 0
                });
            }
        } catch (err) {
            console.error('Failed to fetch admin stats:', err);
        } finally {
            setLoadingStats(false);
        }
    };

    useEffect(() => {
        fetchStats();
    }, [authUser?.uid]);

    const formatRupiah = (n: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    return (
        <div className="space-y-8 animate-slide-up">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">System Overview</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Laporan performa platform GomerchPay hari ini.</p>
                </div>
                <button 
                    onClick={fetchStats}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-[#619BF3] hover:border-blue-100 transition-all shadow-sm"
                >
                    <RefreshCw className={`w-3 h-3 ${loadingStats ? 'animate-spin' : ''}`} />
                    Refresh Analytics
                </button>
            </div>

            {/* Global Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm group hover:border-blue-200 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Users className="w-5 h-5 text-[#619BF3]" />
                        </div>
                        <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded uppercase tracking-widest">+ Live</span>
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Members</p>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">{loadingStats ? '...' : stats.totalUsers}</h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm group hover:border-purple-200 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-purple-50 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-purple-500" />
                        </div>
                        <TrendingUp className="w-4 h-4 text-purple-300" />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Total Transaksi</p>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">{loadingStats ? '...' : stats.totalTransactions}</h2>
                </div>

                <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm group hover:border-emerald-200 transition-all">
                    <div className="flex items-center justify-between mb-4">
                        <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center">
                            <Wallet className="w-5 h-5 text-emerald-500" />
                        </div>
                        <ArrowUpRight className="w-4 h-4 text-emerald-300" />
                    </div>
                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">Revenue (IDR)</p>
                    <h2 className="text-2xl font-black text-slate-900 mt-1">{loadingStats ? '...' : formatRupiah(stats.totalRevenue)}</h2>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Transactions Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Log Transaksi</h3>
                        </div>
                        <Link href="/members" className="text-[10px] font-black text-[#619BF3] uppercase hover:underline">Semua Transaksi</Link>
                    </div>
                    
                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {loadingTx ? (
                            <div className="p-12 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-200" /></div>
                        ) : !recentTransactions?.length ? (
                            <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Tidak ada aktivitas</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {recentTransactions.map((tx: any, idx: number) => (
                                    <div key={`${tx.id || idx}-${idx}`} className="p-4 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                                        <div className="min-w-0 flex-1 pr-4">
                                            <p className="text-sm font-bold text-slate-900 truncate uppercase">{tx.customerName || 'Guest'}</p>
                                            <p className="text-[10px] text-slate-400 font-mono mt-0.5">{tx.trxId}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-black text-slate-900">{formatRupiah(tx.totalAmount)}</p>
                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-widest ${tx.paymentStatus === 'paid' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'}`}>
                                                {tx.paymentStatus}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* New Users Section */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-3">
                            <Users className="w-4 h-4 text-slate-400" />
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-[0.2em]">Registrasi Terbaru</h3>
                        </div>
                        <Link href="/members" className="text-[10px] font-black text-[#619BF3] uppercase hover:underline">Kelola Member</Link>
                    </div>

                    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                        {loadingUsers ? (
                            <div className="p-12 text-center"><RefreshCw className="w-6 h-6 animate-spin mx-auto text-slate-200" /></div>
                        ) : !recentUsers?.length ? (
                            <div className="p-12 text-center text-slate-400 text-xs font-bold uppercase tracking-widest">Belum ada member</div>
                        ) : (
                            <div className="divide-y divide-slate-50">
                                {recentUsers.map((u: any, idx: number) => (
                                    <div key={`${u.id || idx}-${idx}`} className="p-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                                        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 font-black text-lg">
                                            {u.displayName?.[0]?.toUpperCase() || u.email?.[0]?.toUpperCase()}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className="text-sm font-bold text-slate-900 truncate">{u.displayName || 'Anonymous'}</p>
                                            <p className="text-[10px] text-slate-400 truncate">{u.email}</p>
                                        </div>
                                        <div className="text-right">
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter ${u.role === 'ADMIN' ? 'bg-rose-50 text-rose-500' : 'bg-slate-50 text-slate-500'}`}>
                                                {u.role}
                                            </span>
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

