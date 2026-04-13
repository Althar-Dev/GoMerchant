'use client';

import { useState, useEffect } from 'react';
import { useUserContext } from '../layout';
import { useFirestore, updateDocumentNonBlocking } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { RefreshCw, User, Key, Copy, Eye, EyeOff, ShieldCheck, AlertCircle, X, Info, ShieldAlert } from 'lucide-react';

export default function SettingsPage() {
    const { user } = useUserContext();
    const firestore = useFirestore();

    const [profileForm, setProfileForm] = useState({ displayName: '', telegramId: '' });
    const [profileLoading, setProfileLoading] = useState(false);
    const [keyLoading, setKeyLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });
    const [showApiKey, setShowApiKey] = useState(false);
    const [showRegenModal, setShowRegenModal] = useState(false);

    useEffect(() => {
        if (user) {
            setProfileForm({
                displayName: user.displayName || '',
                telegramId: user.telegramId || '',
            });
        }
    }, [user]);

    const handleProfileUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !firestore) return;
        setProfileLoading(true);
        try {
            const userRef = doc(firestore, 'users', user.id);
            updateDocumentNonBlocking(userRef, {
                displayName: profileForm.displayName,
                telegramId: profileForm.telegramId,
                updatedAt: serverTimestamp()
            });
            setMsg({ type: 'success', text: 'Profil berhasil diperbarui' });
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch {
            setMsg({ type: 'error', text: 'Gagal memperbarui profil' });
        } finally {
            setProfileLoading(false);
        }
    };

    const handleRegenKey = async () => {
        if (!user || !firestore) return;
        
        setKeyLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let newKey = 'GO_';
            const randomLength = Math.floor(Math.random() * 11) + 10;
            for (let i = 0; i < randomLength; i++) {
                newKey += chars.charAt(Math.floor(Math.random() * chars.length));
            }

            const userRef = doc(firestore, 'users', user.id);
            updateDocumentNonBlocking(userRef, {
                apiKey: newKey,
                updatedAt: serverTimestamp()
            });
            
            setMsg({ type: 'success', text: 'API Key baru berhasil dibuat!' });
            setShowRegenModal(false);
            setTimeout(() => setMsg({ type: '', text: '' }), 3000);
        } catch (err) {
            console.error('Regen key error:', err);
            setMsg({ type: 'error', text: 'Gagal merubah API Key' });
        } finally {
            setKeyLoading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        setMsg({ type: 'success', text: 'Berhasil disalin!' });
        setTimeout(() => setMsg({ type: '', text: '' }), 2000);
    };

    return (
        <div className="space-y-8 animate-slide-up w-full max-w-4xl mx-auto pb-12">
            <div className="border-b border-slate-100 pb-6 px-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan</h1>
                <p className="text-slate-500 text-sm font-medium mt-1">Kelola data profil, keamanan, dan akses API Anda.</p>
            </div>

            {msg.text && (
                <div className={`${msg.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'} border px-5 py-4 rounded-xl text-sm font-black flex items-center gap-3 animate-slide-up shadow-sm mx-2`}>
                    {msg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <ShieldCheck className="w-5 h-5" />}
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 px-2">
                {/* API Access Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <Key className="w-4 h-4 text-[#619BF3]" />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Akses API</h2>
                    </div>
                    
                    <div className="space-y-6">
                        <p className="text-slate-400 text-[11px] font-medium leading-relaxed">
                            Gunakan kunci ini untuk mengautentikasi setiap permintaan API Anda ke server kami.
                        </p>
                        
                        <div className="space-y-3">
                            <div className="flex items-center gap-2">
                                <div className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-3 font-mono text-xs min-w-0 overflow-hidden">
                                    <span className="text-slate-600 block truncate font-bold">
                                        {showApiKey ? user?.apiKey : '••••••••••••••••••••••••••••••••'}
                                    </span>
                                </div>
                                <div className="flex gap-1.5">
                                    <button 
                                        onClick={() => setShowApiKey(!showApiKey)} 
                                        className="p-3 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-sm"
                                        title={showApiKey ? "Sembunyikan" : "Tampilkan"}
                                    >
                                        {showApiKey ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                                    </button>
                                    <button 
                                        onClick={() => copyToClipboard(user?.apiKey || '')} 
                                        className="p-3 rounded-xl bg-[#619BF3] hover:bg-[#4a86e8] transition-all shadow-md shadow-blue-100"
                                        title="Salin API Key"
                                    >
                                        <Copy className="w-4 h-4 text-white" />
                                    </button>
                                </div>
                            </div>
                            
                            <button 
                                onClick={() => setShowRegenModal(true)} 
                                className="text-[10px] text-slate-400 hover:text-rose-500 font-black uppercase tracking-widest transition-colors flex items-center gap-2 ml-1"
                            >
                                <RefreshCw className="w-3 h-3" /> 
                                Ganti API Key Baru
                            </button>
                        </div>
                    </div>
                </div>

                {/* Profile Information Card */}
                <div className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm h-fit">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center">
                            <User className="w-4 h-4 text-[#619BF3]" />
                        </div>
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Informasi Profil</h2>
                    </div>

                    <form onSubmit={handleProfileUpdate} className="space-y-5">
                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Alamat Email</label>
                                <input 
                                    type="email" 
                                    value={user?.email || ''} 
                                    disabled 
                                    className="!bg-slate-50 !border-slate-100 !text-slate-400 !cursor-not-allowed !rounded-xl !text-sm font-bold" 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Nama Lengkap</label>
                                <input 
                                    type="text" 
                                    value={profileForm.displayName} 
                                    onChange={(e) => setProfileForm({ ...profileForm, displayName: e.target.value })} 
                                    className="!rounded-xl !text-sm border-slate-200 font-bold" 
                                    placeholder="John Doe" 
                                    required 
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Telegram ID (Numerik)</label>
                                <input 
                                    type="text" 
                                    value={profileForm.telegramId} 
                                    onChange={(e) => setProfileForm({ ...profileForm, telegramId: e.target.value.replace(/\D/g, '') })} 
                                    className="!rounded-xl !text-sm border-slate-200 font-mono font-bold" 
                                    placeholder="Contoh: 123456789" 
                                    required 
                                />
                                <p className="text-[9px] text-slate-400 mt-1 ml-1">Numeric ID dari @userinfobot</p>
                            </div>
                        </div>
                        
                        <button 
                            type="submit" 
                            disabled={profileLoading}
                            className="btn btn-primary w-full !rounded-xl py-4 font-black uppercase tracking-widest text-xs mt-2 shadow-lg shadow-blue-100"
                        >
                            {profileLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                            Simpan Perubahan
                        </button>
                    </form>
                </div>
            </div>

            {/* Modal Konfirmasi Regenerate API Key */}
            {showRegenModal && (
                <div className="modal-overlay" onClick={() => !keyLoading && setShowRegenModal(false)}>
                    <div className="modal-content max-w-md !p-0 !rounded-2xl overflow-hidden border-none shadow-2xl" onClick={e => e.stopPropagation()}>
                        <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                            <h2 className="text-lg font-black text-slate-900 uppercase tracking-tight">Ganti API Key</h2>
                            <button onClick={() => setShowRegenModal(false)} className="p-2 rounded-xl hover:bg-slate-50 transition">
                                <X className="w-5 h-5 text-slate-300" />
                            </button>
                        </div>
                        <div className="p-8 space-y-6">
                            <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto">
                                <ShieldAlert className="w-8 h-8 text-rose-500" />
                            </div>
                            
                            <div className="text-center space-y-2">
                                <h3 className="text-base font-bold text-slate-900">Apakah Anda Yakin?</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    API Key lama Anda akan **dinonaktifkan segera**. Pastikan Anda mengupdate konfigurasi di aplikasi Anda setelah mengganti kunci ini.
                                </p>
                            </div>

                            <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3">
                                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                                <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
                                    Tindakan ini tidak dapat dibatalkan.
                                </p>
                            </div>

                            <div className="flex gap-3">
                                <button 
                                    onClick={() => setShowRegenModal(false)} 
                                    className="btn btn-outline flex-1 !rounded-xl font-bold uppercase tracking-widest text-[10px]"
                                    disabled={keyLoading}
                                >
                                    Batal
                                </button>
                                <button 
                                    onClick={handleRegenKey} 
                                    className="btn bg-rose-500 hover:bg-rose-600 text-white flex-1 !rounded-xl font-bold uppercase tracking-widest text-[10px] shadow-lg shadow-rose-100"
                                    disabled={keyLoading}
                                >
                                    {keyLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : null}
                                    Ya, Ganti Baru
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
