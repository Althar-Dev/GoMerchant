'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { SiteSettingsProvider, SiteLogo } from '@/components/SiteSettingsProvider';
import { 
    RefreshCw, 
    Rocket, 
    Terminal, 
    ShieldCheck, 
    Database, 
    Copy, 
    Check, 
    ChevronDown, 
    ChevronUp, 
    ArrowRight, 
    Info, 
    Lock,
    Send,
    Code2
} from 'lucide-react';

interface Endpoint {
    method: 'POST';
    label: string;
    path: string;
    description: string;
    params: Record<string, { type: string; req: boolean; desc: string }>;
    requestBody: string;
    responseBody: string;
    curlExample: string;
}

const getEndpoints = (apiBase: string): Endpoint[] => [
    {
        method: 'POST',
        label: 'USER PROFILE',
        path: '/profile',
        description: 'Mengambil informasi profil, paket langganan, dan sisa kuota harian Anda.',
        params: {
            apikey: { type: 'string', req: true, desc: 'API Key unik Anda.' },
        },
        requestBody: JSON.stringify({ apikey: "GO_your_api_key_here" }, null, 4),
        responseBody: JSON.stringify({
            status: "Success",
            data: {
                name: "John Doe",
                email: "user@example.com",
                role: "USER",
                plan: "Starter Plan",
                usage: 5,
                limit: 100
            }
        }, null, 4),
        curlExample: `curl -X POST ${apiBase}/profile \\
  -H "Content-Type: application/json" \\
  -d '{
    "apikey": "GO_your_api_key_here"
  }'`
    },
    {
        method: 'POST',
        label: 'CREATE ORDER',
        path: '/order',
        description: 'Membuat transaksi QRIS dinamis baru dengan nominal unik dan modifikasi string otomatis.',
        params: {
            apikey: { type: 'string', req: true, desc: 'API Key unik Anda.' },
            nama_project: { type: 'string', req: true, desc: 'Nama/Alias merchant yang terdaftar di dashboard.' },
            ref_id: { type: 'string', req: true, desc: 'ID referensi unik dari sistem Anda (Invoice ID).' },
            amount: { type: 'number', req: true, desc: 'Nominal dasar pembayaran (tanpa kode unik).' },
            customer_name: { type: 'string', req: false, desc: 'Nama pelanggan (opsional).' },
            expired: { type: 'number', req: false, desc: 'Masa berlaku dalam menit (default: 15).' },
        },
        requestBody: JSON.stringify({
            apikey: "GO_your_api_key_here",
            nama_project: "Toko Utama",
            ref_id: "INV-1001",
            amount: 50000,
            customer_name: "Budi",
            expired: 15
        }, null, 4),
        responseBody: JSON.stringify({
            status: "success",
            code: 200,
            message: "Transaksi berhasil dibuat",
            data: {
                trx_id: "TRX250209001",
                ref_id: "INV-1001",
                amount: 50000,
                unique_code: 12,
                total_amount: 50012,
                payment_status: "pending",
                expires_at: "2025-02-09T18:00:00Z",
                payment_detail: {
                    qr_string: "00020101021226...",
                    qr_image: "https://quickchart.io/qr?text=..."
                }
            }
        }, null, 4),
        curlExample: `curl -X POST ${apiBase}/order \\
  -H "Content-Type: application/json" \\
  -d '{
    "apikey": "GO_your_api_key_here",
    "nama_project": "Toko Utama",
    "ref_id": "INV-1001",
    "amount": 50000
  }'`
    },
    {
        method: 'POST',
        label: 'CHECK STATUS',
        path: '/status',
        description: 'Memeriksa status pembayaran. Sistem akan melakukan pengecekan mutasi aktif ke merchant jika status masih pending.',
        params: {
            apikey: { type: 'string', req: true, desc: 'API Key unik Anda.' },
            ref_id: { type: 'string', req: true, desc: 'ID referensi transaksi Anda.' },
        },
        requestBody: JSON.stringify({
            apikey: "GO_your_api_key_here",
            ref_id: "INV-1001"
        }, null, 4),
        responseBody: JSON.stringify({
            status: "success",
            code: 200,
            message: "Pembayaran berhasil dideteksi",
            data: {
                trx_id: "TRX250209001",
                ref_id: "INV-1001",
                amount: 50000,
                total_amount: 50012,
                payment_status: "paid",
                paid_at: "2025-02-09T17:45:21Z"
            }
        }, null, 4),
        curlExample: `curl -X POST ${apiBase}/status \\
  -H "Content-Type: application/json" \\
  -d '{
    "apikey": "GO_your_api_key_here",
    "ref_id": "INV-1001"
  }'`
    },
];

