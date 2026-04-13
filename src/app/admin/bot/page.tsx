
'use client';

import { useState, useEffect, useRef } from 'react';
import { useFirestore, useDoc, useCollection, useMemoFirebase, setDocumentNonBlocking, useUser } from '@/firebase';
import { doc, serverTimestamp, collection, query, orderBy, limit } from 'firebase/firestore';
import { 
    RefreshCw, 
    MessageSquare, 
    Save, 
    Zap, 
    AlertCircle, 
    CheckCircle2, 
    Terminal as TerminalIcon,
    Smartphone,
    Trash2
} from 'lucide-react';

interface BotSettings {
    botToken: string;
    botUsername?: string;
    webhookUrl?: string;
    isActive?: boolean;
}

interface BotLog {
    id: string;
    message: string;
    type: 'info' | 'error' | 'success';
    timestamp: any;
}

export default function MasterBotPage() {
    const { user: authUser } = useUser();
    const firestore = useFirestore();
    const terminalRef = useRef<HTMLDivElement>(null);
    
    const botSettingsRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return doc(firestore, 'settings', 'bot');
    }, [firestore]);

    const { data: botSettings, isLoading: loading } = useDoc<BotSettings>(botSettingsRef);

    const logsQuery = useMemoFirebase(() => {
        if (!firestore) return null;
        return query(collection(firestore, 'bot_logs'), orderBy('timestamp', 'desc'), limit(50));
    }, [firestore]);
    const { data: logs } = useCollection<BotLog>(logsQuery);

    const [form, setForm] = useState({ botToken: '' });
    const [actionLoading, setActionLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    useEffect(() => {
        if (botSettings) {
            setForm({ botToken: botSettings.botToken || '' });
        }
    }, [botSettings]);

    useEffect(() => {
        if (terminalRef.current) {
            terminalRef.current.scrollTop = 0;
        }
    }, [logs]);

    const handleSaveToken = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!botSettingsRef) return;
        
        setActionLoading(true);
        setMsg({ type: '', text: '' });

        try {
            setDocumentNonBlocking(botSettingsRef, {
                botToken: form.botToken,
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            setMsg({ type: 'success', text: 'Token Bot berhasil disimpan!' });
        } catch (err) {
            setMsg({ type: 'error', text: 'Gagal menyimpan token.' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSetWebhook = async () => {
        if (!form.botToken) {
            setMsg({ type: 'error', text: 'Simpan Bot Token terlebih dahulu.' });
            return;
        }

        setActionLoading(true);
        setMsg({ type: '', text: '' });

        try {
            const res = await fetch('/bot/setup', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'x-user-id': authUser?.uid || '' 
                },
                body: JSON.stringify({ botToken: form.botToken })
            });
            
            const data = await res.json();

            if (data.status === 'success') {
                if (botSettingsRef) {
                    setDocumentNonBlocking(botSettingsRef, {
                        webhookUrl: data.webhookUrl,
                        updatedAt: serverTimestamp()
                    }, { merge: true });
                }
                setMsg({ type: 'success', text: data.message });
            } else {
                setMsg({ type: 'error', text: data.message || 'Gagal memasang webhook.' });
            }
        } catch (err) {
            setMsg({ type: 'error', text: 'Terjadi kesalahan jaringan saat menghubungi server bot.' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return <div className="flex items-center justify-center h-64"><RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" /></div>;
    }

    return (
        <div className="space-y-8 animate-slide-up max-w-5xl mx-auto pb-20">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Master Bot Control</h1>
                    <p className="text-slate-500 text-sm font-medium mt-1">Konfigurasi dan pantau aktivitas Bot Telegram secara real-time.</p>
                </div>
                <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${botSettings?.webhookUrl ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {botSettings?.webhookUrl ? 'Webhook Active' : 'Webhook Not Set'}
                    </span>
                </div>
            </div>

            {msg.text && (
                <div className={`${msg.type === 'error' ? 'bg-rose-50 border-rose-100 text-rose-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'} border px-5 py-4 rounded-xl text-sm font-bold flex items-center gap-3 animate-slide-up shadow-sm`}>
                    {msg.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                    {msg.text}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-5 space-y-6">
                    <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
                        <div className="flex items-center gap-3 mb-8">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center">
                                <Smartphone className="w-5 h-5 text-[#619BF3]" />
                            </div>
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-widest">Bot Credentials</h2>
                        </div>

                        <form onSubmit={handleSaveToken} className="space-y-6">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Telegram Bot Token</label>
                                <input 
                                    type="text" 
                                    value={form.botToken}
                                    onChange={e => setForm({ ...form, botToken: e.target.value })}
                                    placeholder="123456789:ABC..."
                                    className="!rounded-xl border-slate-200 font-mono text-sm bg-slate-50 focus:bg-white transition-colors p-4"
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-3 pt-2">
                                <button 
                                    type="submit" 
                                    disabled={actionLoading}
                                    className="btn btn-primary w-full !rounded-xl py-4 font-black uppercase tracking-widest text-[10px] shadow-xl shadow-blue-100"
                                >
                                    {actionLoading ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                                    Simpan Token
                                </button>
                                <button 
                                    type="button"
                                    onClick={handleSetWebhook}
                                    disabled={actionLoading || !form.botToken}
                                    className="btn btn-outline w-full !rounded-xl py-4 font-black uppercase tracking-widest text-[10px] border-emerald-100 text-emerald-600 hover:bg-emerald-50"
                                >
                                    <Zap className="w-4 h-4 mr-2" />
                                    Set Webhook Otomatis
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <div className="bg-slate-900 rounded-2xl overflow-hidden shadow-2xl flex flex-col h-[500px]">
                        <div className="px-6 py-4 bg-slate-800 border-b border-slate-700 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <TerminalIcon className="w-4 h-4 text-[#619BF3]" />
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Live Bot Terminal</span>
                            </div>
                            <div className="flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-rose-500/20 border border-rose-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-amber-500/20 border border-amber-500/50" />
                                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/20 border border-emerald-500/50" />
                            </div>
                        </div>
                        
                        <div 
                            ref={terminalRef}
                            className="flex-1 overflow-y-auto p-6 font-mono text-[11px] leading-relaxed scrollbar-thin scrollbar-thumb-slate-700"
                        >
                            {!logs || logs.length === 0 ? (
                                <p className="text-slate-600 animate-pulse">Menunggu aktivitas bot...</p>
                            ) : (
                                <div className="space-y-2">
                                    {logs.map((log) => (
                                        <div key={log.id} className="flex gap-3 group">
                                            <span className="text-slate-600 shrink-0">
                                                [{new Date(log.timestamp?.seconds * 1000 || Date.now()).toLocaleTimeString()}]
                                            </span>
                                            <span className={
                                                log.type === 'error' ? 'text-rose-400' : 
                                                log.type === 'success' ? 'text-emerald-400' : 
                                                'text-blue-300'
                                            }>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
