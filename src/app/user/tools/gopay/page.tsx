'use client';

import { useState } from 'react';
import { useUser, useFirestore, useCollection, useMemoFirebase, addDocumentNonBlocking, deleteDocumentNonBlocking, updateDocumentNonBlocking } from '@/firebase';
import { collection, doc, serverTimestamp } from 'firebase/firestore';

interface Merchant {
    id: string;
    projectName: string;
    phoneNumber: string;
    qrString: string | null;
    uniqueCodeDigits: number;
    createdAt: any;
}

export default function GopayMerchantPage() {
    const { user } = useUser();
    const firestore = useFirestore();

    const merchantsRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return collection(firestore, 'users', user.uid, 'GomerchPays');
    }, [firestore, user?.uid]);

    const { data: merchants, isLoading: loading } = useCollection<Merchant>(merchantsRef);

    const [showAddModal, setShowAddModal] = useState(false);
    const [showQrisModal, setShowQrisModal] = useState(false);
    const [selectedMerchant, setSelectedMerchant] = useState<Merchant | null>(null);

    const [addForm, setAddForm] = useState({ projectName: '', phoneNumber: '' });
    const [otpState, setOtpState] = useState<{
        step: 'form' | 'otp';
        otpToken: string;
        xUniqueid: string;
        otpLength: number;
    }>({ step: 'form', otpToken: '', xUniqueid: '', otpLength: 4 });
    
    const [otp, setOtp] = useState('');
    const [addLoading, setAddLoading] = useState(false);
    const [addError, setAddError] = useState('');
    const [addSuccess, setAddSuccess] = useState('');

    const [qrisForm, setQrisForm] = useState({ qrString: '', uniqueCodeDigits: 2 });
    const [qrisLoading, setQrisLoading] = useState(false);
    const [qrisMsg, setQrisMsg] = useState({ type: '', text: '' });

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddLoading(true);
        setAddError('');

        try {
            const res = await fetch('/api/merchant', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(addForm),
            });
            const data = await res.json();

            if (data.status !== 'success') {
                setAddError(data.message);
                return;
            }

            if (data.data.requiresOtp) {
                setOtpState({
                    step: 'otp',
                    otpToken: data.data.otpToken,
                    xUniqueid: data.data.xUniqueid,
                    otpLength: data.data.otpLength || 4,
                });
            } else {
                setAddError('Gagal mendapatkan token OTP.');
            }
        } catch {
            setAddError('Koneksi gagal');
        } finally {
            setAddLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setAddLoading(true);
        setAddError('');

        try {
            const res = await fetch('/api/merchant/verify-otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    otp,
                    otpToken: otpState.otpToken,
                    xUniqueid: otpState.xUniqueid,
                }),
            });
            const data = await res.json();

            if (data.status !== 'success') {
                setAddError(data.message || 'Verifikasi OTP gagal. Periksa kembali kode Anda.');
                return;
            }

            if (merchantsRef && user) {
                const newMerchant = {
                    userId: user.uid,
                    projectName: addForm.projectName,
                    phoneNumber: addForm.phoneNumber,
                    accessToken: data.data.accessToken,
                    refreshToken: data.data.refreshToken,
                    xUniqueid: data.data.xUniqueid,
                    qrString: null,
                    uniqueCodeDigits: 2,
                    createdAt: serverTimestamp(),
                };
                
                addDocumentNonBlocking(merchantsRef, newMerchant);
                setAddSuccess('Merchant berhasil ditambahkan!');
                setTimeout(() => closeAddModal(), 1500);
            }
        } catch {
            setAddError('Koneksi gagal');
        } finally {
            setAddLoading(false);
        }
    };

    const handleDeleteMerchant = (id: string) => {
        if (!confirm('Yakin ingin menghapus merchant ini?') || !merchantsRef) return;
        const docRef = doc(merchantsRef, id);
        deleteDocumentNonBlocking(docRef);
    };

    const handleQrisUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedMerchant || !merchantsRef) return;
        setQrisLoading(true);
        setQrisMsg({ type: '', text: '' });

        try {
            const docRef = doc(merchantsRef, selectedMerchant.id);
            updateDocumentNonBlocking(docRef, {
                qrString: qrisForm.qrString,
                uniqueCodeDigits: qrisForm.uniqueCodeDigits
            });
            
            setQrisMsg({ type: 'success', text: 'QRIS berhasil diupdate!' });
            setTimeout(() => { setShowQrisModal(false); setQrisMsg({ type: '', text: '' }); }, 1500);
        } catch {
            setQrisMsg({ type: 'error', text: 'Gagal memperbarui QRIS' });
        } finally {
            setQrisLoading(false);
        }
    };

    const closeAddModal = () => {
        setShowAddModal(false);
        setAddForm({ projectName: '', phoneNumber: '' });
        setOtpState({ step: 'form', otpToken: '', xUniqueid: '', otpLength: 4 });
        setOtp('');
        setAddError('');
        setAddSuccess('');
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;
    }

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">GoPay Merchant</h1>
                    <p className="text-[#94a3b8] text-sm mt-1">Kelola akun GoPay Merchant Anda</p>
                </div>
                <button onClick={() => setShowAddModal(true)} className="btn btn-primary shrink-0">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    Add GomerchPay
                </button>
            </div>

            {!merchants || merchants.length === 0 ? (
                <div className="glass rounded-2xl p-12 text-center">
                    <div className="text-4xl mb-4">📱</div>
                    <p className="text-[#94a3b8] text-sm">Belum ada merchant. Klik "Add GomerchPay" untuk menambahkan.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {merchants.map((m) => (
                        <div key={m.id} className="glass rounded-2xl p-5 hover:border-[#38bdf8]/30 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-white font-semibold">{m.projectName}</h3>
                                    <p className="text-[#64748b] text-xs mt-1 font-mono">{m.phoneNumber}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => {
                                            setSelectedMerchant(m);
                                            setQrisForm({ qrString: m.qrString || '', uniqueCodeDigits: m.uniqueCodeDigits });
                                            setShowQrisModal(true);
                                        }}
                                        className="p-2 rounded-lg hover:bg-[#334155]/50 transition"
                                        title="Setup QRIS"
                                    >
                                        <svg className="w-4 h-4 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                        </svg>
                                    </button>
                                    <button
                                        onClick={() => handleDeleteMerchant(m.id)}
                                        className="p-2 rounded-lg hover:bg-[#f87171]/10 transition"
                                        title="Hapus"
                                    >
                                        <svg className="w-4 h-4 text-[#f87171]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                        </svg>
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-[#64748b]">QRIS</span>
                                    <span className={m.qrString ? 'text-[#34d399]' : 'text-[#f87171]'}>
                                        {m.qrString ? '✓ Aktif' : '✗ Belum setup'}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-[#64748b]">Kode Unik</span>
                                    <span className="text-white">{m.uniqueCodeDigits} digit</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {showAddModal && (
                <div className="modal-overlay" onClick={closeAddModal}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-white">
                                {otpState.step === 'form' ? 'Add GomerchPay' : 'Verifikasi OTP'}
                            </h2>
                            <button onClick={closeAddModal} className="p-1 rounded hover:bg-[#334155]/50">
                                <svg className="w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {addError && <div className="bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] px-4 py-3 rounded-xl text-sm mb-4">{addError}</div>}
                        {addSuccess && <div className="bg-[#34d399]/10 border border-[#34d399]/20 text-[#34d399] px-4 py-3 rounded-xl text-sm mb-4">{addSuccess}</div>}

                        {otpState.step === 'form' ? (
                            <form onSubmit={handleRequestOtp} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Nama Project</label>
                                    <input type="text" value={addForm.projectName} onChange={(e) => setAddForm({ ...addForm, projectName: e.target.value })} placeholder="Contoh: Toko Online" required />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Nomor Gopay Merchant</label>
                                    <input type="text" value={addForm.phoneNumber} onChange={(e) => setAddForm({ ...addForm, phoneNumber: e.target.value })} placeholder="0812..." required />
                                </div>
                                <button type="submit" className="btn btn-primary w-full" disabled={addLoading}>{addLoading ? <span className="spinner" /> : 'Kirim OTP'}</button>
                            </form>
                        ) : (
                            <form onSubmit={handleVerifyOtp} className="space-y-4">
                                <div className="text-center mb-2">
                                    <p className="text-sm text-[#94a3b8]">Masukkan kode {otpState.otpLength} digit yang dikirim ke nomor Anda</p>
                                </div>
                                <input 
                                    type="text" 
                                    value={otp} 
                                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                                    placeholder="••••" 
                                    className="text-center text-2xl tracking-[0.5em] font-mono" 
                                    maxLength={6}
                                    required 
                                    autoFocus
                                />
                                <button type="submit" className="btn btn-primary w-full" disabled={addLoading || otp.length < 4}>
                                    {addLoading ? <span className="spinner" /> : 'Verifikasi OTP'}
                                </button>
                                <button type="button" onClick={() => setOtpState({...otpState, step: 'form'})} className="w-full text-xs text-[#64748b] hover:text-[#94a3b8] mt-2">
                                    Kembali ke nomor telepon
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}

            {showQrisModal && selectedMerchant && (
                <div className="modal-overlay" onClick={() => setShowQrisModal(false)}>
                    <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                        <h2 className="text-lg font-bold text-white mb-6">Setup QRIS - {selectedMerchant.projectName}</h2>
                        {qrisMsg.text && <div className={`${qrisMsg.type === 'error' ? 'bg-[#f87171]/10 border-[#f87171]/20 text-[#f87171]' : 'bg-[#34d399]/10 border-[#34d399]/20 text-[#34d399]'} border px-4 py-3 rounded-xl text-sm mb-4`}>{qrisMsg.text}</div>}
                        <form onSubmit={handleQrisUpdate} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-[#94a3b8] mb-2">QRIS String (000201...)</label>
                                <textarea value={qrisForm.qrString} onChange={(e) => setQrisForm({ ...qrisForm, qrString: e.target.value })} placeholder="Masukkan QRIS String statis Anda" rows={4} required className="font-mono text-xs" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Digit Kode Unik</label>
                                <select value={qrisForm.uniqueCodeDigits} onChange={(e) => setQrisForm({ ...qrisForm, uniqueCodeDigits: parseInt(e.target.value) })}>
                                    <option value={2}>2 digit (10-99)</option>
                                    <option value={3}>3 digit (100-999)</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary w-full" disabled={qrisLoading}>{qrisLoading ? <span className="spinner" /> : 'Simpan Konfigurasi'}</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}


