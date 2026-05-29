'use client';

import { useState, useEffect } from 'react';
import { useFirestore, useDoc, useCollection, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase, useUser } from '@/firebase';
import { doc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { 
    RefreshCw, 
    Smartphone,
    Save, 
    AlertCircle, 
    CheckCircle2,
    ShieldCheck,
    X,
    LogOut,
    CreditCard,
    Zap,
    Lock
} from 'lucide-react';

interface BusinessSettings {
    gopayBaseQr: string;
    svaleBusinessId?: string;
    svaleSecretKey?: string;
    adminUid?: string;
    adminMerchantId?: string;
}

interface Merchant {
    id: string;
    projectName: string;
    phoneNumber: string;
    qrString: string | null;
}

export default function AdminWebsitePage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    
    const settingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'business', 'settings');
    }, [firestore]);
    const { data: businessSettings, isLoading: loadingBusiness } = useDoc<BusinessSettings>(settingsRef);

    const adminMerchantsRef = useMemoFirebase(() => {
        if (!firestore || !authUser?.uid) return null;
        return collection(firestore, 'users', authUser.uid, 'GomerchPays');
    }, [firestore, authUser?.uid]);
    const { data: merchants, isLoading: loadingMerchants } = useCollection<Merchant>(adminMerchantsRef);
    
    const adminMerchant = merchants?.find(m => m.id === businessSettings?.adminMerchantId) || (merchants && merchants.length > 0 ? merchants[0] : null);

    const [gopayBaseQr, setGopayBaseQr] = useState('');
    const [saving, setSaving] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    
    const [showConnectModal, setShowConnectModal] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [addForm, setAddForm] = useState({ projectName: 'Admin Pusat', phoneNumber: '' });
    const [otpState, setOtpState] = useState<{ step: 'form' | 'otp'; otpToken: string; xUniqueid: string; otpLength: number; }>({ step: 'form', otpToken: '', xUniqueid: '', otpLength: 4 });
    const [otp, setOtp] = useState('');

    useEffect(() => {
        if (businessSettings) {
            setGopayBaseQr(businessSettings.gopayBaseQr || '');
        }
    }, [businessSettings]);

    const handleSaveSettings = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMsg({ type: '', text: '' });

        try {
            if (settingsRef) {
                setDocumentNonBlocking(settingsRef, {
                    gopayBaseQr: gopayBaseQr,
                    updatedAt: serverTimestamp()
                }, { merge: true });
            }
            setMsg({ type: 'success', text: 'Konfigurasi website berhasil disimpan!' });
        } catch {
            setMsg({ type: 'error', text: 'Terjadi kesalahan saat menyimpan' });
        } finally {
            setSaving(false);
        }
    };

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setMsg({ type: '', text: '' });
        try {
            const res = await fetch('/api/merchant', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(addForm) 
            });
            const data = await res.json();
            if (data.status !== 'success') { 
                setMsg({ type: 'error', text: data.message }); 
                return; 
            }
            if (data.data.requiresOtp) {
                setOtpState({ 
                    step: 'otp', 
                    otpToken: data.data.otpToken, 
                    xUniqueid: data.data.xUniqueid, 
                    otpLength: data.data.otpLength || 4 
                });
            }
        } catch { 
            setMsg({ type: 'error', text: 'Koneksi ke API gagal' }); 
        } finally { 
            setActionLoading(false); 
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        try {
            const res = await fetch('/api/merchant/verify-otp', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify({ 
                    otp, 
                    otpToken: otpState.otpToken, 
                    xUniqueid: otpState.xUniqueid 
                }) 
            });
            const data = await res.json();
            
            if (data.status === 'success' && firestore && authUser) {
                const mDoc = await addDoc(collection(firestore, 'users', authUser.uid, 'GomerchPays'), {
                    userId: authUser.uid, 
                    projectName: addForm.projectName, 
                    phoneNumber: addForm.phoneNumber,
                    accessToken: data.data.accessToken, 
                    refreshToken: data.data.refreshToken,
                    xUniqueid: data.data.xUniqueid, 
                    qrString: null, 
                    uniqueCodeDigits: 3,
                    createdAt: serverTimestamp(),
                });

                if (settingsRef) {
                    setDocumentNonBlocking(settingsRef, {
                        adminUid: authUser.uid,
                        adminMerchantId: mDoc.id,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                }

                setShowConnectModal(false);
                setMsg({ type: 'success', text: 'Merchant Admin berhasil terhubung!' });
            } else { 
                setMsg({ type: 'error', text: data.message || 'Gagal verifikasi OTP' }); 
            }
        } catch { 
            setMsg({ type: 'error', text: 'Koneksi gagal' }); 
        } finally { 
            setActionLoading(false); 
        }
    };

    const handleDisconnect = async () => {
        if (!confirm('Putuskan koneksi GomerchPay Admin?') || !adminMerchant || !adminMerchantsRef || !settingsRef) return;
        deleteDocumentNonBlocking(doc(adminMerchantsRef, adminMerchant.id));
        setDocumentNonBlocking(settingsRef, {
            adminUid: null,
            adminMerchantId: null,
            updatedAt: serverTimestamp()
        }, { merge: true });
    };

    if (loadingBusiness || loadingMerchants) {
        return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" /></div>;
    }

    return (
        <div className="space-y-8 animate-slide-up max-w-4xl mx-auto pb-20">
            <div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Kelola Website</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Konfigurasi akun pusat untuk menerima pembayaran otomatis.</p>
            </div>

            {msg.text && !showConnectModal && (
                <div className={`${msg.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'} border px-5 py-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-slide-up shadow-sm`}>
                    {msg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    {msg.text}
                </div>
            )}

            <div className="space-y-8">
                <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-rose-500" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">GomerchPay Admin Account</h2>
                                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5">Akun Penampung Dana User</p>
                            </div>
                        </div>
                        {adminMerchant && (
                            <span className="flex items-center gap-1.5 text-emerald-500 text-[10px] font-black uppercase tracking-widest bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> connected
                            </span>
                        )}
                    </div>

                    <div className="space-y-6">
                        {adminMerchant ? (
                            <div className="flex items-center justify-between p-5 rounded-2xl bg-slate-50 border border-slate-100">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-rose-500 font-black text-xl">
                                        {adminMerchant.projectName[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900">{adminMerchant.projectName}</h3>
                                        <p className="text-slate-400 text-xs font-mono">+{adminMerchant.phoneNumber}</p>
                                    </div>
                                </div>
                                <button onClick={handleDisconnect} className="p-2 text-slate-400 hover:text-rose-500 transition-colors"><LogOut className="w-5 h-5" /></button>
                            </div>
                        ) : (
                            <button onClick={() => setShowConnectModal(true)} className="w-full py-6 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 hover:border-[#619BF3] hover:text-[#619BF3] hover:bg-blue-50/30 transition-all flex flex-col items-center gap-2">
                                <Smartphone className="w-8 h-8" />
                                <span className="text-xs font-black uppercase tracking-[0.2em]">Hubungkan Gopay Merchant Admin</span>
                            </button>
                        )}
                    </div>
                </div>

                <form onSubmit={handleSaveSettings} className="space-y-8">
                    <div className="bg-white border border-slate-200 rounded-xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-slate-50 flex items-center justify-center">
                                <CreditCard className="w-5 h-5 text-slate-500" />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Global BaseQR (QRIS Admin)</h2>
                        </div>

                        <div className="space-y-6">
                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-5">
                                <p className="text-xs text-amber-800 leading-relaxed font-bold uppercase">
                                    PENTING: String ini akan digunakan sebagai QRIS pembayaran saat user membeli paket Subscription atau Deposit. Salin dari aplikasi GoPay Merchant Admin Anda.
                                </p>
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Gopay BaseQR String</label>
                                <textarea
                                    value={gopayBaseQr}
                                    onChange={(e) => setGopayBaseQr(e.target.value)}
                                    placeholder="000201..."
                                    rows={4}
                                    className="!rounded-xl border-slate-200 font-mono text-[11px] bg-slate-50 focus:bg-white transition-colors p-4"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <button type="submit" disabled={saving} className="btn btn-primary px-10 py-4 !rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100">
                            {saving ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                            Simpan Seluruh Pengaturan
                        </button>
                    </div>
                </form>
            </div>

            {showConnectModal && (
                <div className="modal-overlay" onClick={() => setShowConnectModal(false)}>
                    <div className="modal-content max-w-md !p-0 !rounded-xl overflow-hidden border-none shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
                            <h2 className="text-sm font-black uppercase tracking-widest">Connect Admin Merchant</h2>
                            <button onClick={() => setShowConnectModal(false)} className="p-2 rounded-xl hover:bg-white/10 transition"><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-8">
                            {msg.text && <div className="bg-rose-50 text-rose-600 px-5 py-4 rounded-xl text-xs mb-6 font-bold flex items-center gap-3"><AlertCircle className="w-4 h-4 shrink-0" /> {msg.text}</div>}
                            {otpState.step === 'form' ? (
                                <form onSubmit={handleRequestOtp} className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nomor Gopay Merchant Admin</label>
                                        <input type="text" className="!rounded-xl border-slate-200 font-mono font-bold" value={addForm.phoneNumber} onChange={e => setAddForm({ ...addForm, phoneNumber: e.target.value })} placeholder="62812..." required />
                                    </div>
                                    <button type="submit" className="btn btn-primary w-full py-4 !rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100" disabled={actionLoading}>Request OTP</button>
                                </form>
                            ) : (
                                <form onSubmit={handleVerifyOtp} className="space-y-8 text-center">
                                    <p className="text-sm text-slate-500 font-medium">Masukkan kode verifikasi</p>
                                    <input type="text" value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, ''))} placeholder="••••" className="text-center text-4xl tracking-[0.5em] font-black text-slate-900 !bg-slate-50 !border-none !rounded-xl !py-8 focus:ring-4 focus:ring-blue-100 transition-all" maxLength={6} required autoFocus />
                                    <button type="submit" className="btn btn-primary w-full py-4 !rounded-xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100" disabled={actionLoading}>Verify & Connect</button>
                                </form>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}


