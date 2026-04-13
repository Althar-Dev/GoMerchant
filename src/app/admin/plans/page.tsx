'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useCollection, useMemoFirebase, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp, setDoc } from 'firebase/firestore';
import { RefreshCw, Plus, Save, Trash2, Edit3, XCircle, CheckCircle2, Zap, Clock, Package, AlertCircle } from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    maxRequestsPerDay: number; 
    isActive: boolean;
    createdAt?: any;
}

interface PlanForm {
    name: string;
    price: string;
    durationDays: string;
    maxRequestsPerDay: string;
}

const emptyForm: PlanForm = {
    name: '',
    price: '',
    durationDays: '30',
    maxRequestsPerDay: '100',
};

export default function AdminPlansPage() {
    const firestore = useFirestore();
    
    const plansColRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'plans');
    }, [firestore]);

    const { data: rawPlans, isLoading: loading } = useCollection<Plan>(plansColRef);

    const plans = useMemo(() => {
        if (!rawPlans) return [];
        return [...rawPlans].sort((a, b) => a.price - b.price);
    }, [rawPlans]);

    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<PlanForm>(emptyForm);
    const [actionLoading, setActionLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    const formatRupiah = (amount: number) => {
        return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount);
    };

    const setupStandardPlans = async () => {
        if (!firestore || !confirm('Hasilkan paket standar (Starter, Business, Enterprise)?')) return;
        setActionLoading(true);
        
        const standardPlans = [
            { id: 'starter', name: 'Starter', price: 10000, maxRequestsPerDay: 100, durationDays: 30 },
            { id: 'business', name: 'Business', price: 15000, maxRequestsPerDay: 1000, durationDays: 30 },
            { id: 'enterprise', name: 'Enterprise', price: 25000, maxRequestsPerDay: -1, durationDays: 30 }, 
        ];

        try {
            for (const p of standardPlans) {
                const docRef = doc(firestore, 'plans', p.id);
                await setDoc(docRef, {
                    ...p,
                    isActive: true,
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp()
                });
            }
            setMsg({ type: 'success', text: 'Standard plans berhasil dibuat!' });
        } catch (error: any) {
            console.error('Setup plans failed:', error);
            setMsg({ type: 'error', text: 'Gagal membuat standard plans. Pastikan Anda adalah Admin.' });
        } finally {
            setActionLoading(false);
        }
    };

    const openCreate = () => {
        setEditingId(null);
        setForm(emptyForm);
        setShowModal(true);
        setMsg({ type: '', text: '' });
    };

    const openEdit = (plan: Plan) => {
        setEditingId(plan.id);
        setForm({
            name: plan.name,
            price: plan.price.toString(),
            durationDays: plan.durationDays.toString(),
            maxRequestsPerDay: plan.maxRequestsPerDay.toString(),
        });
        setShowModal(true);
        setMsg({ type: '', text: '' });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!firestore) return;
        
        setActionLoading(true);
        const planData = {
            name: form.name,
            price: parseInt(form.price) || 0,
            durationDays: parseInt(form.durationDays) || 30,
            maxRequestsPerDay: parseInt(form.maxRequestsPerDay) || 0,
            isActive: true,
            updatedAt: serverTimestamp()
        };

        try {
            if (editingId) {
                const docRef = doc(firestore, 'plans', editingId);
                updateDocumentNonBlocking(docRef, planData);
                setMsg({ type: 'success', text: 'Plan berhasil diperbarui!' });
            } else {
                const newDocRef = doc(collection(firestore, 'plans'));
                await setDoc(newDocRef, { ...planData, createdAt: serverTimestamp() });
                setMsg({ type: 'success', text: 'Plan baru berhasil dibuat!' });
            }
            setTimeout(() => { setShowModal(false); setMsg({ type: '', text: '' }); }, 1000);
        } catch (error: any) {
            console.error('Submit plan failed:', error);
            setMsg({ type: 'error', text: 'Gagal memproses data. Pastikan Anda memiliki akses Admin.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleDelete = (id: string, name: string) => {
        if (!confirm(`Yakin ingin menghapus plan "${name}"?`) || !firestore) return;
        deleteDocumentNonBlocking(doc(firestore, 'plans', id));
    };

    const toggleActive = (plan: Plan) => {
        if (!firestore) return;
        updateDocumentNonBlocking(doc(firestore, 'plans', plan.id), { isActive: !plan.isActive });
    };

    if (loading) return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" /></div>;

    return (
        <div className="space-y-8 animate-slide-up pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kelola Plan</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Konfigurasi paket langganan dan kuota request harian.</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={setupStandardPlans} disabled={actionLoading} className="btn btn-outline px-6 !rounded-xl font-black uppercase tracking-widest text-[10px]">
                        {actionLoading ? <RefreshCw className="w-3 h-3 animate-spin mr-2" /> : <Zap className="w-3 h-3 mr-2" />}
                        Setup Standard Plans
                    </button>
                    <button onClick={openCreate} className="btn btn-primary px-6 !rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100">
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Plan
                    </button>
                </div>
            </div>

            {plans.length === 0 ? (
                <div className="bg-white border border-slate-200 rounded-xl p-20 text-center">
                    <Package className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Belum ada paket. Klik "Setup Standard Plans" di atas.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <div key={plan.id} className={`bg-white border ${plan.isActive ? 'border-slate-200' : 'border-slate-100 opacity-60'} rounded-xl p-8 shadow-sm hover:shadow-md transition-all group relative overflow-hidden`}>
                            <div className="flex justify-between items-start mb-6">
                                <div className="space-y-1">
                                    <h3 className="font-black text-slate-900 uppercase tracking-tight text-lg">{plan.name}</h3>
                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${plan.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                                        {plan.isActive ? 'Aktif' : 'Nonaktif'}
                                    </span>
                                </div>
                                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <button onClick={() => openEdit(plan)} className="p-2 rounded-xl hover:bg-blue-50 text-[#619BF3] transition-colors"><Edit3 className="w-4 h-4" /></button>
                                    <button onClick={() => handleDelete(plan.id, plan.name)} className="p-2 rounded-xl hover:bg-rose-50 text-rose-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                </div>
                            </div>

                            <div className="mb-8">
                                <p className="text-2xl font-black text-slate-900 tracking-tighter">
                                    {plan.price === 0 ? 'FREE' : formatRupiah(plan.price).replace('Rp', '').trim()}
                                    {plan.price > 0 && <span className="text-xs font-bold text-slate-400 uppercase tracking-widest ml-1">IDR</span>}
                                </p>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-1">Masa Aktif {plan.durationDays} Hari</p>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><Zap className="w-3 h-3 text-[#619BF3]" /></div>
                                    <span className="text-xs text-slate-600 font-bold">{plan.maxRequestsPerDay === -1 ? 'Unlimited' : plan.maxRequestsPerDay} Request / Hari</span>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="w-6 h-6 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><CheckCircle2 className="w-3 h-3 text-emerald-500" /></div>
                                    <span className="text-xs text-slate-600 font-bold">Monitoring Transaksi Realtime</span>
                                </div>
                            </div>

                            <button onClick={() => toggleActive(plan)} className={`w-full py-3 !rounded-xl font-black uppercase tracking-widest text-[10px] border transition-all ${plan.isActive ? 'border-slate-200 text-slate-400 hover:bg-slate-50' : 'border-emerald-100 text-emerald-600 hover:bg-emerald-50'}`}>
                                {plan.isActive ? 'Nonaktifkan Plan' : 'Aktifkan Plan'}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => !actionLoading && setShowModal(false)}>
                    <div className="modal-content max-w-lg !p-0 !rounded-2xl overflow-hidden border-none shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">{editingId ? 'Edit Plan' : 'Tambah Plan Baru'}</h2>
                            <button onClick={() => setShowModal(false)} className="p-2 rounded-xl hover:bg-slate-50 transition"><XCircle className="w-5 h-5 text-slate-300" /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            {msg.text && <div className={`${msg.type === 'error' ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'} px-5 py-4 rounded-xl text-xs font-bold flex items-center gap-3 animate-slide-up`}>{msg.text}</div>}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Plan</label>
                                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Starter" className="!rounded-xl border-slate-200 font-bold" required />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Harga (IDR)</label>
                                    <input type="number" value={form.price} onChange={e => setForm({ ...form, price: e.target.value })} placeholder="0 untuk Gratis" className="!rounded-xl border-slate-200 font-bold" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Durasi (Hari)</label>
                                    <input type="number" value={form.durationDays} onChange={e => setForm({ ...form, durationDays: e.target.value })} placeholder="30" className="!rounded-xl border-slate-200 font-bold" required />
                                </div>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Max Request Per Hari</label>
                                <input type="number" value={form.maxRequestsPerDay} onChange={e => setForm({ ...form, maxRequestsPerDay: e.target.value })} placeholder="-1 untuk Unlimited" className="!rounded-xl border-slate-200 font-bold" required />
                                <p className="text-[9px] text-slate-400 mt-1 ml-1">Gunakan <code className="font-bold">-1</code> untuk akses tanpa batas.</p>
                            </div>
                            <button type="submit" className="btn btn-primary w-full py-4 !rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100" disabled={actionLoading}>
                                {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                {editingId ? 'Simpan Perubahan' : 'Buat Plan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
