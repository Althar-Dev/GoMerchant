'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SiteSettingsProvider, SiteLogo } from '@/components/SiteSettingsProvider';
import { 
    Zap, 
    ShieldCheck, 
    Code2, 
    Smartphone, 
    Wallet, 
    Check, 
    ArrowRight, 
    Clock, 
    Lock, 
    Server, 
    Globe,
    ChevronRight,
    RefreshCw,
    Terminal,
    Menu,
    X,
    Activity,
    Users,
    TrendingUp,
    CreditCard
} from 'lucide-react';

interface Plan {
    id: string;
    name: string;
    price: number;
    durationDays: number;
    maxRequestsPerDay: number;
}

const FALLBACK_PLANS: Plan[] = [
    { id: 'starter', name: 'Starter Plan', price: 10000, durationDays: 30, maxRequestsPerDay: 100 },
    { id: 'business', name: 'Business Plan', price: 15000, durationDays: 30, maxRequestsPerDay: 1000 },
    { id: 'enterprise', name: 'Enterprise Plan', price: 25000, durationDays: 30, maxRequestsPerDay: -1 },
];

export default function HomePage() {
    const [plans, setPlans] = useState<Plan[]>([]);
    const [loadingPlans, setLoadingPlans] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    useEffect(() => {
        fetch('/api/plans')
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success' && data.data?.length > 0) {
                    setPlans(data.data);
                } else {
                    setPlans(FALLBACK_PLANS);
                }
            })
            .catch(() => { 
                setPlans(FALLBACK_PLANS);
            })
            .finally(() => setLoadingPlans(false));
    }, []);

    const formatRupiah = (n: number) =>
        new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(n);

    return (
        <SiteSettingsProvider>
            <div className="min-h-screen bg-white text-slate-900 selection:bg-blue-100 overflow-x-hidden font-body">
                <div className="fixed inset-0 pointer-events-none z-0">
                    <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px]" />
                    <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-cyan-50/50 rounded-full blur-[100px]" />
                </div>

                <nav className="sticky top-0 z-50 glass-strong border-b border-slate-200/60">
                    <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 md:h-20 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <SiteLogo size="sm" showTitle />
                        </Link>
                        
                        <div className="hidden lg:flex items-center gap-8">
                            <a href="#features" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#619BF3] transition-colors">Fitur</a>
                            <a href="#how-it-works" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#619BF3] transition-colors">Cara Kerja</a>
                            <a href="#pricing" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#619BF3] transition-colors">Harga</a>
                            <Link href="/docs" className="text-xs font-black uppercase tracking-widest text-slate-500 hover:text-[#619BF3] transition-colors">API Docs</Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <Link href="https://dash.pay-gomerch.web.id/signin" className="hidden sm:flex px-4 py-2 text-xs font-black uppercase tracking-widest text-slate-600 hover:text-slate-900 transition-colors">Masuk</Link>
                            <Link href="https://dash.pay-gomerch.web.id/signup" className="btn btn-primary !rounded-xl px-6 !h-10 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-100">Daftar</Link>
                            <button className="lg:hidden p-2 text-slate-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
                                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                            </button>
                        </div>
                    </div>

                    {mobileMenuOpen && (
                        <div className="lg:hidden absolute top-full left-0 right-0 bg-white border-b border-slate-200 p-6 flex flex-col gap-6 animate-in slide-in-from-top duration-300">
                            <a href="#features" className="text-sm font-bold text-slate-600" onClick={() => setMobileMenuOpen(false)}>Fitur</a>
                            <a href="#how-it-works" className="text-sm font-bold text-slate-600" onClick={() => setMobileMenuOpen(false)}>Cara Kerja</a>
                            <a href="#pricing" className="text-sm font-bold text-slate-600" onClick={() => setMobileMenuOpen(false)}>Harga</a>
                            <Link href="/docs" className="text-sm font-bold text-slate-600" onClick={() => setMobileMenuOpen(false)}>API Documentation</Link>
                            <hr className="border-slate-100" />
                            <Link href="/signin" className="btn btn-outline w-full !rounded-xl font-bold uppercase tracking-widest text-xs">Masuk</Link>
                        </div>
                    )}
                </nav>

                <main className="relative z-10">
                    <section className="max-w-7xl mx-auto px-4 md:px-6 pt-12 md:pt-24 pb-20 md:pb-32 flex flex-col items-center text-center">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#619BF3] text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] rounded-full border border-blue-100 mb-8">
                            <Zap className="w-3 h-3" />
                            Gateway Pembayaran QRIS No. 1 di Indonesia
                        </div>
                        
                        <h1 className="text-3xl md:text-6xl lg:text-7xl font-black text-slate-900 tracking-tight leading-[1.1] mb-6 max-w-4xl uppercase">
                            Integrasi Pembayaran <span className="text-[#619BF3]">Otomatis</span> Tanpa Ribet
                        </h1>
                        
                        <p className="text-sm md:text-lg text-slate-500 font-medium leading-relaxed max-w-2xl mb-10 md:mb-12 px-4">
                            Terima pembayaran QRIS langsung ke akun Gopay Merchant Anda. Tanpa potongan per transaksi, 100% dana milik Anda, terintegrasi via API instan.
                        </p>

                        <div className="flex flex-col sm:flex-row items-center gap-4 w-full max-w-md px-4">
                            <Link href="https://dash.pay-gomerch.web.id/signup" className="btn btn-primary w-full sm:flex-1 !h-14 !rounded-xl text-xs md:text-sm font-black uppercase tracking-widest shadow-xl shadow-blue-100">
                                Mulai Sekarang <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                            <Link href="/docs" className="btn btn-outline w-full sm:w-auto !h-14 !rounded-xl px-8 text-xs md:text-sm font-black uppercase tracking-widest bg-white">
                                <Terminal className="w-4 h-4 mr-2" /> API Docs
                            </Link>
                        </div>

                        <div className="mt-16 md:mt-24 grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8 w-full max-w-4xl border-t border-slate-100 pt-12">
                            {[
                                { label: 'Biaya Transaksi', value: 'Rp 0', icon: <Activity className="w-4 h-4" /> },
                                { label: 'Kecepatan API', value: '< 1 Detik', icon: <RefreshCw className="w-4 h-4" /> },
                                { label: 'Uptime Sistem', value: '99.99%', icon: <ShieldCheck className="w-4 h-4" /> },
                                { label: 'Pengguna Aktif', value: '500+', icon: <Users className="w-4 h-4" /> },
                            ].map((stat, i) => (
                                <div key={i} className="text-center p-4 rounded-xl hover:bg-slate-50 transition-colors">
                                    <div className="flex justify-center text-[#619BF3] mb-2">{stat.icon}</div>
                                    <p className="text-lg md:text-2xl font-black text-slate-900 tracking-tight">{stat.value}</p>
                                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">{stat.label}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    <section id="features" className="bg-slate-50/50 py-20 md:py-32 border-y border-slate-100">
                        <div className="max-w-7xl mx-auto px-4 md:px-6">
                            <div className="text-center mb-16 md:mb-20 space-y-4 px-4">
                                <h2 className="text-[10px] font-black text-[#619BF3] uppercase tracking-[0.3em]">Built for Business</h2>
                                <h3 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">Solusi Pembayaran Modern</h3>
                                <p className="text-slate-500 text-sm md:text-base font-medium max-w-xl mx-auto">Dirancang untuk memudahkan pemilik bisnis dan pengembang perangkat lunak dalam mengelola transaksi digital.</p>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                                {[
                                    {
                                        icon: <Smartphone className="w-6 h-6" />,
                                        title: 'Auto-Sync GoPay',
                                        desc: 'Koneksi langsung ke akun Gopay Merchant untuk pengecekan mutasi dana secara otomatis dan instan.'
                                    },
                                    {
                                        icon: <Zap className="w-6 h-6" />,
                                        title: 'QRIS Dinamis',
                                        desc: 'Sistem otomatis menambahkan kode unik pada setiap invoice agar nominal pembayaran presisi.'
                                    },
                                   /* {
                                        icon: <Lock className="w-6 h-6" />,
                                        title: 'Enkripsi AES-256',
                                        desc: 'Seluruh kredensial dan token akun Anda disimpan dengan standar keamanan perbankan internasional.'
                                    },*/
                                    {
                                        icon: <CreditCard className="w-6 h-6" />,
                                        title: 'Dana Cair Instan',
                                        desc: 'Tanpa penahanan dana. Pembayaran dari pelanggan langsung masuk ke saldo merchant Anda tanpa perantara.'
                                    },
                                    {
                                        icon: <Code2 className="w-6 h-6" />,
                                        title: 'Rest API Clean',
                                        desc: 'Dokumentasi API yang sederhana namun lengkap, memudahkan implementasi di bahasa pemrograman apa pun.'
                                    },
                                    {
                                        icon: <Globe className="w-6 h-6" />,
                                        title: 'Dashboard Realtime',
                                        desc: 'Pantau seluruh aktivitas transaksi, statistik harian, dan performa bisnis Anda melalui satu panel kendali.'
                                    }
                                ].map((feature, i) => (
                                    <div key={i} className="bg-white p-6 md:p-8 rounded-2xl border border-slate-200 shadow-sm hover:shadow-lg transition-all group">
                                        <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-[#619BF3] mb-6 group-hover:scale-110 transition-transform">
                                            {feature.icon}
                                        </div>
                                        <h4 className="text-base md:text-lg font-black text-slate-900 mb-3 uppercase tracking-tight">{feature.title}</h4>
                                        <p className="text-slate-500 text-xs md:text-sm leading-relaxed font-medium">{feature.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="py-20 md:py-32">
                        <div className="max-w-7xl mx-auto px-4 md:px-6 grid grid-cols-1 lg:grid-cols-2 gap-12 md:gap-20 items-center">
                            <div className="space-y-8 px-2 text-center lg:text-left">
                                <div className="space-y-4">
                                    <h2 className="text-[10px] font-black text-[#619BF3] uppercase tracking-[0.3em]">Developer First</h2>
                                    <h3 className="text-2xl md:text-4xl font-black text-slate-900 leading-tight uppercase tracking-tight">Integrasi API Dalam 5 Menit</h3>
                                </div>
                                <p className="text-slate-500 text-sm md:text-lg font-medium leading-relaxed">
                                    Kami mengerti waktu developer sangat berharga. Gunakan rute `/order` kami untuk membuat tagihan QRIS instan yang siap dibayar oleh pelanggan Anda.
                                </p>
                                <div className="space-y-4 inline-block text-left w-full max-w-md mx-auto lg:mx-0">
                                    {[
                                        'Format Response JSON Standar',
                                        'Dukungan Penuh SDK JavaScript/PHP/Python',
                                        'Monitoring Status Otomatis',
                                       /* 'Uji Coba SandBox API Tersedia'*/
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-3 text-slate-700 font-bold text-xs md:text-sm">
                                            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                                <Check className="w-3 h-3" />
                                            </div>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                                <div className="pt-4">
                                    <Link href="/docs" className="inline-flex items-center gap-2 text-[#619BF3] font-black uppercase tracking-widest text-[10px] md:text-xs hover:translate-x-2 transition-transform">
                                        Lihat Dokumentasi Lengkap <ChevronRight className="w-4 h-4" />
                                    </Link>
                                </div>
                            </div>

                            <div className="relative px-2">
                                <div className="bg-[#0f172a] rounded-2xl p-1 shadow-2xl relative z-10 border border-slate-800 overflow-hidden">
                                    <div className="flex items-center gap-2 px-4 md:px-6 py-3 md:py-4 border-b border-slate-800 bg-slate-900/50">
                                        <div className="flex gap-1.5">
                                            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                        </div>
                                        <span className="text-[10px] font-mono text-slate-500 ml-4 uppercase tracking-widest">Request Payment</span>
                                    </div>
                                    <div className="p-4 md:p-8 overflow-x-auto">
                                        <pre className="text-blue-300 text-[10px] md:text-xs font-mono leading-relaxed">
                                            <code>{`// POST https://api.pay-gomerch.web.id/order
{
  "apikey": "GO_live_xxxxxxxx",
  "nama_project": "Toko_Saya",
  "amount": 150000,
  "ref_id": "INV-2024-001"
}

// Response:
{
  "status": "success",
  "data": {
    "total_amount": 150012,
    "qr_string": "000201010212...",
    "expires_at": "2024-12-31T23:59:59Z"
  }
}`}</code>
                                        </pre>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    <section id="how-it-works" className="py-20 md:py-32 bg-slate-900 text-white relative">
                        <div className="max-w-7xl mx-auto px-4 md:px-6">
                            <div className="text-center mb-16 md:mb-24">
                                <h2 className="text-[10px] font-black text-[#619BF3] uppercase tracking-[0.3em] mb-4">Step by Step</h2>
                                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tight">Cara Kerja Sistem</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
                                {[
                                    {
                                        step: '01',
                                        title: 'Setup Merchant',
                                        desc: 'Daftar akun dan hubungkan nomor HP Gopay Merchant Anda secara aman di dashboard.'
                                    },
                                    {
                                        step: '02',
                                        title: 'Salin BaseQR',
                                        desc: 'Cukup input QRIS statis sekali saja. Sistem kami akan memodifikasi nominalnya per transaksi.'
                                    },
                                    {
                                        step: '03',
                                        title: 'Integrasi API',
                                        desc: 'Panggil API untuk buat invoice, pelanggan bayar, dan cek status pembayaran secara otomatis.'
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex flex-col items-center text-center group">
                                        <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-xl md:text-2xl font-black text-[#619BF3] mb-6 md:mb-8 group-hover:bg-[#619BF3] group-hover:text-white transition-all duration-300">
                                            {item.step}
                                        </div>
                                        <h4 className="text-lg md:text-xl font-black mb-4 uppercase tracking-tight">{item.title}</h4>
                                        <p className="text-slate-400 text-xs md:text-sm leading-relaxed max-w-xs">{item.desc}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section id="pricing" className="py-20 md:py-32">
                        <div className="max-w-7xl mx-auto px-4 md:px-6">
                            <div className="text-center mb-16 md:mb-20 space-y-4 px-4">
                                <h2 className="text-[10px] font-black text-[#619BF3] uppercase tracking-[0.3em]">Transparent Plan</h2>
                                <h3 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">Pilih Paket Langganan</h3>
                                <p className="text-slate-500 text-sm md:text-base font-medium">Tanpa kontrak jangka panjang, batalkan atau upgrade kapan saja sesuai kebutuhan.</p>
                            </div>

                            {loadingPlans ? (
                                <div className="flex items-center justify-center py-20">
                                    <RefreshCw className="w-10 h-10 text-slate-200 animate-spin" />
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                                    {plans.map((plan, i) => {
                                        const isPopular = i === 1 || plan.name.toLowerCase().includes('business');
                                        return (
                                            <div key={plan.id} className={`bg-white rounded-2xl border p-8 md:p-10 flex flex-col relative transition-all hover:border-[#619BF3] ${isPopular ? 'border-[#619BF3] shadow-2xl shadow-blue-100 ring-4 ring-blue-50' : 'border-slate-200 shadow-sm'}`}>
                                                {isPopular && (
                                                    <div className="absolute top-0 right-8 -translate-y-1/2 bg-[#619BF3] text-white text-[9px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full shadow-lg">
                                                        Best Choice
                                                    </div>
                                                )}
                                                
                                                <div className="mb-8">
                                                    <h4 className="text-slate-400 font-black text-[10px] uppercase tracking-[0.2em] mb-4">{plan.name}</h4>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter">
                                                            {plan.price === 0 ? 'FREE' : formatRupiah(plan.price).replace('Rp', '').trim()}
                                                        </span>
                                                        {plan.price > 0 && <span className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">IDR</span>}
                                                    </div>
                                                    <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-2">Per {plan.durationDays} Hari</p>
                                                </div>

                                                <div className="space-y-4 mb-10 flex-1 pt-8 border-t border-slate-50">
                                                    {[
                                                        `${plan.maxRequestsPerDay === -1 ? 'Unlimited' : plan.maxRequestsPerDay} Request Harian`,
                                                        'Akses Dashboard Penuh',
                                                        'Monitoring Transaksi Realtime',
                                                        'Support Prioritas (Email/WA)'
                                                    ].map((feat, idx) => (
                                                        <div key={idx} className="flex items-center gap-3">
                                                            <div className="w-5 h-5 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center shrink-0">
                                                                <Check className="w-3 h-3" />
                                                            </div>
                                                            <span className="text-xs font-bold text-slate-700">{feat}</span>
                                                        </div>
                                                    ))}
                                                </div>

                                                <Link 
                                                    href="/signup" 
                                                    className={`btn w-full !h-12 !rounded-xl font-black uppercase tracking-widest text-[10px] transition-all ${isPopular ? 'btn-primary shadow-xl shadow-blue-100' : 'btn-outline bg-white'}`}
                                                >
                                                    Pilih Paket
                                                </Link>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="py-20 md:py-32 bg-slate-50/50 border-t border-slate-100">
                        <div className="max-w-4xl mx-auto px-4 md:px-6">
                            <div className="text-center mb-16 md:mb-20">
                                <h3 className="text-2xl md:text-4xl font-black text-slate-900 uppercase tracking-tight">Pertanyaan Populer</h3>
                            </div>

                            <div className="space-y-4">
                                {[
                                    { q: 'Apakah aman memberikan token Gopay?', a: 'Sangat aman. Data token Anda dienkripsi dua kali menggunakan AES-256 dan hanya digunakan secara otomatis oleh server saat melakukan verifikasi pembayaran.' },
                                    { q: 'Kapan dana saya cair ke rekening?', a: 'GomerchPay tidak menahan dana. Dana pelanggan langsung masuk ke saldo Gopay Merchant Anda detik itu juga setelah pembayaran terdeteksi.' },
                                    { q: 'Apakah ada potongan per transaksi?', a: 'Tidak. Kami menggunakan model bisnis berlangganan tetap. Anda bisa melakukan ribuan transaksi sebulan tanpa biaya tambahan apa pun.' },
                                    { q: 'Apakah tersedia bantuan teknis?', a: 'Tentu. Tim support kami siap membantu proses integrasi Anda melalui dokumentasi, email, atau grup WhatsApp khusus member Pro.' }
                                ].map((faq, i) => (
                                    <div key={i} className="bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
                                        <h4 className="text-sm md:text-base font-black text-slate-900 uppercase mb-3 flex items-center gap-3 leading-snug">
                                            <div className="w-1.5 h-1.5 rounded-full bg-[#619BF3] shrink-0" />
                                            {faq.q}
                                        </h4>
                                        <p className="text-slate-500 text-xs md:text-sm font-medium leading-relaxed ml-4.5">{faq.a}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </section>

                    <section className="py-20 md:py-32">
                        <div className="max-w-5xl mx-auto px-4 md:px-6">
                            <div className="bg-[#619BF3] rounded-2xl p-10 md:p-20 text-center relative overflow-hidden shadow-2xl shadow-blue-200">
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
                                <div className="relative z-10">
                                    <h2 className="text-2xl md:text-5xl font-black text-white mb-6 md:mb-8 uppercase tracking-tight">Optimalkan Bisnis Anda Sekarang</h2>
                                    <p className="text-blue-50 text-sm md:text-lg font-bold mb-10 md:mb-12 max-w-xl mx-auto">Gabung bersama ratusan developer yang telah menggunakan GomerchPay untuk kemudahan sistem pembayaran mereka.</p>
                                    <Link href="/signup" className="btn bg-white text-[#619BF3] hover:bg-blue-50 !h-14 md:!h-16 !rounded-xl px-8 md:px-12 text-sm md:text-lg font-black uppercase tracking-widest shadow-xl">
                                        Buat Akun Gratis
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </section>
                </main>

                <footer className="bg-white border-t border-slate-100 py-16 md:py-20 relative z-10">
                    <div className="max-w-7xl mx-auto px-4 md:px-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12 mb-16 md:mb-20">
                            <div className="col-span-1 lg:col-span-2 space-y-8">
                                <Link href="/">
                                    <SiteLogo size="sm" showTitle />
                                </Link>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
                                    Penyedia infrastruktur pembayaran digital otomatis tercepat untuk developer di Indonesia. Aman, handal, dan tanpa biaya tersembunyi.
                                </p>
                                <div className="flex gap-6">
                                    {['Twitter', 'GitHub', 'LinkedIn'].map((social) => (
                                        <button key={social} className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-[#619BF3] transition-colors">
                                            {social}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            
                            <div>
                                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-8">Resources</h5>
                                <ul className="space-y-4">
                                    <li><Link href="#features" className="text-xs font-bold text-slate-500 hover:text-[#619BF3]">Fitur</Link></li>
                                    <li><Link href="/docs" className="text-xs font-bold text-slate-500 hover:text-[#619BF3]">API Documentation</Link></li>
                                    <li><Link href="#pricing" className="text-xs font-bold text-slate-500 hover:text-[#619BF3]">Paket Harga</Link></li>
                                    <li><Link href="/signin" className="text-xs font-bold text-slate-500 hover:text-[#619BF3]">Dashboard</Link></li>
                                </ul>
                            </div>

                            <div>
                                <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-[0.3em] mb-8">Security</h5>
                                <ul className="space-y-4">
                                    <li><Link href="/terms" className="text-xs font-bold text-slate-500 hover:text-[#619BF3]">Terms of Service</Link></li>
                                    <li><Link href="/privacy" className="text-xs font-bold text-slate-500 hover:text-[#619BF3]">Privacy Policy</Link></li>
                                    <li><Link href="/integrity" className="text-xs font-bold text-slate-500 hover:text-[#619BF3]">Integrity Page</Link></li>
                                    <li><Link href="/support" className="text-xs font-bold text-slate-500 hover:text-[#619BF3]">Support Center</Link></li>
                                </ul>
                            </div>
                        </div>

                        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-12 border-t border-slate-50">
                            <div className="flex flex-col items-center md:items-start gap-2">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-center md:text-left">
                                    &copy; {new Date().getFullYear()} GomerchPay API. All rights reserved.
                                </p>
                                <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.1em]">
                                    Build with 💙 by AltharDev
                                </p>
                            </div>
                            <div className="flex items-center gap-6">
                                <span className="flex items-center gap-2 text-[10px] font-black text-emerald-500 uppercase tracking-widest">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    Systems Normal
                                </span>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Stable Release</span>
                            </div>
                        </div>
                    </div>
                </footer>
            </div>
        </SiteSettingsProvider>
    );
}

