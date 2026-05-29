
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { SiteLogo, SiteSettingsProvider } from '@/components/SiteSettingsProvider';
import { useUser, useFirestore, useDoc, useMemoFirebase } from '@/firebase';
import { doc } from 'firebase/firestore';
import { 
    RefreshCw, 
    Menu, 
    LogOut, 
    LayoutDashboard, 
    Globe, 
    CreditCard, 
    Users, 
    ShieldAlert, 
    X, 
    PanelLeftClose, 
    PanelLeftOpen,
    MessageSquare
} from 'lucide-react';

const ADMIN_SIDEBAR_ITEMS = [
    {
        label: 'Dashboard',
        href: '/admin-panel',
        icon: <LayoutDashboard className="w-5 h-5" />,
    },
    {
        label: 'Master Bot',
        href: '/bot',
        icon: <MessageSquare className="w-5 h-5" />,
    },
    {
        label: 'Kelola Website',
        href: '/website',
        icon: <Globe className="w-5 h-5" />,
    },
    {
        label: 'Kelola Plan',
        href: '/plans',
        icon: <CreditCard className="w-5 h-5" />,
    },
    {
        label: 'Kelola Member',
        href: '/members',
        icon: <Users className="w-5 h-5" />,
    },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !user?.uid) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<any>(userDocRef);

    useEffect(() => {
        const html = document.documentElement;
        if (mobileMenuOpen) {
            html.style.overflow = 'hidden';
            document.body.style.overflow = 'hidden';
        } else {
            html.style.overflow = '';
            document.body.style.overflow = '';
        }
        return () => {
            html.style.overflow = '';
            document.body.style.overflow = '';
        };
    }, [mobileMenuOpen]);

    useEffect(() => {
        setMobileMenuOpen(false);
    }, [pathname]);

    useEffect(() => {
        if (!isUserLoading && !user) {
            router.push('/signin');
        }
    }, [user, isUserLoading, router]);

    const handleLogout = async () => {
        const { getAuth, signOut } = await import('firebase/auth');
        const auth = getAuth();
        await signOut(auth);
        router.push('/signin');
    };

    if (isUserLoading || isProfileLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" />
            </div>
        );
    }

    if (user && userProfile && userProfile.role !== 'ADMIN') {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 p-6 text-center">
                <div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mb-6">
                    <ShieldAlert className="w-10 h-10 text-rose-500" />
                </div>
                <h1 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-2">Akses Ditolak</h1>
                <p className="text-slate-500 max-w-sm mb-8">Anda tidak memiliki izin Administrator untuk mengakses halaman ini.</p>
                <Link href="/dashboard" className="btn btn-primary px-8 !rounded-xl font-bold uppercase tracking-widest text-xs">Kembali ke Dashboard</Link>
            </div>
        );
    }

    return (
        <SiteSettingsProvider>
            <div className="min-h-screen flex flex-col bg-[#f8fafc]">
                <nav className="glass-strong border-b border-slate-200 fixed top-0 left-0 right-0 z-50 h-16">
                    <div className="flex items-center justify-between h-full px-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => {
                                    if (window.innerWidth < 768) {
                                        setMobileMenuOpen(!mobileMenuOpen);
                                    } else {
                                        setSidebarOpen(!sidebarOpen);
                                    }
                                }}
                                className="p-2.5 rounded-xl hover:bg-slate-100 text-slate-500 hover:text-[#619BF3] transition-all duration-300 active:scale-90 flex items-center justify-center group"
                                title={sidebarOpen ? "Collapse Sidebar" : "Expand Sidebar"}
                            >
                                <div className="relative w-5 h-5 flex items-center justify-center">
                                    {mobileMenuOpen ? (
                                        <X className="w-5 h-5 animate-in fade-in zoom-in duration-300" />
                                    ) : (
                                        <div className="transition-transform duration-300">
                                            <div className="hidden md:block">
                                                {sidebarOpen ? <PanelLeftClose className="w-5 h-5" /> : <PanelLeftOpen className="w-5 h-5" />}
                                            </div>
                                            <div className="md:hidden">
                                                <Menu className="w-5 h-5" />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </button>
                            <Link href="/" className="flex items-center gap-2">
                                <SiteLogo size="sm" showTitle />
                            </Link>
                        </div>

                        <div className="flex items-center gap-3">
                            <div className="hidden sm:flex items-center gap-2 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full">
                                <ShieldAlert className="w-3.5 h-3.5 text-rose-500" />
                                <span className="text-[10px] text-rose-600 font-black uppercase tracking-wider">ADMIN PANEL</span>
                            </div>

                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center">
                                    <span className="text-slate-700 text-sm font-bold">{user?.email?.[0]?.toUpperCase()}</span>
                                </div>
                                <button
                                    onClick={handleLogout}
                                    className="p-2 rounded-lg hover:bg-slate-100 transition"
                                    title="Logout"
                                >
                                    <LogOut className="w-5 h-5 text-slate-400 hover:text-rose-500 transition" />
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="flex pt-16 min-h-screen">
                    {mobileMenuOpen && (
                        <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-30 md:hidden" onClick={() => setMobileMenuOpen(false)} />
                    )}

                    <aside
                        className={`fixed top-16 left-0 h-[calc(100dvh-4rem)] bg-white border-r border-slate-200 z-40 flex flex-col transition-all duration-300 ${
                            mobileMenuOpen ? 'translate-x-0 w-64' : '-translate-x-full md:translate-x-0'
                        } ${!mobileMenuOpen && sidebarOpen ? 'md:w-64' : 'md:w-20'}`}
                    >
                        <div className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                            {ADMIN_SIDEBAR_ITEMS.map((item) => (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}
                                >
                                    {item.icon}
                                    {(sidebarOpen || mobileMenuOpen) && <span>{item.label}</span>}
                                </Link>
                            ))}
                        </div>
                        <div className="p-4 border-t border-slate-100 text-center">
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Admin v1.0</span>
                        </div>
                    </aside>

                    <main 
                        className={`flex-1 flex flex-col min-h-[calc(100dvh-4rem)] w-full transition-all duration-300 ${
                            mobileMenuOpen ? 'overflow-hidden' : 'overflow-y-auto'
                        } ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}
                    >
                        <div className="flex-1 p-4 md:p-6 lg:p-8">
                            {children}
                        </div>
                        <footer className="border-t border-slate-100 bg-white px-6 py-4">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">© {new Date().getFullYear()} GomerchPay</span>
                                <span className="text-[9px] font-bold text-slate-300 uppercase tracking-wider">Build with 💙 by AltharDev</span>
                            </div>
                        </footer>
                    </main>
                </div>
            </div>
        </SiteSettingsProvider>
    );
}

