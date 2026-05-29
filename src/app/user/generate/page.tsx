'use client';

import { useState, useEffect } from 'react';
import { useUserContext } from '../layout';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, orderBy } from 'firebase/firestore';
import { RefreshCw, QrCode, CreditCard, User, AlertCircle, CheckCircle2, Copy, Download, X, ArrowRight, Search } from 'lucide-react';

interface Merchant {
    id: string;
    projectName: string;
    toolType: 'GomerchPay' | 'orderKuota';
}

interface GenerateResult {
    trx_id: string;
    ref_id: string;
    amount: number;
    unique_code: number;
    total_amount: number;
    payment_detail: {
        qr_string: string;
        qr_image: string;
    };
    expires_at: string;
}

export default function GenerateQrisPage() {
    const { user } = useUserContext();
    const firestore = useFirestore();

    const [merchants, setMerchants] = useState<Merchant[]>([]);
    const [loadingMerchants, setLoadingMerchants] = useState(true);

    const [form, setForm] = useState({
        merchantAlias: '',
        amount: '',
        customerName: '',
        refId: '',
    });

    const [loading, setLoading] = useState(false);
    const [checkLoading, setCheckLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [result, setResult] = useState<GenerateResult | null>(null);
    const [isPaid, setIsPaid] = useState(false);

    useEffect(() => {
        if (!user?.id || !firestore) return;

        const fetchAllMerchants = async () => {
            setLoadingMerchants(true);
            try {
                const gopayRef = collection(firestore, 'users', user.id, 'GomerchPays');
                const okRef = collection(firestore, 'users', user.id, 'orderKuotaMerchants');
                
                const { getDocs } = await import('firebase/firestore');
                const [goSnap, okSnap] = await Promise.all([
                    getDocs(gopayRef),
                    getDocs(okRef)
                ]);

                const list: Merchant[] = [];
                goSnap.forEach(doc => list.push({ id: doc.id, projectName: doc.data().projectName, toolType: 'GomerchPay' }));
                okSnap.forEach(doc => list.push({ id: doc.id, projectName: doc.data().projectName, toolType: 'orderKuota' }));
                
                setMerchants(list);
                if (list.length > 0) setForm(prev => ({ ...prev, merchantAlias: list[0].projectName }));
            } catch (err) {
                console.error('Failed to fetch merchants:', err);
            } finally {
                setLoadingMerchants(false);
            }
        };

        fetchAllMerchants();
    }, [user?.id, firestore]);

    const handleGenerate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user?.apiKey) {
            setError('API Key tidak ditemukan. Silakan cek pengaturan profil Anda.');
            return;
        }

        setLoading(true);
        setError('');
        setResult(null);
        setIsPaid(false);

        const payload = {
            apikey: user.apiKey,
            nama_project: form.merchantAlias,
            amount: parseInt(form.amount),
            customer_name: form.customerName || undefined,
            ref_id: form.refId || `GEN-${Date.now()}`,
            expired: 15
        };

        try {
            const res = await fetch('/api/order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            const data = await res.json();

            if (data.status === 'success') {
                setResult(data.data);
            } else {
                setError(data.message || 'Gagal membuat QRIS. Pastikan saldo atau limit plan mencukupi.');
            }
        } catch (err) {
            setError('Terjadi kesalahan koneksi ke API.');
        } finally {
            setLoading(false);
        }
    };

    const handleCheckStatus = async () => {
        if (!result || !user?.apiKey || checkLoading) return;
        setCheckLoading(true);
        setError('');
        setSuccessMsg('');

        try {
            const res = await fetch('/api/status', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    apikey: user.apiKey,
                    ref_id: result.ref_id
                }),
            });

            const data = await res.json();

            if (data.status === 'success') {
                if (data.data.payment_status === 'paid') {
                    setIsPaid(true);
                    setSuccessMsg('Pembayaran Berhasil Dideteksi!');
                } else {
                    setError('Pembayaran belum masuk. Pastikan Anda sudah transfer nominal yang sesuai.');
                }
            } else {
                setError(data.message || 'Gagal memeriksa status.');
            }
        } catch (err) {
            setError('Koneksi ke server gagal.');
        } finally {
            setCheckLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert('Tersalin ke clipboard!');
    };

    if (loadingMerchants) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-8 animate-slide-up pb-20">
            <div className="border-b border-slate-100 pb-6">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Generate QRIS Dinamis</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Buat kode pembayaran QRIS secara manual untuk pelanggan Anda.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Form Section */}
                <div className="lg:col-span-5">
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                                <QrCode className="w-4 h-4 text-[#619BF3]" />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Konfigurasi QRIS</h2>
                        </div>

                        {error && (
                            <div className="bg-rose-50 border border-rose-100 text-rose-600 px-4 py-3 rounded-xl text-xs mb-6 font-bold flex items-center gap-2">
                                <AlertCircle className="w-4 h-4 shrink-0" /> {error}
                            </div>
                        )}

                        {merchants.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-slate-400 text-sm mb-4">Anda belum memiliki merchant yang terhubung.</p>
                                <button 
                                    onClick={() => window.location.href = '/user/dashboard'}
                                    className="text-[#619BF3] text-xs font-bold uppercase tracking-widest hover:underline"
                                >
                                    Hubungkan Merchant Sekarang
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleGenerate} className="space-y-5">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Pilih Merchant</label>
                                    <select 
                                        value={form.merchantAlias}
                                        onChange={e => setForm({ ...form, merchantAlias: e.target.value })}
                                        className="!rounded-xl border-slate-200 font-bold text-sm"
                                        required
                                    >
                                        {merchants.map(m => (
                                            <option key={m.id} value={m.projectName}>
                                                {m.projectName} ({m.toolType === 'GomerchPay' ? 'GoPay' : 'OrderKuota'})
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nominal Pembayaran (IDR)</label>
                                    <div className="relative">
                                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                                        <input 
                                            type="number" 
                                            value={form.amount}
                                            onChange={e => setForm({ ...form, amount: e.target.value })}
                                            placeholder="50000"
                                            className="!pl-11 !rounded-xl border-slate-200 font-black text-lg tracking-tight"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Customer (Opsional)</label>
                                    <input 
                                        type="text" 
                                        value={form.customerName}
                                        onChange={e => setForm({ ...form, customerName: e.target.value })}
                                        placeholder="Contoh: John Doe"
                                        className="!rounded-xl border-slate-200 text-sm"
                                    />
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reference ID (Opsional)</label>
                                    <input 
                                        type="text" 
                                        value={form.refId}
                                        onChange={e => setForm({ ...form, refId: e.target.value })}
                                        placeholder="Biarkan kosong untuk otomatis"
                                        className="!rounded-xl border-slate-200 font-mono text-xs"
                                    />
                                </div>

                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="btn btn-primary w-full !rounded-xl py-4 font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100"
                                >
                                    {loading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <ArrowRight className="w-4 h-4 mr-2" />}
                                    Buat QRIS
                                </button>
                            </form>
                        )}
                    </div>
                </div>

                {/* Result Section with PNG Background Frame */}
                <div className="lg:col-span-7">
                    {!result ? (
                        <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl p-20 text-center flex flex-col items-center justify-center min-h-[500px]">
                            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mb-6 shadow-sm">
                                <QrCode className="w-8 h-8 text-slate-200" />
                            </div>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Isi form untuk menghasilkan QRIS</p>
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm animate-slide-up flex flex-col items-center text-center">
                            <div className="w-full flex justify-between items-center mb-8 border-b border-slate-50 pb-6">
                                <div className="text-left">
                                    <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border ${isPaid ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-blue-50 text-[#619BF3] border-blue-100'}`}>
                                        {isPaid ? 'Paid' : 'Success Generated'}
                                    </span>
                                    <h3 className="text-lg font-black text-slate-900 tracking-tight mt-2 uppercase">{form.merchantAlias}</h3>
                                </div>
                                <button onClick={() => setResult(null)} className="p-2 rounded-xl hover:bg-slate-50 transition">
                                    <X className="w-5 h-5 text-slate-300" />
                                </button>
                            </div>

                            {/* QRIS Frame Implementation */}
                            <div className="relative w-64 h-[320px] md:w-72 md:h-[360px] flex items-center justify-center overflow-hidden mb-8 group">
                                {/* Frame Background PNG */}
                                <img 
                                    src="/img/bg-qris.png" 
                                    alt="QRIS Frame" 
                                    className="absolute inset-0 w-full h-full object-contain pointer-events-none"
                                />
                                
                                {/* QR Code inside frame */}
                                <div className="relative z-10">
                                    <img 
                                        src={result.payment_detail.qr_image} 
                                        alt="QRIS Dinamis" 
                                        className="w-56 h-56 md:w-62 md:h-62 mix-blend-darken" 
                                    />
                                </div>

                                {/* Download/Copy Hover Overlay */}
                                <div className="absolute inset-0 bg-slate-900/80 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3 rounded-2xl z-20">
                                    <button onClick={() => copyToClipboard(result.payment_detail.qr_string)} className="p-3 bg-white rounded-xl hover:scale-110 transition shadow-lg text-slate-900">
                                        <Copy className="w-5 h-5" />
                                    </button>
                                    <a href={result.payment_detail.qr_image} download={`QRIS-${result.trx_id}.png`} className="p-3 bg-[#619BF3] rounded-xl hover:scale-110 transition shadow-lg text-white">
                                        <Download className="w-5 h-5" />
                                    </a>
                                </div>
                            </div>

                            <div className="w-full max-w-sm space-y-4">
                                {successMsg && <div className="bg-emerald-50 text-emerald-600 px-5 py-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 mb-4 animate-slide-up"><CheckCircle2 className="w-4 h-4" /> {successMsg}</div>}

                                <div className="bg-slate-50 rounded-xl p-6 border border-slate-100">
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total yang harus dibayar</p>
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">Rp {result.total_amount.toLocaleString('id-ID')}</span>
                                    </div>
                                    <div className="mt-2 flex items-center justify-center gap-2">
                                        <span className="text-[10px] text-slate-400 font-medium">Sudah termasuk kode unik:</span>
                                        <span className="text-[10px] text-emerald-600 font-bold">+{result.unique_code}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 text-left">
                                    <div className="p-4 bg-white border border-slate-100 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TRX ID</p>
                                        <p className="text-xs font-bold text-slate-900 truncate font-mono">{result.trx_id}</p>
                                    </div>
                                    <div className="p-4 bg-white border border-slate-100 rounded-xl">
                                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">REF ID</p>
                                        <p className="text-xs font-bold text-slate-900 truncate font-mono">{result.ref_id}</p>
                                    </div>
                                </div>

                                {!isPaid ? (
                                    <div className="space-y-4 pt-4">
                                        <div className="flex items-center justify-center gap-2 text-rose-500 animate-pulse">
                                            <RefreshCw className="w-3 h-3 animate-spin" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Menunggu Pembayaran</span>
                                        </div>
                                        <button 
                                            onClick={handleCheckStatus}
                                            disabled={checkLoading}
                                            className="btn btn-primary w-full py-4 !rounded-xl font-black uppercase tracking-widest text-xs shadow-lg shadow-blue-100"
                                        >
                                            {checkLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Search className="w-4 h-4 mr-2" />}
                                            Cek Status Pembayaran
                                        </button>
                                    </div>
                                ) : (
                                    <div className="py-4">
                                        <button 
                                            onClick={() => window.location.href = '/user/dashboard'}
                                            className="btn btn-outline w-full py-4 !rounded-xl font-black uppercase tracking-widest text-xs"
                                        >
                                            Kembali ke Dashboard
                                        </button>
                                    </div>
                                )}

                                <button 
                                    onClick={() => copyToClipboard(result.payment_detail.qr_string)}
                                    className="w-full py-4 border border-slate-200 !rounded-xl font-black uppercase tracking-widest text-[10px] text-slate-400 hover:bg-slate-50 hover:text-slate-600 transition-all"
                                >
                                    Salin QRIS String
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}


