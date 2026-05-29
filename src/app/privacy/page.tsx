
'use client';

import Link from 'next/link';
import { SiteSettingsProvider, SiteLogo } from '@/components/SiteSettingsProvider';
import { Lock, Eye, Database, Share2, ArrowLeft } from 'lucide-react';

export default function PrivacyPage() {
    return (
        <SiteSettingsProvider>
            <div className="min-h-screen bg-[#f8fafc] font-body selection:bg-blue-100">
                {/* Simple Navbar */}
                <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <SiteLogo size="sm" showTitle />
                        </Link>
                        <Link href="/login" className="text-slate-500 text-sm font-bold hover:text-slate-900 transition-colors">Masuk</Link>
                    </div>
                </nav>

                <main className="max-w-3xl mx-auto px-6 py-16 md:py-24 space-y-12">
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#619BF3] text-xs font-bold uppercase tracking-widest transition-colors mb-4">
                            <ArrowLeft className="w-3 h-3" /> Kembali ke Beranda
                        </Link>
                        <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase">Kebijakan Privasi</h1>
                        <p className="text-slate-500 text-sm font-medium">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="prose prose-slate max-w-none space-y-10">
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <Database className="w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight m-0">1. Informasi yang Kami Kumpulkan</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4 shadow-sm">
                                <p className="text-slate-600 text-sm leading-relaxed m-0">Kami mengumpulkan data yang minimal namun diperlukan untuk menjalankan layanan:</p>
                                <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm m-0">
                                    <li><strong>Informasi Profil:</strong> Email, Nama Lengkap, dan Telegram ID.</li>
                                    <li><strong>Kredensial Merchant:</strong> Access Token dan Refresh Token dari akun Gopay Merchant Anda.</li>
                                    <li><strong>Data Transaksi:</strong> Riwayat pembayaran yang dilakukan melalui gateway kami untuk keperluan dashboard.</li>
                                </ul>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <Lock className="w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight m-0">2. Bagaimana Kami Melindungi Data</h2>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Privasi Anda adalah prioritas utama kami. Seluruh kredensial sensitif (Token API pihak ketiga) disimpan menggunakan enkripsi tingkat tinggi (AES-256-GCM) di sisi server. Data tersebut hanya dapat didekripsi oleh sistem saat melakukan sinkronisasi mutasi otomatis dan tidak dapat diakses secara langsung oleh staf kami dalam format teks biasa.
                            </p>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <Eye className="w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight m-0">3. Penggunaan Data</h2>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Data Anda hanya digunakan untuk:
                            </p>
                            <ul className="list-disc pl-5 space-y-2 text-slate-600 text-sm">
                                <li>Memverifikasi pembayaran QRIS secara otomatis.</li>
                                <li>Mengirimkan notifikasi via Telegram atau Dashboard.</li>
                                <li>Memantau penggunaan kuota API harian Anda.</li>
                            </ul>
                        </section>

                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <Share2 className="w-5 h-5" />
                                <h2 className="text-lg font-black uppercase tracking-tight m-0">4. Berbagi Data dengan Pihak Ketiga</h2>
                            </div>
                            <p className="text-slate-600 leading-relaxed text-sm">
                                Kami tidak menjual, memperdagangkan, atau menyewakan informasi pribadi Anda kepada orang lain. Kami hanya meneruskan data teknis yang diperlukan ke API resmi Gopay Merchant untuk menjalankan fungsi inti layanan kami sesuai instruksi Anda.
                            </p>
                        </section>

                        <section className="bg-blue-50 border border-blue-100 rounded-xl p-6">
                            <h3 className="text-[#619BF3] font-black uppercase tracking-widest text-xs mb-2">Persetujuan</h3>
                            <p className="text-blue-700/80 text-xs leading-relaxed font-medium m-0">
                                Dengan menggunakan layanan GomerchPay API, Anda dengan ini menyetujui kebijakan privasi kami dan menyetujui ketentuannya.
                            </p>
                        </section>
                    </div>

                    <div className="pt-12 border-t border-slate-200">
                        <p className="text-slate-400 text-xs text-center font-bold uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} GomerchPay API - Secured & Encrypted.
                        </p>
                    </div>
                </main>
            </div>
        </SiteSettingsProvider>
    );
}


