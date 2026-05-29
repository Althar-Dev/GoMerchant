'use client';

import Link from 'next/link';
import { Home, ArrowLeft, Search } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#f8fafc] flex flex-col items-center justify-center p-6 text-center">
            <div className="fixed inset-0 pointer-events-none z-0">
                <div className="absolute top-[-5%] right-[-5%] w-[40%] h-[40%] bg-blue-50/50 rounded-full blur-[100px]" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[40%] h-[40%] bg-cyan-50/50 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-md w-full space-y-8 animate-slide-up">
                <div className="space-y-4">
                    <div className="w-24 h-24 bg-white border border-slate-200 rounded-3xl shadow-xl shadow-blue-100/50 flex items-center justify-center mx-auto mb-8 rotate-12 hover:rotate-0 transition-transform duration-500">
                        <Search className="w-10 h-10 text-[#619BF3]" />
                    </div>
                    <h1 className="text-8xl font-black text-slate-900 tracking-tighter">404</h1>
                    <h2 className="text-xl font-bold text-slate-800 uppercase tracking-widest">Halaman Tidak Ditemukan</h2>
                    <p className="text-slate-500 font-medium leading-relaxed">
                        Sepertinya halaman yang Anda cari telah dipindahkan atau tidak pernah ada. Mari kembali ke jalan yang benar.
                    </p>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                    <Link href="/" className="btn btn-primary flex-1 !rounded-xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-blue-100">
                        <Home className="w-4 h-4 mr-2" /> Ke Beranda
                    </Link>
                    <button 
                        onClick={() => window.history.back()} 
                        className="btn btn-outline flex-1 !rounded-xl font-black uppercase tracking-widest text-[10px] bg-white"
                    >
                        <ArrowLeft className="w-4 h-4 mr-2" /> Kembali
                    </button>
                </div>

                <div className="pt-12 border-t border-slate-100">
                    <p className="text-[9px] font-bold text-slate-300 uppercase tracking-[0.2em]">
                        Build with 💙 by AltharDev
                    </p>
                </div>
            </div>
        </div>
    );
}


