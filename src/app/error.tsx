'use client';

import { useEffect } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error('Runtime Error:', error);
    }, [error]);

    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
            <div className="relative z-10 max-w-md w-full space-y-8 animate-slide-up">
                <div className="space-y-4">
                    <div className="w-20 h-20 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <AlertTriangle className="w-10 h-10 text-rose-500" />
                    </div>
                    <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight">Terjadi Kesalahan Sistem</h1>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Mohon maaf, sistem mengalami kendala teknis yang tidak terduga. Tim kami telah menerima laporan ini secara otomatis.
                    </p>
                    {error.digest && (
                        <div className="bg-slate-100 rounded-lg py-2 px-4 inline-block">
                            <code className="text-[10px] font-mono text-slate-400">Error ID: {error.digest}</code>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 pt-4">
                    <button
                        onClick={() => reset()}
                        className="btn btn-primary w-full !rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100"
                    >
                        <RefreshCw className="w-4 h-4 mr-2" /> Coba Lagi Sekarang
                    </button>
                    <Link href="/" className="btn btn-outline w-full !rounded-xl font-black uppercase tracking-widest text-[10px] bg-white">
                        <Home className="w-4 h-4 mr-2" /> Kembali ke Beranda
                    </Link>
                </div>

                <div className="pt-8">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                        Build with 💙 by AltharDev
                    </p>
                </div>
            </div>
        </div>
    );
}

