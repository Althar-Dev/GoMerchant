'use client';

import { useState, useEffect } from 'react';
import { 
    RefreshCw, 
    Rocket, 
    Database, 
    ShieldCheck, 
    Terminal, 
    Copy, 
    Check, 
    ChevronDown, 
    ChevronUp, 
    Link as LinkIcon, 
    Info, 
    AlertCircle,
    Server,
    Code2,
    Lock,
    Globe,
    Send
} from 'lucide-react';

interface Endpoint {
    method: string;
    path: string;
    description: string;
    body: Record<string, { desc: string; type: string; required: boolean }>;
    exampleRequest: string;
    response: string;
    curlExample: string;
}

const getEndpoints = (apiBase: string): Endpoint[] => [
    {
        method: 'POST',
        path: '/profile',
        description: 'Ambil data profil, paket langganan, dan penggunaan kuota harian Anda.',
        body: {
            apikey: { desc: 'Kunci autentikasi unik Anda.', type: 'string', required: true },
        },
        exampleRequest: JSON.stringify({
            apikey: "GO_your_api_key_here"
        }, null, 4),
        response: JSON.stringify({
            status: "Success",
            data: {
                name: "John Doe",
                email: "user@example.com",
                role: "USER",
                plan: "Business Plan",
                usage: 45,
                limit: 1000
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
        path: '/order',
        description: 'Buat transaksi QRIS dinamis. Sistem otomatis menambahkan kode unik dan memodifikasi QRIS statis Anda menjadi dinamis.',
        body: {
            apikey: { desc: 'Kunci autentikasi unik Anda.', type: 'string', required: true },
            nama_project: { desc: 'Nama/Alias Merchant (GoPay/OrderKuota).', type: 'string', required: true },
            ref_id: { desc: 'ID referensi unik dari sistem Anda.', type: 'string', required: true },
            amount: { desc: 'Nominal dasar (angka saja).', type: 'number', required: true },
            customer_name: { desc: 'Nama pelanggan (opsional).', type: 'string', required: false },
            expired: { desc: 'Masa berlaku menit (default: 15).', type: 'number', required: false },
        },
        exampleRequest: JSON.stringify({
            apikey: "GO_your_api_key_here",
            nama_project: "Toko Utama",
            ref_id: "INV-2024001",
            amount: 50000,
            customer_name: "Budi Santoso",
            expired: 15
        }, null, 4),
        response: JSON.stringify({
            status: "success",
            code: 200,
            message: "Transaksi berhasil dibuat",
            data: {
                trx_id: "TRX250209001",
                ref_id: "INV-2024001",
                amount: 50000,
                unique_code: 12,
                total_amount: 50012,
                payment_type: "qris",
                payment_status: "pending",
                expires_at: "2025-02-09T18:00:00.000Z",
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
    "ref_id": "INV-2024001",
    "amount": 50000
  }'`
    },
    {
        method: 'POST',
        path: '/status',
        description: 'Cek status pembayaran. Jika pending, server otomatis cek mutasi real-time ke akun Gopay Merchant Anda.',
        body: {
            apikey: { desc: 'Kunci autentikasi unik Anda.', type: 'string', required: true },
            ref_id: { desc: 'ID referensi transaksi Anda.', type: 'string', required: true },
        },
        exampleRequest: JSON.stringify({
            apikey: "GO_your_api_key_here",
            ref_id: "INV-2024001"
        }, null, 4),
        response: JSON.stringify({
            status: "success",
            code: 200,
            message: "Pembayaran berhasil dideteksi",
            data: {
                trx_id: "TRX250209001",
                ref_id: "INV-2024001",
                amount: 50000,
                total_amount: 50012,
                payment_status: "paid",
                paid_at: "2025-02-09T17:45:21.000Z"
            }
        }, null, 4),
        curlExample: `curl -X POST ${apiBase}/status \\
  -H "Content-Type: application/json" \\
  -d '{
    "apikey": "GO_your_api_key_here",
    "ref_id": "INV-2024001"
  }'`
    },
];

export default function DocsPage() {
    const [apiBase, setApiBase] = useState('https://api.pay-gomerch.web.id');
    const [openEndpoint, setOpenEndpoint] = useState<number | null>(0);
    const [copiedIdx, setCopiedIdx] = useState<{i: number, type: string} | null>(null);

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

    const copyToClipboard = (text: string, index: number, type: string) => {
        navigator.clipboard.writeText(text);
        setCopiedIdx({i: index, type});
        setTimeout(() => setCopiedIdx(null), 2000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8 animate-slide-up pb-20">
            {/* Simple Header */}
            <div className="space-y-2 px-2">
                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Dokumentasi API</h1>
                <p className="text-slate-500 text-sm">Integrasikan gateway pembayaran QRIS otomatis ke sistem Anda.</p>
            </div>

            {/* Quick Steps */}
            <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-6 border-b border-slate-50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2">
                        <Rocket className="w-3.5 h-3.5" /> Langkah Memulai
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-[#619BF3] text-[10px] font-black flex items-center justify-center shrink-0 border border-blue-100">1</span>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Ambil API Key</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Dapatkan di menu Pengaturan.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-[#619BF3] text-[10px] font-black flex items-center justify-center shrink-0 border border-blue-100">2</span>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Hubungkan Merchant</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Input BaseQR di Dashboard.</p>
                        </div>
                    </div>
                    <div className="flex gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-50 text-[#619BF3] text-[10px] font-black flex items-center justify-center shrink-0 border border-blue-100">3</span>
                        <div>
                            <p className="text-xs font-bold text-slate-900">Integrasi API</p>
                            <p className="text-[11px] text-slate-500 mt-0.5">Gunakan endpoint di bawah.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Base Config Bar */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 rounded-xl p-4 flex items-center justify-between overflow-hidden border border-slate-800 shadow-sm">
                    <div className="min-w-0">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Base Endpoint</p>
                        <code className="text-[#619BF3] font-mono text-xs truncate block">{apiBase}</code>
                    </div>
                    <button onClick={() => { navigator.clipboard.writeText(apiBase); alert('Base URL copied!'); }} className="p-2 text-slate-500 hover:text-white transition">
                        <Copy className="w-4 h-4" />
                    </button>
                </div>
                <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center gap-4 shadow-sm">
                    <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center border border-emerald-100">
                        <Lock className="w-4 h-4 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Autentikasi</p>
                        <p className="text-xs font-bold text-slate-700">apikey (Body JSON)</p>
                    </div>
                </div>
            </div>

            {/* Endpoints Reference */}
            <div className="space-y-4">
                <h2 className="text-sm font-black text-slate-900 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                    <Terminal className="w-4 h-4" /> API Reference
                </h2>

                {endpoints.map((ep, i) => {
                    const isOpen = openEndpoint === i;
                    return (
                        <div key={i} className={`bg-white border transition-all rounded-xl overflow-hidden ${isOpen ? 'border-[#619BF3] shadow-md' : 'border-slate-200 shadow-sm'}`}>
                            <button 
                                onClick={() => setOpenEndpoint(isOpen ? null : i)}
                                className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50/50 transition-colors"
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

                                    <div className="space-y-8">
                                        {/* Params Table */}
                                        <div className="space-y-3">
                                            <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                <Code2 className="w-3.5 h-3.5" /> Parameters
                                            </h3>
                                            <div className="border border-slate-100 rounded-xl overflow-x-auto bg-slate-50/50">
                                                <table className="w-full text-xs">
                                                    <thead>
                                                        <tr className="border-b border-slate-100 text-slate-400">
                                                            <th className="px-4 py-3 text-left font-black uppercase">Key</th>
                                                            <th className="px-4 py-3 text-left font-black uppercase">Details</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-slate-100 bg-white">
                                                        {Object.entries(ep.body).map(([key, info]) => (
                                                            <tr key={key}>
                                                                <td className="px-4 py-3">
                                                                    <code className="font-mono font-bold text-[#619BF3]">{key}</code>
                                                                    <div className="flex items-center gap-2 mt-1">
                                                                        <span className="text-[9px] text-slate-300 font-bold uppercase">{info.type}</span>
                                                                        {info.required && <span className="text-[9px] text-rose-400 font-bold uppercase">Required</span>}
                                                                    </div>
                                                                </td>
                                                                <td className="px-4 py-3 text-slate-500 leading-normal">{info.desc}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>

                                        {/* Example cURL */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Terminal className="w-3.5 h-3.5" /> Example cURL
                                                </h3>
                                                <button
                                                    onClick={() => copyToClipboard(ep.curlExample, i, 'curl')}
                                                    className="text-[9px] text-[#619BF3] font-black uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition"
                                                >
                                                    {copiedIdx?.i === i && copiedIdx.type === 'curl' ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy cURL</>}
                                                </button>
                                            </div>
                                            <div className="bg-[#0f172a] rounded-xl overflow-hidden shadow-sm">
                                                <div className="px-4 py-2 bg-slate-800/50 flex items-center justify-between border-b border-slate-700/50">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">shell / bash</span>
                                                </div>
                                                <pre className="p-5 text-slate-300 text-xs font-mono overflow-x-auto leading-relaxed scrollbar-thin">
                                                    {ep.curlExample}
                                                </pre>
                                            </div>
                                        </div>

                                        {/* Example Request */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Send className="w-3.5 h-3.5" /> Example Request Body
                                                </h3>
                                                <button
                                                    onClick={() => copyToClipboard(ep.exampleRequest, i, 'req')}
                                                    className="text-[9px] text-[#619BF3] font-black uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition"
                                                >
                                                    {copiedIdx?.i === i && copiedIdx.type === 'req' ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy JSON</>}
                                                </button>
                                            </div>
                                            <div className="bg-[#0f172a] rounded-xl overflow-hidden shadow-sm">
                                                <div className="px-4 py-2 bg-slate-800/50 flex items-center justify-between border-b border-slate-700/50">
                                                    <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest">application/json</span>
                                                </div>
                                                <pre className="p-5 text-blue-300 text-xs font-mono overflow-x-auto leading-relaxed scrollbar-thin">
                                                    {ep.exampleRequest}
                                                </pre>
                                            </div>
                                        </div>

                                        {/* Response Preview */}
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                                                    <Database className="w-3.5 h-3.5" /> Example Response
                                                </h3>
                                                <button
                                                    onClick={() => copyToClipboard(ep.response, i, 'res')}
                                                    className="text-[9px] text-[#619BF3] font-black uppercase tracking-widest flex items-center gap-1.5 hover:opacity-70 transition"
                                                >
                                                    {copiedIdx?.i === i && copiedIdx.type === 'res' ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy JSON</>}
                                                </button>
                                            </div>
                                            <div className="bg-[#0f172a] rounded-xl overflow-hidden shadow-sm">
                                                <div className="px-4 py-2 bg-slate-800/50 flex items-center justify-between border-b border-slate-700/50">
                                                    <span className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">200 OK</span>
                                                </div>
                                                <pre className="p-5 text-emerald-300/80 text-xs font-mono overflow-x-auto leading-relaxed scrollbar-thin">
                                                    {ep.response}
                                                </pre>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Error Reference Table */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                <div className="p-5 border-b border-slate-200 bg-white">
                    <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 text-rose-500" /> Error Codes Reference
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-[11px] border-collapse">
                        <thead>
                            <tr className="bg-slate-100/50 border-b border-slate-200 text-slate-400">
                                <th className="px-6 py-3 text-left font-black uppercase w-20">Code</th>
                                <th className="px-6 py-3 text-left font-black uppercase">Message</th>
                                <th className="px-6 py-3 text-left font-black uppercase hidden sm:table-cell">Reason</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {[
                                { c: '400', m: 'Bad Request', r: 'Parameter tidak lengkap atau format JSON salah.' },
                                { c: '401', m: 'Unauthorized', r: 'API Key salah atau tidak ditemukan.' },
                                { c: '403', m: 'Forbidden', r: 'Kuota harian habis atau paket expired.' },
                                { c: '404', m: 'Not Found', r: 'Merchant atau Transaksi tidak ada.' },
                                { c: '409', m: 'Conflict', r: 'ref_id sudah pernah digunakan.' },
                            ].map((err) => (
                                <tr key={err.c} className="hover:bg-white transition-colors">
                                    <td className="px-6 py-3 font-mono font-black text-rose-500">{err.c}</td>
                                    <td className="px-6 py-3 font-bold text-slate-700">{err.m}</td>
                                    <td className="px-6 py-3 text-slate-500 hidden sm:table-cell">{err.r}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
