
'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, createContext, useContext, useRef } from 'react';
import { SiteSettingsProvider, SiteLogo } from '@/components/SiteSettingsProvider';
import { useUser, useFirestore, useDoc, setDocumentNonBlocking, useMemoFirebase } from '@/firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
import { 
    RefreshCw, 
    LogOut, 
    LayoutDashboard, 
    CreditCard, 
    Settings, 
    FileText, 
    QrCode, 
    Menu, 
    X, 
    PanelLeftClose, 
    PanelLeftOpen 
} from 'lucide-react';

interface UserProfile {
    id: string;
    displayName: string;
    email: string;
    telegramId: string;
    role: string;
    apiKey: string;
    planId: string | null;
    planExpiresAt: any | null;
    plan?: any;
}

const UserContext = createContext<{ user: UserProfile | null; refreshUser: () => void }>({
    user: null,
    refreshUser: () => { },
});

export const useUserContext = () => useContext(UserContext);

const MENU_ITEMS = [
    { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: 'Generate QRIS', href: '/generate', icon: <QrCode className="w-5 h-5" /> },
    { label: 'Subscribe', href: '/subscribe', icon: <CreditCard className="w-5 h-5" /> },
];

const BOTTOM_ITEMS = [
    { label: 'Pengaturan', href: '/settings', icon: <Settings className="w-5 h-5" /> },
    { label: 'Dokumentasi API', href: '/docs', icon: <FileText className="w-5 h-5" /> },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const router = useRouter();
    const { user: authUser, isUserLoading } = useUser();
    const firestore = useFirestore();
    const creationInProgress = useRef(false);

    const userDocRef = useMemoFirebase(() => {
        if (!firestore || !authUser?.uid) return null;
        return doc(firestore, 'users', authUser.uid);
    }, [firestore, authUser?.uid]);

    const { data: userProfile, isLoading: isProfileLoading } = useDoc<UserProfile>(userDocRef);

    const planRef = useMemoFirebase(() => {
        if (!firestore || !userProfile?.planId) return null;
        return doc(firestore, 'plans', userProfile.planId);
    }, [firestore, userProfile?.planId]);
    const { data: planData } = useDoc<any>(planRef);

    const [sidebarOpen, setSidebarOpen] = useState(true);
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        if (!isUserLoading && !authUser) {
            router.push('/signin');
            return;
        }

        const metaStr = typeof window !== 'undefined' ? localStorage.getItem('pending_registration_data') : null;

        if (authUser && !isProfileLoading && !userProfile && metaStr && !creationInProgress.current) {
            creationInProgress.current = true;

            let finalDisplayName = '';
            let finalTelegramId = '';

            try {
                const data = JSON.parse(metaStr);
                finalDisplayName = data.displayName || '';
                finalTelegramId = data.telegramId || '';
            } catch (e) {
                console.error('Gagal memparsing data registrasi');
            }
            
            if (!finalDisplayName) {
                finalDisplayName = authUser.displayName || authUser.email?.split('@')[0] || 'User Baru';
            }

            const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
            let generatedKey = 'GO_';
            const randomLength = Math.floor(Math.random() * 11) + 10;
            for (let i = 0; i < randomLength; i++) {
                generatedKey += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            
            const newProfile = {
                id: authUser.uid,
                email: authUser.email,
                displayName: finalDisplayName,
                telegramId: finalTelegramId,
                role: 'USER',
                apiKey: generatedKey,
                saldo: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };
            
            if (userDocRef && firestore) {
                setDocumentNonBlocking(userDocRef, newProfile, { merge: true });
                const trackRef = doc(firestore, 't_merchant', `t_${authUser.uid}`);
                setDocumentNonBlocking(trackRef, {
                    uid: authUser.uid,
                    email: authUser.email,
                    telegramId: finalTelegramId,
                    connectedAt: serverTimestamp()
                }, { merge: true });

                fetch('/bot/welcome', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                        telegramId: finalTelegramId, 
                        username: finalDisplayName 
                    })
                }).catch(e => console.error('Gagal kirim welcome bot:', e));

                localStorage.removeItem('pending_registration_data');
            }
        }
    }, [authUser, isUserLoading, userProfile, isProfileLoading, userDocRef, firestore, router]);

    const handleLogout = async () => {
        const { getAuth, signOut } = await import('firebase/auth');
        const auth = getAuth();
        await signOut(auth);
        router.push('/signin');
    };

    if (isUserLoading || isProfileLoading) return <div className="min-h-screen flex items-center justify-center bg-white"><RefreshCw className="w-8 h-8 text-[#619BF3] animate-spin" /></div>;

    const mergedUser = userProfile ? { 
        ...userProfile, 
        plan: planData || { name: 'Free Plan', maxRequestsPerDay: 5 } 
    } : null;
    
    const initial = mergedUser?.displayName?.[0]?.toUpperCase() || 'U';

    return (
        <SiteSettingsProvider>
            <UserContext.Provider value={{ user: mergedUser, refreshUser: () => {} }}>
                <div className="min-h-screen flex flex-col overflow-x-hidden bg-[#f8fafc]">
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
                            <div className="flex items-center gap-4">
                                <div className="hidden sm:flex items-center gap-2 bg-white border border-slate-200 px-3 py-1.5 rounded-full shadow-sm">
                                    <span className={`w-2 h-2 rounded-full ${mergedUser?.planId ? 'bg-emerald-500' : 'bg-blue-500'}`} />
                                    <span className="text-xs text-slate-600 font-bold uppercase tracking-widest">{mergedUser?.plan?.name || 'Free Plan'}</span>
                                </div>
                                {mergedUser?.role === 'ADMIN' && (
                                    <Link href="/admin-panel" className="flex items-center gap-1.5 bg-rose-50 border border-rose-100 px-3 py-1.5 rounded-full">
                                        <span className="text-[10px] text-rose-600 font-black">ADMIN</span>
                                    </Link>
                                )}
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
                                {MENU_ITEMS.map((item) => (
                                    <Link key={item.href} href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
                                        {item.icon}
                                        {(sidebarOpen || mobileMenuOpen) && <span>{item.label}</span>}
                                    </Link>
                                ))}
                                <div className="border-t border-slate-100 my-3" />
                                {BOTTOM_ITEMS.map((item) => (
                                    <Link key={item.href} href={item.href} className={`sidebar-link ${pathname === item.href ? 'active' : ''}`}>
                                        {item.icon}
                                        {(sidebarOpen || mobileMenuOpen) && <span>{item.label}</span>}
                                    </Link>
                                ))}
                            </div>
                            <div className="p-4 border-t border-slate-100 mt-auto bg-white">
                                <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                                    <div className="flex items-center gap-3 min-w-0 flex-1">
                                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#619BF3] to-[#3BDAFA] flex items-center justify-center shrink-0 shadow-sm">
                                            <span className="text-white text-sm font-black">{initial}</span>
                                        </div>
                                        {(sidebarOpen || mobileMenuOpen) && (
                                            <div className="min-w-0 flex-1">
                                                <p className="text-sm font-bold text-slate-900 truncate leading-none mb-1">{mergedUser?.displayName || 'User'}</p>
                                                <p className="text-[10px] text-slate-500 truncate font-medium">{mergedUser?.email}</p>
                                            </div>
                                        )}
                                    </div>
                                    {(sidebarOpen || mobileMenuOpen) && (
                                        <button onClick={handleLogout} className="p-2 text-slate-400 hover:text-rose-500 transition-all hover:bg-white rounded-lg shrink-0" title="Logout">
                                            <LogOut className="w-4 h-4" />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </aside>

                        <main 
                            className={`flex-1 flex flex-col min-h-[calc(100dvh-4rem)] w-full transition-all duration-300 ${
                                mobileMenuOpen ? 'overflow-hidden' : 'overflow-y-auto'
                            } ${sidebarOpen ? 'md:ml-64' : 'md:ml-20'}`}
                        >
                            <div className="flex-1 p-4 md:p-6 lg:p-8">
                                <div className="max-w-6xl mx-auto">
                                    {children}
                                </div>
                            </div>
                        </main>
                    </div>
                </div>
            </UserContext.Provider>
        </SiteSettingsProvider>
    );
}


