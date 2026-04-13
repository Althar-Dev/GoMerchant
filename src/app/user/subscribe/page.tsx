'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { 
    useUser, 
    useFirestore, 
    useCollection, 
    useMemoFirebase 
} from '@/firebase';
import { collection } from 'firebase/firestore';
import { RefreshCw, Check, Zap, AlertCircle } from 'lucide-react';
import { useUserContext } from '../layout';

interface Plan {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    maxRequestsPerDay: number;
    isActive: boolean;
}

export default function SubscribePage() {
    const router = useRouter();
    const { isUserLoading } = useUser();
    const { user: profile } = useUserContext();
    const firestore = useFirestore();

    const plansRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'plans');
    }, [firestore]);
    
    const { data: rawPlans, isLoading: loadingPlans, error: plansError } = useCollection<Plan>(plansRef);

    const plans = useMemo(() => {
        if (!rawPlans) return [];
        return rawPlans
            .filter(p => p.isActive !== false)
            .sort((a, b) => (a.price || 0) - (b.price || 0));
    }, [rawPlans]);

    const handleSelectPlan = (planId: string) => {
        router.push(`/checkout?id=${planId}`);
    };

    if (isUserLoading || loadingPlans) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" /></div>;

    return (
        <div className="space-y-8 animate-slide-up max-w-6xl mx-auto pb-12">
            <div className="flex flex-col gap-1 border-b border-slate-100 pb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pilih Paket Langganan</h1>
                <p className="text-slate-500 text-sm font-medium">Tingkatkan kuota harian dan stabilitas sistem Anda.</p>
            </div>

            {plansError && (
                <div className="bg-rose-50 border border-rose-100 text-rose-600 px-6 py-4 rounded-xl text-sm font-bold flex items-center gap-3">
                    <AlertCircle className="w-5 h-5" /> Gagal memuat paket. Silakan hubungi admin.
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.length === 0 && !plansError && !loadingPlans && (
                    <div className="col-span-full py-20 text-center bg-white border border-slate-100 rounded-xl">
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada paket tersedia.</p>
                    </div>
                )}
                
                {plans.map((plan) => {
                    const isCurrentPlan = profile?.planId === plan.id;

                    return (
                        <div key={plan.id} className={`bg-white rounded-xl border ${isCurrentPlan ? 'border-[#619BF3] ring-2 ring-[#619BF3]/10' : plan.price === 0 ? 'border-emerald-100' : 'border-slate-200'} p-8 hover:shadow-lg transition-all flex flex-col h-full group relative overflow-hidden`}>
                            {isCurrentPlan && (
                                <div className="absolute top-0 right-0">
                                    <div className="bg-[#619BF3] text-white text-[10px] font-black uppercase tracking-widest px-4 py-1 rounded-bl-xl shadow-sm flex items-center gap-1.5">
                                        <Check className="w-3 h-3" /> Paket Aktif
                                    </div>
                                </div>
                            )}

                            <div className="mb-6">
                                <h3 className="text-slate-400 font-bold text-[10px] uppercase tracking-[0.2em] mb-2">{plan.name}</h3>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-black text-slate-900 tracking-tighter">
                                        {plan.price === 0 ? 'Gratis' : plan.price.toLocaleString('id-ID')}
                                    </span>
                                    {plan.price > 0 && <span className="text-sm font-bold text-slate-400">IDR</span>}
                                </div>
                                <p className="text-slate-400 text-xs mt-1 font-medium">aktif selama {plan.durationDays} hari</p>
                            </div>

                            <div className="space-y-4 mb-8 flex-1">
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-blue-50 flex items-center justify-center shrink-0"><Zap className="w-3 h-3 text-[#619BF3]" /></div>
                                    <span className="text-sm text-slate-600 font-medium">{plan.maxRequestsPerDay === -1 ? 'Unlimited' : plan.maxRequestsPerDay} Request / Hari</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-emerald-500" /></div>
                                    <span className="text-sm text-slate-600 font-medium">Monitoring Transaksi Realtime</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-emerald-50 flex items-center justify-center shrink-0"><Check className="w-3 h-3 text-emerald-500" /></div>
                                    <span className="text-sm text-slate-600 font-medium">Full API Access</span>
                                </div>
                            </div>

                            <button 
                                onClick={() => !isCurrentPlan && handleSelectPlan(plan.id)} 
                                disabled={isCurrentPlan}
                                className={`btn w-full !rounded-xl py-4 font-black uppercase tracking-widest text-xs transition-all ${
                                    isCurrentPlan 
                                        ? 'bg-slate-100 text-slate-400 cursor-not-allowed border-none' 
                                        : plan.price === 0 ? 'bg-emerald-500 text-white' : 'btn-primary'
                                }`}
                            >
                                {isCurrentPlan ? 'Paket Sedang Aktif' : plan.price === 0 ? 'Aktivasi Instan' : 'Pilih Paket'}
                            </button>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
