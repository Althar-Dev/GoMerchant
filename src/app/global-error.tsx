'use client';

import { AlertCircle, RefreshCw } from 'lucide-react';

export default function GlobalError({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    return (
        <html lang="id">
            <body className="antialiased selection:bg-blue-100">
                <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center text-white">
                    <div className="max-w-md w-full space-y-8">
                        <div className="w-24 h-24 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse">
                            <AlertCircle className="w-12 h-12 text-[#619BF3]" />
                        </div>
                        
                        <div className="space-y-4">
                            <h1 className="text-3xl font-black uppercase tracking-tighter">Critical Error</h1>
                            <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                Terjadi kesalahan fatal pada struktur utama aplikasi. Kami menyarankan untuk melakukan refresh total pada browser Anda.
                            </p>
                        </div>

                        <button
                            onClick={() => reset()}
                            className="bg-[#619BF3] hover:bg-[#4a86e8] text-white px-8 py-4 rounded-xl font-black uppercase tracking-widest text-[10px] transition-all shadow-xl shadow-blue-500/20"
                        >
                            <RefreshCw className="w-4 h-4 mr-2 inline" /> Refresh Aplikasi
                        </button>

                        <div className="pt-12">
                            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.2em]">
                                Build with 💙 by AltharDev
                            </p>
                        </div>
                    </div>
                </div>
            </body>
        </html>
    );
}