function CodeBlock({ code, label, color = "blue", icon: Icon }: { code: string, label: string, color?: "blue" | "emerald" | "slate", icon?: any }) {
    const [copied, setCopied] = useState(false);
    
    const handleCopy = () => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const colorClasses: Record<string, string> = {
        emerald: "text-emerald-300 border-emerald-500/20",
        blue: "text-blue-300 border-blue-500/20",
        slate: "text-slate-300 border-slate-500/20"
    };

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between px-1">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5">
                    {Icon && <Icon className="w-3 h-3" />}
                    {label}
                </span>
                <button onClick={handleCopy} className="text-[10px] font-bold text-[#619BF3] hover:opacity-70 transition flex items-center gap-1">
                    {copied ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                </button>
            </div>
            <div className={`bg-[#0f172a] rounded-xl overflow-hidden border ${colorClasses[color]} shadow-inner`}>
                <pre className={`p-5 ${colorClasses[color].split(' ')[0]} text-xs font-mono overflow-x-auto leading-relaxed scrollbar-thin`}>
                    <code>{code}</code>
                </pre>
            </div>
        </div>
    );
}

function AccordionItem({ ep, isOpen, onClick }: { ep: Endpoint, isOpen: boolean, onClick: () => void }) {
    return (
        <div className={`bg-white border transition-all rounded-xl overflow-hidden ${isOpen ? 'border-[#619BF3] shadow-md' : 'border-slate-200 shadow-sm'}`}>
            <button
                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
                onClick={onClick}
            >
                <div className="flex items-center gap-4">
                    <span className={`text-[10px] font-black px-2.5 py-1 rounded-md uppercase tracking-wider border ${isOpen ? 'bg-[#619BF3] text-white border-transparent' : 'bg-slate-50 text-slate-400 border-slate-100'}`}>
                        {ep.method}
                    </span>
                    <code className="text-slate-900 font-mono text-sm font-bold">{ep.path}</code>
                </div>
                {isOpen ? <ChevronUp className="w-5 h-5 text-slate-300" /> : <ChevronDown className="w-5 h-5 text-slate-300" />}
            </button>

            {isOpen && (
                <div className="px-6 pb-8 space-y-8 animate-slide-up border-t border-slate-50 pt-6">
                    <p className="text-slate-600 text-sm font-medium">{ep.description}</p>

                    <div className="space-y-6">
                        {/* Params */}
                        <div className="space-y-3">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                <Code2 className="w-3.5 h-3.5" /> Parameters
                            </h4>
                            <div className="border border-slate-100 rounded-xl overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs text-left">
                                        <thead className="bg-slate-50 text-slate-400 border-b border-slate-100">
                                            <tr>
                                                <th className="px-4 py-3 font-black uppercase">Key</th>
                                                <th className="px-4 py-3 font-black uppercase">Type</th>
                                                <th className="px-4 py-3 font-black uppercase">Description</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {Object.entries(ep.params).map(([key, info]) => (
                                                <tr key={key} className="hover:bg-slate-50/30 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <code className="font-mono font-bold text-[#619BF3]">{key}</code>
                                                        {info.req && <span className="ml-2 text-[9px] text-rose-400 font-bold uppercase">Required</span>}
                                                    </td>
                                                    <td className="px-4 py-3 text-slate-400 font-medium uppercase tracking-tighter">{info.type}</td>
                                                    <td className="px-4 py-3 text-slate-500 leading-normal">{info.desc}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </div>

                        {/* cURL Example */}
                        <CodeBlock code={ep.curlExample} label="Example cURL" color="slate" icon={Terminal} />

                        {/* Request & Response */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <CodeBlock code={ep.requestBody} label="Request Body" color="blue" icon={Send} />
                            <CodeBlock code={ep.responseBody} label="Response Preview" color="emerald" icon={Database} />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function PublicDocsPage() {
    const [openIdx, setOpenIdx] = useState<number | null>(0);
    const [apiBase, setApiBase] = useState('https://api.pay-gomerch.web.id');

    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hostname = window.location.hostname;
            if (hostname.includes('localhost') || hostname.includes('cloudworkstations.dev')) {
                setApiBase(window.location.origin);
            } else {
                setApiBase('https://api.pay-gomerch.web.id');
            }
        }
    }, []);

    const endpoints = getEndpoints(apiBase);

    return (
        <SiteSettingsProvider>
            <div className="min-h-screen bg-[#f8fafc] selection:bg-blue-100 font-body">
                {/* SEO: Page Title for crawlers */}
                <title>Dokumentasi API Pembayaran QRIS | GomerchPay</title>
                <meta name="description" content="Pelajari cara mengintegrasikan gateway pembayaran QRIS otomatis ke dalam aplikasi Anda dengan API GomerchPay yang sederhana dan cepat." />

                {/* Navbar */}
                <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-slate-200">
                    <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
                        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
                            <SiteLogo size="sm" showTitle />
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link href="/signin" className="text-slate-500 text-sm font-bold hover:text-slate-900 transition-colors">Masuk</Link>
                            <Link href="/signup" className="btn btn-primary px-6 !h-10 !rounded-xl !text-xs font-black uppercase tracking-widest shadow-sm">Daftar</Link>
                        </div>
                    </div>
                </nav>

                <main className="max-w-4xl mx-auto px-6 py-16 md:py-24 space-y-16">
                    {/* Hero */}
                    <div className="space-y-6 text-center md:text-left">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-50 text-[#619BF3] text-[10px] font-black uppercase tracking-[0.2em] rounded-lg border border-blue-100">
                            <Terminal className="w-3 h-3" />
                            API Documentation v1.0.0
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight uppercase">Dokumentasi API</h1>
                        <p className="text-lg text-slate-500 font-medium leading-relaxed max-w-2xl">
                            Integrasikan pembayaran QRIS otomatis ke dalam aplikasi Anda hanya dengan beberapa baris kode. Cepat, aman, dan tanpa biaya per transaksi.
                        </p>
                    </div>

                    {/* Quick Start Steps */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            { step: '1', title: 'Ambil API Key', desc: 'Daftar dan dapatkan kunci unik di menu Pengaturan.' },
                            { step: '2', title: 'Setup BaseQR', desc: 'Input QRIS statis Gopay Merchant Anda di dashboard.' },
                            { step: '3', title: 'Panggil API', desc: 'Gunakan endpoint di bawah untuk membuat transaksi.' },
                        ].map((item) => (
                            <div key={item.step} className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm">
                                <span className="w-8 h-8 rounded-lg bg-blue-50 text-[#619BF3] flex items-center justify-center text-xs font-black mb-4 border border-blue-100">{item.step}</span>
                                <h3 className="text-sm font-black text-slate-900 uppercase tracking-widest mb-2">{item.title}</h3>
                                <p className="text-slate-500 text-xs leading-relaxed font-medium">{item.desc}</p>
                            </div>
                        ))}
                    </div>

                    {/* Auth & Base URL */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-slate-900 rounded-xl p-5 flex items-center justify-between overflow-hidden border border-slate-800 shadow-lg">
                            <div className="min-w-0">
                                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Base Endpoint</p>
                                <code className="text-[#619BF3] font-mono text-xs truncate block">{apiBase}</code>
                            </div>
                            <button onClick={() => { navigator.clipboard.writeText(apiBase); alert('URL copied!'); }} className="p-2 text-slate-500 hover:text-white transition">
                                <Copy className="w-4 h-4" />
                            </button>
                        </div>
                        <div className="bg-white border border-slate-200 rounded-xl p-5 flex items-center gap-4 shadow-sm">
                            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center border border-emerald-100">
                                <Lock className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Authentication</p>
                                <p className="text-xs font-bold text-slate-700 uppercase tracking-tight">apikey (Body JSON)</p>
                            </div>
                        </div>
                    </div>

                    {/* Endpoints */}
                    <div className="space-y-6">
                        <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] px-2 flex items-center gap-3">
                            <Terminal className="w-4 h-4 text-[#619BF3]" /> API Reference
                        </h2>
                        <div className="space-y-4">
                            {endpoints.map((ep, i) => (
                                <AccordionItem 
                                    key={i} 
                                    ep={ep} 
                                    isOpen={openIdx === i} 
                                    onClick={() => setOpenIdx(openIdx === i ? null : i)} 
                                />
                            ))}
                        </div>
                    </div>

                </main>

                <footer className="border-t border-slate-200 py-16 bg-white">
                    <div className="max-w-6xl mx-auto px-6 flex flex-col items-center gap-8">
                        <SiteLogo size={24} showTitle />
                        <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">
                            <Link href="/" className="hover:text-[#619BF3] transition-colors">Beranda</Link>
                            <Link href="/docs" className="hover:text-[#619BF3] transition-colors">Dokumentasi</Link>
                            <Link href="/terms" className="hover:text-[#619BF3] transition-colors">Terms</Link>
                            <Link href="/privacy" className="hover:text-[#619BF3] transition-colors">Privacy</Link>
                        </div>
                        <p className="text-slate-300 text-[10px] font-bold uppercase tracking-widest">
                            &copy; {new Date().getFullYear()} GomerchPay. Seluruh hak cipta dilindungi.
                        </p>
                    </div>
                </footer>
            </div>
        </SiteSettingsProvider>
    );
}


