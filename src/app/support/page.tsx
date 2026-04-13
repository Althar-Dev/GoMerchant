'use client';

import Link from 'next/link';
import { SiteSettingsProvider, SiteLogo } from '@/components/SiteSettingsProvider';
import { 
    HelpCircle, 
    MessageCircle, 
    Mail, 
    FileText, 
    ArrowLeft, 
    ChevronRight, 
    Search,
    BookOpen,
    LifeBuoy,
    ExternalLink
} from 'lucide-react';

export default function SupportCenterPage() {
    const faqs = [
        {
            q: "Bagaimana cara menghubungkan akun GoPay Merchant?",
            a: "Anda dapat menghubungkan akun di Dashboard melalui menu 'Connect Merchant' dengan memasukkan nomor HP yang terdaftar di aplikasi GoPay Merchant dan melakukan verifikasi OTP."
        },
        {
            q: "Apakah ada biaya bulanan?",
            a: "Kami menawarkan paket Gratis untuk uji coba dan paket Berlangganan (Subscription) dengan kuota harian yang lebih besar untuk kebutuhan bisnis Anda."
        },
        {
            q: "Mengapa pembayaran tidak terdeteksi?",
            a: "Pastikan pelanggan mentransfer nominal yang tepat (termasuk kode unik) dan pastikan akun GoPay Merchant Anda sedang dalam status aktif/terkoneksi di dashboard kami."
        },
        {
            q: "Apakah saya bisa ganti API Key?",
            a: "Bisa. Anda dapat melakukan regenerasi API Key kapan saja melalui menu Pengaturan, namun pastikan untuk memperbarui konfigurasi di aplikasi Anda segera."
        }
    ];

    return (
        <SiteSettingsProvider>
            <div className="min-h-screen bg-[#f8fafc] font-body selection:bg-blue-100">
                {/* SEO Metadata */}
                <title>Pusat Bantuan & Bantuan Teknis | GomerchPay</title>
                <meta name="description" content="Temukan jawaban atas pertanyaan Anda mengenai integrasi API GoPay Merchant, konfigurasi QRIS, dan kendala teknis lainnya di pusat bantuan GomerchPay." />

                {/* Navbar */}
                <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <SiteLogo size="sm" showTitle />
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/docs" className="text-slate-500 text-sm font-bold hover:text-slate-900 transition-colors">Docs</Link>
                            <Link href="/signin" className="btn btn-primary !h-10 px-6 !rounded-xl text-[10px] font-black uppercase tracking-widest">Dashboard</Link>
                        </div>
                    </div>
                </nav>

                <main className="max-w-5xl mx-auto px-6 py-16 md:py-24 space-y-20">
                    {/* Hero Section */}
                    <div className="text-center space-y-8 max-w-3xl mx-auto">
                        <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 rounded-full text-[10px] font-black uppercase tracking-[0.2em] text-[#619BF3] border border-blue-100">
                            <LifeBuoy className="w-3 h-3" /> Support Center
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tight uppercase">Apa yang bisa kami bantu?</h1>
                        <div className="relative group max-w-xl mx-auto">
                            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-[#619BF3] transition-colors" />
                            <input 
                                type="text" 
                                placeholder="Cari bantuan atau pertanyaan..." 
                                className="w-full pl-14 pr-6 py-5 rounded-2xl border-slate-200 shadow-sm focus:shadow-xl focus:shadow-blue-100/50 transition-all text-sm font-medium"
                            />
                        </div>
                    </div>

                    {/* Quick Channels */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Link href="/docs" className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:border-[#619BF3] hover:shadow-lg transition-all group">
                            <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center text-[#619BF3] mb-6 group-hover:scale-110 transition-transform">
                                <BookOpen className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Dokumentasi API</h3>
                            <p className="text-slate-500 text-xs leading-relaxed font-medium mb-4">Panduan teknis lengkap integrasi gateway untuk developer.</p>
                            <span className="text-[10px] font-black text-[#619BF3] uppercase tracking-widest flex items-center gap-1">Pelajari <ChevronRight className="w-3 h-3" /></span>
                        </Link>

                        <a href="https://wa.me/6288976577650" target="_blank" rel="noopener noreferrer" className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:border-[#34d399] hover:shadow-lg transition-all group">
                            <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-500 mb-6 group-hover:scale-110 transition-transform">
                                <MessageCircle className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">WhatsApp Support</h3>
                            <p className="text-slate-500 text-xs leading-relaxed font-medium mb-4">Konsultasi cepat untuk kendala teknis atau paket Pro.</p>
                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-1">Hubungi <ExternalLink className="w-3 h-3" /></span>
                        </a>

                        <div className="bg-white border border-slate-200 p-8 rounded-2xl shadow-sm hover:border-purple-400 hover:shadow-lg transition-all group">
                            <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                                <Mail className="w-6 h-6" />
                            </div>
                            <h3 className="text-lg font-black text-slate-900 uppercase tracking-tight mb-2">Email Business</h3>
                            <p className="text-slate-500 text-xs leading-relaxed font-medium mb-4">Untuk pengaduan, kerjasama, atau laporan keamanan.</p>
                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest">support@pay-gomerch.web.id</span>
                        </div>
                    </div>

                    {/* FAQ Section */}
                    <div className="space-y-10">
                        <div className="text-center md:text-left">
                            <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.3em] flex items-center justify-center md:justify-start gap-3">
                                <HelpCircle className="w-5 h-5 text-[#619BF3]" /> Pertanyaan Populer
                            </h2>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {faqs.map((faq, i) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-3">
                                    <h4 className="text-sm font-black text-slate-900 uppercase leading-snug">{faq.q}</h4>
                                    <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed">{faq.a}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Footer Contact */}
                    <div className="bg-blue-50 border border-blue-100 rounded-3xl p-8 md:p-12 text-center space-y-6">
                        <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Tidak menemukan jawaban?</h2>
                        <p className="text-slate-600 text-sm md:text-base font-medium max-w-xl mx-auto">
                            Tim bantuan kami siap membantu Anda setiap hari kerja pukul 09:00 - 17:00 WIB. Jangan ragu untuk menghubungi kami.
                        </p>
                        <div className="flex justify-center">
                            <Link href="/signin" className="btn btn-primary px-10 !h-14 !rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl shadow-blue-100">
                                Buka Tiket Bantuan
                            </Link>
                        </div>
                    </div>

                    <div className="text-center pt-8 border-t border-slate-200">
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} GomerchPay Support Center - Here to Help.
                        </p>
                    </div>
                </main>
            </div>
        </SiteSettingsProvider>
    );
}
