/**
 * Site Settings Utility
 * Migrated from Prisma to a static/client-side approach.
 * In a full Firebase migration, global settings could be fetched from a 'settings' collection in Firestore.
 */

interface SiteSettings {
    siteTitle: string;
    favicon: string | null;
    logo: string | null;
}

export async function getSiteSettings(): Promise<SiteSettings> {
    return {
        siteTitle: 'GomerchPay API',
        favicon: null,
        logo: '/img/logo.png',
    };
}


