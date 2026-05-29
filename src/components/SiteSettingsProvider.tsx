'use client';

import { useState, useEffect, createContext, useContext, ReactNode } from 'react';

interface SiteSettings {
    siteTitle: string;
    favicon: string | null;
    logo: string | null;
}

const SiteSettingsContext = createContext<SiteSettings>({
    siteTitle: 'GomerchPay API',
    favicon: null,
    logo: '/img/logo.png',
});

export function useSiteSettings() {
    return useContext(SiteSettingsContext);
}

export function SiteSettingsProvider({ children }: { children: ReactNode }) {
    const [settings, setSettings] = useState<SiteSettings>({
        siteTitle: 'GomerchPay API',
        favicon: null,
        logo: '/img/logo.png',
    });

    useEffect(() => {
        fetch('/api/settings')
            .then(r => r.json())
            .then(data => {
                if (data.status === 'success') {
                    setSettings(data.data);
                }
            })
            .catch(() => { /* use defaults */ });
    }, []);

    return (
        <SiteSettingsContext.Provider value={settings}>
            {children}
        </SiteSettingsContext.Provider>
    );
}

export function SiteLogo({ size = 'md', showTitle = false }: { size?: 'sm' | 'md' | 'lg' | number; showTitle?: boolean }) {
    const { logo, siteTitle } = useSiteSettings();

    const sizeMap: Record<string, string> = {
        sm: 'w-7 h-7',
        md: 'w-8 h-8',
        lg: 'w-9 h-9',
    };

    const isPixel = typeof size === 'number';
    const rawTitle = siteTitle || 'GomerchPay API';
    const cleanTitle = rawTitle.replace(/\s*API$/i, '');

    return (
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {logo ? (
                <img
                    src={logo}
                    alt={cleanTitle}
                    className={isPixel ? undefined : sizeMap[size as string]}
                    style={isPixel ? { width: size, height: size, objectFit: 'contain' } : { objectFit: 'contain' }}
                />
            ) : null}
            {showTitle && (
                <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
                    {cleanTitle.toLowerCase().startsWith('GomerchPay') ? (
                        <>
                            <span style={{ color: '#619BF3' }}>Go</span>{cleanTitle.substring(2)}
                        </>
                    ) : cleanTitle}
                </span>
            )}
        </span>
    );
}

