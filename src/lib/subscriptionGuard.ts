import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';
import { getDailyCount } from './rateLimit';

export interface ValidatedUser {
    id: string;
    username: string;
    displayName?: string;
    email: string;
    role: string;
    saldo: number;
    planId: string | null;
    planExpiresAt: any | null;
    apiKey: string;
    plan?: any;
    currentDailyUsage?: number;
}

export interface GuardResult {
    success: boolean;
    error?: {
        status: number;
        code: number;
        message: string;
    };
    user?: ValidatedUser;
}

export function getClientIp(headers: Headers): string {
    const forwarded = headers.get('x-forwarded-for');
    if (forwarded) return forwarded.split(',')[0].trim();
    const realIp = headers.get('x-real-ip');
    if (realIp) return realIp.trim();
    return '127.0.0.1';
}

/**
 * Cek apakah user masih bisa menambah IP whitelist sesuai limit paket.
 */
export async function checkWhitelistIpLimit(userId: string, limit: number): Promise<boolean> {
    if (limit === -1) return true;
    try {
        const { firestore: db } = initializeFirebase();
        const ipsRef = collection(db, 'users', userId, 'whitelistIps');
        const snap = await getDocs(ipsRef);
        return snap.size < limit;
    } catch (err) {
        console.error('[Guard] Whitelist check failed:', err);
        return false;
    }
}

/**
 * Validates API request based on API Key and Daily Quota.
 */
export async function validateApiRequest(apiKey: string, checkQuota: boolean = true): Promise<GuardResult> {
    try {
        const { firestore: db } = initializeFirebase();

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('apiKey', '==', apiKey));
        const snap = await getDocs(q);

        if (snap.empty) {
            return {
                success: false,
                error: { status: 401, code: 401, message: 'API key tidak valid' },
            };
        }

        const userDoc = snap.docs[0];
        const userData = userDoc.data();
        const userId = userDoc.id;

        let planData = {
            name: 'Free Plan',
            maxRequestsPerDay: 5,
            maxWhitelistIps: 0,
            isActive: true
        };

        if (userData.planId) {
            const planSnap = await getDoc(doc(db, 'plans', userData.planId));
            if (planSnap.exists() && planSnap.data().isActive) {
                if (userData.planExpiresAt) {
                    const expiry = userData.planExpiresAt.toDate ? userData.planExpiresAt.toDate() : new Date(userData.planExpiresAt);
                    if (new Date() < expiry) {
                        planData = planSnap.data() as any;
                    }
                } else {
                    planData = planSnap.data() as any;
                }
            }
        }

        const usage = await getDailyCount(userId);
        const limit = planData.maxRequestsPerDay || 5;

        if (checkQuota && limit !== -1 && usage >= limit) {
            return {
                success: false,
                error: { 
                    status: 403, 
                    code: 403, 
                    message: `Kuota harian tercapai (${usage}/${limit}). Silakan upgrade paket Anda.` 
                },
            };
        }

        return {
            success: true,
            user: {
                id: userId,
                username: userData.displayName || userData.username || 'User',
                email: userData.email,
                role: userData.role,
                saldo: userData.saldo || 0,
                planId: userData.planId,
                planExpiresAt: userData.planExpiresAt,
                apiKey: userData.apiKey,
                plan: planData,
                currentDailyUsage: usage
            } as ValidatedUser,
        };
    } catch (error: any) {
        console.error('[Guard] Error:', error);
        return {
            success: false,
            error: { status: 500, code: 500, message: 'Gagal melakukan validasi keamanan server.' },
        };
    }
}
