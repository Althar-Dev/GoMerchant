'use client';

import Link from 'next/link';
import { SiteSettingsProvider, SiteLogo } from '@/components/SiteSettingsProvider';
import { 
    ShieldCheck, 
    FileText, 
    Scale, 
    AlertCircle, 
    ArrowLeft, 
    Gavel, 
    UserCheck, 
    CreditCard, 
    Ban, 
    X,
    Info,
    ShieldAlert
} from 'lucide-react';

export default function TermsPage() {
    return (
        <SiteSettingsProvider>
            <div className="min-h-screen bg-[#f8fafc] font-body selection:bg-blue-100">
                {/* Simple Navbar */}
                <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <SiteLogo size="sm" showTitle />
                        </Link>
                        <Link href="/signin" className="text-slate-500 text-sm font-bold hover:text-slate-900 transition-colors">Masuk</Link>
                    </div>
                </nav>

                <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-12">
                    <div className="space-y-4">
                        <Link href="/" className="inline-flex items-center gap-2 text-slate-400 hover:text-[#619BF3] text-[10px] font-black uppercase tracking-widest transition-colors mb-4">
                            <ArrowLeft className="w-3 h-3" /> Kembali ke Beranda
                        </Link>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">Ketentuan Layanan</h1>
                        <p className="text-slate-500 text-sm font-medium">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>

                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-6 md:p-8 flex gap-4 shadow-sm">
                        <Info className="w-6 h-6 text-[#619BF3] shrink-0" />
                        <p className="text-blue-800 text-sm leading-relaxed font-medium">
                            Harap baca Syarat dan Ketentuan ini secara saksama sebelum menggunakan platform GomerchPay. Dengan mengakses atau menggunakan layanan kami, Anda dianggap telah memahami dan menyetujui seluruh ketentuan yang tertulis di bawah ini.
                        </p>
                    </div>

                    <div className="space-y-12 pb-20">
                        {/* Section 1 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <Scale className="w-5 h-5" />
                                <h2 className="text-xl font-black uppercase tracking-tight">1. Definisi & Ruang Lingkup</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    GomerchPay ("Kami", "Platform") adalah penyedia infrastruktur teknologi yang memungkinkan pengguna ("Anda", "Merchant", "Developer") untuk mengotomatisasi pengecekan mutasi pembayaran QRIS melalui integrasi pihak ketiga (GoPay Merchant).
                                </p>
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Kami bertindak sebagai **jembatan teknis** dan tidak memiliki kendali atas dana yang ditransfer oleh pelanggan Anda. Seluruh transaksi finansial terjadi di dalam ekosistem resmi penyedia layanan pembayaran terkait.
                                </p>
                            </div>
                        </section>

                        {/* Section 2 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <UserCheck className="w-5 h-5" />
                                <h2 className="text-xl font-black uppercase tracking-tight">2. Kewajiban Pengguna</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                                <ul className="space-y-4">
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#619BF3] mt-1.5 shrink-0" />
                                        <p className="text-slate-600 text-sm">Anda wajib memberikan informasi data diri yang akurat, valid, dan dapat dipertanggungjawabkan saat melakukan registrasi.</p>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#619BF3] mt-1.5 shrink-0" />
                                        <p className="text-slate-600 text-sm">Anda bertanggung jawab penuh atas kerahasiaan API Key dan data login akun Anda. Segala penyalahgunaan akses yang disebabkan oleh kelalaian Anda adalah tanggung jawab Anda pribadi.</p>
                                    </li>
                                    <li className="flex gap-3">
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#619BF3] mt-1.5 shrink-0" />
                                        <p className="text-slate-600 text-sm">Anda dilarang menggunakan platform ini untuk kegiatan ilegal, termasuk namun tidak terbatas pada penipuan, pencucian uang, atau aktivitas perjudian.</p>
                                    </li>
                                </ul>
                            </div>
                        </section>

                        {/* Section 3 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <Ban className="w-5 h-5" />
                                <h2 className="text-xl font-black uppercase tracking-tight">3. Penyangkalan Tanggung Jawab Aktivitas Ilegal</h2>
                            </div>
                            <div className="bg-rose-50/50 border border-rose-100 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                                <p className="text-slate-700 text-sm leading-relaxed font-bold">
                                    GomerchPay tidak ikut campur dan tidak bertanggung jawab dalam hal apa pun jika pengguna menggunakan layanan untuk aktivitas ilegal, termasuk:
                                </p>
                                <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3">
                                    {[
                                        'Jika akun Anda diblokir atau ditutup oleh GoPay karena pelanggaran.',
                                        'Jika Anda terkena tindakan hukum, penyelidikan polisi, atau proses pengadilan.',
                                        'Jika Anda menghadapi sanksi administratif atau pidana.',
                                        'Jika ada kerugian finansial akibat pemblokiran akun atau tindakan hukum.',
                                        'Jika ada tuntutan dari pihak ketiga terkait aktivitas Anda.'
                                    ].map((item, i) => (
                                        <li key={i} className="flex items-start gap-3 text-slate-600 text-xs">
                                            <X className="w-4 h-4 text-rose-500 mt-0.5 shrink-0" /> 
                                            <span>{item}</span>
                                        </li>
                                    ))}
                                </ul>
                                <div className="p-5 bg-white border border-rose-200 rounded-xl shadow-sm">
                                    <div className="flex gap-3">
                                        <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
                                        <p className="text-slate-800 text-xs font-black leading-relaxed uppercase tracking-tight">
                                            Anda bertanggung jawab penuh atas segala konsekuensi hukum dari penggunaan layanan ini. GomerchPay hanya menyediakan tools teknologi dan TIDAK terlibat dalam aktivitas bisnis Anda.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 4 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <CreditCard className="w-5 h-5" />
                                <h2 className="text-xl font-black uppercase tracking-tight">4. Langganan & Pembayaran</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-4">
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Layanan GomerchPay menggunakan model berlangganan (Subscription). Setiap paket memiliki kuota request harian dan masa aktif yang berbeda-beda.
                                </p>
                                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
                                    <p className="text-slate-700 text-xs font-bold uppercase tracking-widest mb-2">Kebijakan Pengembalian Dana (Refund):</p>
                                    <p className="text-slate-500 text-xs leading-relaxed font-medium">
                                        Seluruh pembayaran yang telah dilakukan bersifat **final dan tidak dapat dibatalkan atau dikembalikan**. Kami sangat menyarankan Anda mencoba Paket Gratis terlebih dahulu sebelum memutuskan untuk upgrade.
                                    </p>
                                </div>
                            </div>
                        </section>

                        {/* Section 5 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <AlertCircle className="w-5 h-5" />
                                <h2 className="text-xl font-black uppercase tracking-tight">5. Batasan Tanggung Jawab Utama</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
                                <p className="text-slate-600 text-sm leading-relaxed font-medium">
                                    Dalam keadaan apa pun, GomerchPay (termasuk pemilik, pengembang, dan staf) dibebaskan dari segala bentuk tanggung jawab atas:
                                </p>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {[
                                        { 
                                            title: 'Status Akun GoPay', 
                                            desc: 'Pemblokiran, penangguhan, atau penutupan akun merchant GoPay Anda oleh pihak penyedia layanan.' 
                                        },
                                        { 
                                            title: 'Perselisihan Transaksi', 
                                            desc: 'Segala bentuk perselisihan atau klaim antara Anda dan pelanggan terkait pembayaran atau produk.' 
                                        },
                                        { 
                                            title: 'Downtime Layanan', 
                                            desc: 'Ketidaktersediaan sementara layanan GoPay, gangguan API, atau pemeliharaan sistem pihak ketiga.' 
                                        },
                                        { 
                                            title: 'Integritas Data', 
                                            desc: 'Kehilangan data transaksi, riwayat pembayaran, atau kesalahan teknis akibat kegagalan sistem luar.' 
                                        },
                                        { 
                                            title: 'Dampak Finansial', 
                                            desc: 'Kerugian finansial baik langsung maupun tidak langsung yang timbul dari penggunaan atau ketidakmampuan menggunakan layanan.' 
                                        },
                                        { 
                                            title: 'Konsekuensi Hukum', 
                                            desc: 'Segala bentuk tindakan hukum, penyelidikan otoritas, atau sanksi yang Anda hadapi terkait operasional bisnis Anda.' 
                                        },
                                    ].map((item, i) => (
                                        <div key={i} className="p-5 border border-slate-100 rounded-xl bg-slate-50/50 hover:bg-white hover:border-[#619BF3]/20 transition-all group">
                                            <p className="text-slate-900 text-xs font-black mb-2 uppercase tracking-wide group-hover:text-[#619BF3]">{item.title}</p>
                                            <p className="text-slate-500 text-[11px] leading-relaxed font-medium">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </section>

                        {/* Section 6 */}
                        <section className="space-y-4">
                            <div className="flex items-center gap-3 text-[#619BF3]">
                                <Gavel className="w-5 h-5" />
                                <h2 className="text-xl font-black uppercase tracking-tight">6. Perubahan Ketentuan</h2>
                            </div>
                            <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 shadow-sm">
                                <p className="text-slate-600 text-sm leading-relaxed">
                                    Kami berhak untuk mengubah atau mengganti Ketentuan Layanan ini kapan saja tanpa pemberitahuan sebelumnya. Penggunaan layanan yang berkelanjutan setelah perubahan tersebut dianggap sebagai persetujuan Anda terhadap syarat-syarat baru.
                                </p>
                            </div>
                        </section>
                    </div>

                    <div className="pt-12 border-t border-slate-200 flex flex-col items-center gap-6">
                        <div className="flex gap-8">
                            <Link href="/privacy" className="text-[10px] font-black text-slate-400 hover:text-[#619BF3] uppercase tracking-widest transition-colors">Privacy Policy</Link>
                            <Link href="/docs" className="text-[10px] font-black text-slate-400 hover:text-[#619BF3] uppercase tracking-widest transition-colors">API Documentation</Link>
                        </div>
                        <p className="text-slate-300 text-[10px] text-center font-bold uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} GomerchPay. Secured & Legal Protected.
                        </p>
                    </div>
                </main>
            </div>
        </SiteSettingsProvider>
    );
}

