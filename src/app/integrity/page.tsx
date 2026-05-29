'use client';

import Link from 'next/link';
import { SiteSettingsProvider, SiteLogo } from '@/components/SiteSettingsProvider';
import { 
    ShieldCheck, 
    Lock, 
    Database, 
    Eye, 
    Zap, 
    ArrowLeft, 
    ShieldAlert,
    CheckCircle2,
    Server,
    Fingerprint
} from 'lucide-react';

export default function IntegrityPage() {
    return (
        <SiteSettingsProvider>
            <div className="min-h-screen bg-[#f8fafc] font-body selection:bg-blue-100">
                {/* SEO Metadata */}
                <title>Keamanan & Integritas Sistem | GomerchPay</title>
                <meta name="description" content="Pelajari komitmen GomerchPay dalam menjaga keamanan data, transparansi transaksi, dan privasi akun GoPay Merchant Anda dengan standar enkripsi militer." />

                {/* Navbar */}
                <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <SiteLogo size="sm" showTitle />
                        </Link>
                        <Link href="/signin" className="text-slate-500 text-sm font-bold hover:text-slate-900 transition-colors">Masuk</Link>
                    </div>
                </nav>

                <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-16">
                    {/* Header */}
                    <div className="space-y-6 text-center md:text-left">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#619BF3] text-[10px] font-black uppercase tracking-widest transition-colors mb-4">
                            <ArrowLeft className="w-3 h-3" /> Kembali ke Beranda
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">Platform Integrity</h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
                            Komitmen kami dalam menjaga keamanan, transparansi, dan kepercayaan setiap transaksi yang diproses melalui infrastruktur GomerchPay.
                        </p>
                    </div>

                    {/* Core Principles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-4 hover:border-[#619BF3]/30 transition-all group">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#619BF3] group-hover:scale-110 transition-transform">
                                <Fingerprint className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Enkripsi End-to-End</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Seluruh kredensial API dan token merchant Anda dienkripsi menggunakan protokol **AES-256-GCM**. Kunci enkripsi dipisahkan secara fisik dari database untuk mencegah akses yang tidak sah.
                            </p>
                        </div>

                        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-4 hover:border-[#619BF3]/30 transition-all group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                                <Zap className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Fund Neutrality</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                GomerchPay **tidak pernah menyentuh atau menampung dana** transaksi Anda. Dana dari pelanggan langsung masuk ke saldo akun GoPay Merchant Anda secara *real-time* tanpa perantara.
                            </p>
                        </div>

                        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-4 hover:border-[#619BF3]/30 transition-all group">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 group-hover:scale-110 transition-transform">
                                <Server className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Zero-Interference API</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Infrastruktur kami dirancang hanya untuk membaca mutasi dan menghasilkan QRIS dinamis. Kami tidak memiliki fungsi teknis untuk melakukan penarikan dana (*payout*) atau manipulasi saldo di akun Anda.
                            </p>
                        </div>

                        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm space-y-4 hover:border-[#619BF3]/30 transition-all group">
                            <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform">
                                <Eye className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight">Transparansi Log</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">
                                Setiap permintaan API dan aktivitas sinkronisasi dicatat secara mendetail di dashboard Anda. Anda memiliki kendali penuh untuk memantau kapan dan bagaimana sistem kami berinteraksi dengan akun Anda.
                            </p>
                        </div>
                    </div>

                    {/* Security Alert Section */}
                    <div className="bg-slate-900 rounded-3xl p-8 md:p-12 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-12 opacity-10">
                            <ShieldCheck className="w-40 h-40" />
                        </div>
                        <div className="relative z-10 max-w-2xl space-y-6">
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-[#619BF3]">
                                <ShieldAlert className="w-3 h-3" /> Security Compliance
                            </div>
                            <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight">Bagaimana Kami Menjaga Integritas Platform?</h2>
                            <p className="text-slate-400 text-sm md:text-base leading-relaxed font-medium">
                                Kami melakukan audit keamanan berkala dan memantau upaya peretasan secara *real-time*. Jika sistem mendeteksi aktivitas mencurigakan pada API Key Anda, sistem akan secara otomatis melakukan suspensi sementara demi melindungi akun Anda.
                            </p>
                            <div className="pt-4 flex flex-wrap gap-4">
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-[#619BF3]" /> Monitoring 24/7
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-[#619BF3]" /> Auto-Revoke API Key
                                </div>
                                <div className="flex items-center gap-2 text-xs font-bold">
                                    <CheckCircle2 className="w-4 h-4 text-[#619BF3]" /> Multi-Factor Auth
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer Attribution */}
                    <div className="pt-12 border-t border-slate-200 text-center space-y-4">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} GomerchPay Integrity & Compliance Team.
                        </p>
                    </div>
                </main>
            </div>
        </SiteSettingsProvider>
    );
}

