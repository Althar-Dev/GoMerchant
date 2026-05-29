'use client';

import { useState, useEffect, useCallback } from 'react';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, deleteDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';

interface OKAccount {
    id?: string;
    projectName: string;
    okUsername: string;
    okToken: string;
    okId: string;
    qrString: string | null;
    uniqueCodeDigits: number;
    createdAt: any;
}

export default function OrderKuotaPage() {
    const { user } = useUser();
    const firestore = useFirestore();
    const accountRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid, 'orderKuotaMerchants', 'main');
    }, [firestore, user?.uid]);

    const { data: account, isLoading: loading } = useDoc<OKAccount>(accountRef);

    const [showConnectModal, setShowAddModal] = useState(false);
    const [showQrisModal, setShowQrisModal] = useState(false);
    const [loginStep, setLoginStep] = useState<'credentials' | 'otp' | 'success'>('credentials');
    const [loginForm, setLoginForm] = useState({ projectName: '', username: '', password: '' });
    const [otp, setOtp] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');
    const [balance, setBalance] = useState<{ main: number; qris: number } | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [qrisForm, setQrisForm] = useState({ qrString: '', uniqueCodeDigits: 2 });

    const fetchBalance = useCallback(async (username: string, token: string) => {
        setBalanceLoading(true);
        try {
            const res = await fetch('/api/orkut/account/balance', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, token }),
            });
            const result = await res.json();
            if (result.success) {
                setBalance({
                    main: result.data.balance || 0,
                    qris: result.data.qris_balance || 0
                });
            }
        } catch (err) {
            console.error('Failed to fetch balance:', err);
        } finally {
            setBalanceLoading(false);
        }
    }, []);

    useEffect(() => {
        if (account?.okUsername && account?.okToken) {
            fetchBalance(account.okUsername, account.okToken);
        }
    }, [account, fetchBalance]);

    const handleRequestOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/orkut/auth/otp', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: loginForm.username,
                    password: loginForm.password
                }),
            });
            const result = await res.json();

            if (!result.success) {
                setErrorMsg(result.error?.message || 'Gagal meminta OTP');
                return;
            }

            setLoginStep('otp');
        } catch {
            setErrorMsg('Koneksi gagal');
        } finally {
            setActionLoading(false);
        }
    };

    const handleVerifyOtp = async (e: React.FormEvent) => {
        e.preventDefault();
        setActionLoading(true);
        setErrorMsg('');

        try {
            const res = await fetch('/api/orkut/auth/token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: loginForm.username,
                    otp: otp
                }),
            });
            const result = await res.json();

            if (!result.success) {
                setErrorMsg(result.error?.message || 'OTP tidak valid');
                return;
            }

            const tokenData = result.data.result;

            if (accountRef && user) {
                const newData: OKAccount = {
                    projectName: loginForm.projectName,
                    okUsername: loginForm.username,
                    okToken: tokenData.token,
                    okId: tokenData.id,
                    qrString: null,
                    uniqueCodeDigits: 2,
                    createdAt: serverTimestamp(),
                };
                
                setDocumentNonBlocking(accountRef, newData, { merge: true });
                setSuccessMsg('Akun berhasil dihubungkan!');
                setLoginStep('success');
                setTimeout(() => closeConnectModal(), 1500);
            }
        } catch {
            setErrorMsg('Koneksi gagal');
        } finally {
            setActionLoading(false);
        }
    };

    const handleDisconnect = () => {
        if (!confirm('Yakin ingin memutuskan koneksi akun OrderKuota ini?') || !accountRef) return;
        deleteDocumentNonBlocking(accountRef);
        setBalance(null);
    };

    const handleQrisUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!accountRef) return;
        setActionLoading(true);
        setErrorMsg('');

        try {
            setDocumentNonBlocking(accountRef, {
                qrString: qrisForm.qrString,
                uniqueCodeDigits: qrisForm.uniqueCodeDigits
            }, { merge: true });
            
            setSuccessMsg('QRIS berhasil diperbarui!');
            setTimeout(() => { setShowQrisModal(false); setSuccessMsg(''); }, 1500);
        } catch {
            setErrorMsg('Gagal memperbarui QRIS');
        } finally {
            setActionLoading(false);
        }
    };

    const closeConnectModal = () => {
        setShowAddModal(false);
        setLoginForm({ projectName: '', username: '', password: '' });
        setOtp('');
        setLoginStep('credentials');
        setErrorMsg('');
        setSuccessMsg('');
    };

    const formatIDR = (val: number) => new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(val);

    if (loading) return <div className="flex items-center justify-center h-64"><div className="spinner w-8 h-8" /></div>;

    return (
        <div className="space-y-6 animate-slide-up">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-white">OrderKuota</h1>
                    <p className="text-[#94a3b8] text-sm mt-1">Integrasi pembayaran QRIS via OrderKuota</p>
                </div>
                {!account && (
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary shrink-0">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.826a4 4 0 015.656 0l4 4a4 4 0 01-5.656 5.656l-1.1-1.1" />
                        </svg>
                        Connect Account
                    </button>
                )}
            </div>

            {!account ? (
                <div className="glass rounded-3xl p-12 text-center border-dashed border-2 border-white/10">
                    <div className="w-20 h-20 bg-[#a78bfa]/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <svg className="w-10 h-10 text-[#a78bfa]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Belum Terhubung</h3>
                    <p className="text-[#94a3b8] max-w-sm mx-auto mb-8">Hubungkan akun OrderKuota Anda untuk mulai menerima pembayaran QRIS otomatis melalui API.</p>
                    <button onClick={() => setShowAddModal(true)} className="btn btn-primary px-8">Hubungkan Sekarang</button>
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Account Status Card */}
                    <div className="lg:col-span-2 space-y-6">
                        <div className="glass rounded-3xl p-6 relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-8 opacity-5">
                                <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" />
                                </svg>
                            </div>
                            
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-gradient-to-br from-[#a78bfa] to-[#8b5cf6] rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-[#a78bfa]/20">
                                        {account.okUsername[0].toUpperCase()}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white">{account.projectName}</h2>
                                        <p className="text-[#94a3b8] text-sm font-mono">@{account.okUsername}</p>
                                    </div>
                                </div>
                                <span className="px-3 py-1 bg-[#34d399]/10 text-[#34d399] rounded-full text-xs font-bold border border-[#34d399]/20 flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 bg-[#34d399] rounded-full animate-pulse" />
                                    Terhubung
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[#64748b] text-xs uppercase tracking-wider font-semibold mb-1">Saldo Utama</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-2xl font-bold text-white">
                                            {balanceLoading ? <span className="inline-block w-24 h-6 bg-white/10 animate-pulse rounded" /> : formatIDR(balance?.main || 0)}
                                        </h3>
                                    </div>
                                </div>
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <p className="text-[#64748b] text-xs uppercase tracking-wider font-semibold mb-1">Saldo QRIS</p>
                                    <div className="flex items-baseline gap-2">
                                        <h3 className="text-2xl font-bold text-[#a78bfa]">
                                            {balanceLoading ? <span className="inline-block w-24 h-6 bg-white/10 animate-pulse rounded" /> : formatIDR(balance?.qris || 0)}
                                        </h3>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-3">
                                <button 
                                    onClick={() => {
                                        setQrisForm({ qrString: account.qrString || '', uniqueCodeDigits: account.uniqueCodeDigits || 2 });
                                        setShowQrisModal(true);
                                    }}
                                    className="btn btn-outline flex-1 sm:flex-none"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                                    </svg>
                                    Setup QRIS
                                </button>
                                <button 
                                    onClick={handleDisconnect}
                                    className="btn border-[#f87171]/20 text-[#f87171] hover:bg-[#f87171]/10 flex-1 sm:flex-none"
                                >
                                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                    </svg>
                                    Disconnect
                                </button>
                            </div>
                        </div>

                        {/* Integration Info */}
                        <div className="glass rounded-3xl p-6">
                            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                                <svg className="w-5 h-5 text-[#38bdf8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                                Informasi Integrasi
                            </h3>
                            <div className="space-y-4">
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <p className="text-[#94a3b8] text-xs mb-2">GUNAKAN NAMA PROJECT INI PADA API</p>
                                    <div className="flex items-center justify-between">
                                        <code className="text-[#38bdf8] font-mono text-sm font-bold">{account.projectName}</code>
                                        <button 
                                            onClick={() => { navigator.clipboard.writeText(account.projectName); alert('Copied!'); }}
                                            className="text-[#64748b] hover:text-white transition"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[#64748b] text-[10px] uppercase font-bold mb-1">Status QRIS</p>
                                        <p className={`text-sm font-bold ${account.qrString ? 'text-[#34d399]' : 'text-[#f87171]'}`}>
                                            {account.qrString ? 'AKTIF' : 'BELUM SETUP'}
                                        </p>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                        <p className="text-[#64748b] text-[10px] uppercase font-bold mb-1">Kode Unik</p>
                                        <p className="text-sm font-bold text-white">{account.uniqueCodeDigits} DIGIT</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* QRIS Preview Card (if set) */}
                    <div className="space-y-6">
                        <div className="glass rounded-3xl p-6 text-center">
                            <h3 className="text-white font-bold mb-6">QRIS Statis</h3>
                            {account.qrString ? (
                                <div className="bg-white p-4 rounded-2xl inline-block shadow-xl mb-4">
                                    <img 
                                        src={`https://quickchart.io/qr?text=${encodeURIComponent(account.qrString)}&size=200`} 
                                        alt="QRIS Preview" 
                                        className="w-40 h-40"
                                    />
                                </div>
                            ) : (
                                <div className="w-40 h-40 bg-white/5 rounded-2xl border-dashed border-2 border-white/10 mx-auto flex items-center justify-center mb-4">
                                    <p className="text-[#475569] text-xs px-4">QRIS belum dikonfigurasi</p>
                                </div>
                            )}
                            <p className="text-[#64748b] text-xs leading-relaxed px-4">
                                Pastikan QRIS String yang Anda masukkan sesuai dengan QRIS statis dari aplikasi OrderKuota Anda.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Connect Account */}
            {showConnectModal && (
                <div className="modal-overlay" onClick={closeConnectModal}>
                    <div className="modal-content max-w-md !rounded-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-white">
                                {loginStep === 'credentials' ? 'Hubungkan Akun' : 'Verifikasi OTP'}
                            </h2>
                            <button onClick={closeConnectModal} className="p-2 rounded-xl hover:bg-white/5 transition">
                                <svg className="w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {errorMsg && <div className="bg-[#f87171]/10 border border-[#f87171]/20 text-[#f87171] px-4 py-3 rounded-2xl text-sm mb-6 flex items-center gap-3">
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            {errorMsg}
                        </div>}
                        
                        {successMsg && <div className="bg-[#34d399]/10 border border-[#34d399]/20 text-[#34d399] px-4 py-3 rounded-2xl text-sm mb-6 flex items-center gap-3">
                            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                            {successMsg}
                        </div>}

                        {loginStep === 'credentials' ? (
                            <form onSubmit={handleRequestOtp} className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Nama Project (Alias)</label>
                                    <input 
                                        type="text" 
                                        value={loginForm.projectName} 
                                        onChange={(e) => setLoginForm({ ...loginForm, projectName: e.target.value })} 
                                        placeholder="Contoh: Toko Saya" 
                                        className="!rounded-xl"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Username OrderKuota</label>
                                    <input 
                                        type="text" 
                                        value={loginForm.username} 
                                        onChange={(e) => setLoginForm({ ...loginForm, username: e.target.value })} 
                                        placeholder="Masukkan username" 
                                        className="!rounded-xl"
                                        required 
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-[#94a3b8] mb-2">Password</label>
                                    <input 
                                        type="password" 
                                        value={loginForm.password} 
                                        onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} 
                                        placeholder="••••••••" 
                                        className="!rounded-xl"
                                        required 
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-full py-4 !rounded-xl" disabled={actionLoading}>
                                    {actionLoading ? <span className="spinner" /> : 'Minta Kode OTP'}
                                </button>
                            </form>
                        ) : loginStep === 'otp' ? (
                            <form onSubmit={handleVerifyOtp} className="space-y-6 text-center">
                                <div>
                                    <p className="text-sm text-[#94a3b8] mb-6">Kode OTP telah dikirim. Masukkan kode tersebut di bawah ini untuk menghubungkan akun.</p>
                                    <input 
                                        type="text" 
                                        value={otp} 
                                        onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} 
                                        placeholder="000000" 
                                        className="text-center text-3xl tracking-[0.5em] font-mono !py-4 !rounded-2xl" 
                                        maxLength={6} 
                                        required 
                                        autoFocus 
                                    />
                                </div>
                                <button type="submit" className="btn btn-primary w-full py-4 !rounded-xl" disabled={actionLoading || otp.length < 4}>
                                    {actionLoading ? <span className="spinner" /> : 'Verifikasi & Hubungkan'}
                                </button>
                                <button type="button" onClick={() => setLoginStep('credentials')} className="text-sm text-[#64748b] hover:text-white transition">
                                    Gunakan akun lain
                                </button>
                            </form>
                        ) : (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-[#34d399]/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-[#34d399]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <p className="text-white font-bold text-lg">Berhasil Terhubung!</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Modal Setup QRIS */}
            {showQrisModal && account && (
                <div className="modal-overlay" onClick={() => setShowQrisModal(false)}>
                    <div className="modal-content max-w-md !rounded-3xl" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold text-white">Konfigurasi QRIS</h2>
                            <button onClick={() => setShowQrisModal(false)} className="p-2 rounded-xl hover:bg-white/5 transition">
                                <svg className="w-5 h-5 text-[#94a3b8]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {successMsg && <div className="bg-[#34d399]/10 border border-[#34d399]/20 text-[#34d399] px-4 py-3 rounded-2xl text-sm mb-6">
                            {successMsg}
                        </div>}

                        <form onSubmit={handleQrisUpdate} className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-[#94a3b8] mb-2">QRIS String (Salin dari App OrderKuota)</label>
                                <textarea 
                                    value={qrisForm.qrString} 
                                    onChange={(e) => setQrisForm({ ...qrisForm, qrString: e.target.value })} 
                                    placeholder="000201010211..." 
                                    rows={5} 
                                    className="font-mono text-xs !rounded-xl" 
                                    required 
                                />
                                <p className="text-[10px] text-[#475569] mt-2">String ini digunakan untuk menghasilkan QRIS dinamis secara otomatis.</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-[#94a3b8] mb-2">Jumlah Digit Kode Unik</label>
                                <select 
                                    value={qrisForm.uniqueCodeDigits} 
                                    onChange={(e) => setQrisForm({ ...qrisForm, uniqueCodeDigits: parseInt(e.target.value) })}
                                    className="!rounded-xl"
                                >
                                    <option value={2}>2 digit (10 - 99)</option>
                                    <option value={3}>3 digit (100 - 999)</option>
                                    <option value={4}>4 digit (1000 - 9999)</option>
                                </select>
                            </div>
                            <button type="submit" className="btn btn-primary w-full py-4 !rounded-xl" disabled={actionLoading}>
                                {actionLoading ? <span className="spinner" /> : 'Simpan Pengaturan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

