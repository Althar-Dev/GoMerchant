import redis from './redis';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';

export interface RateLimitResult {
    allowed: boolean;
    remaining: number;
    resetAt: number;
    total: number;
}

/**
 * Rate limiting untuk keamanan (tetap menggunakan Redis sebagai opsional)
 */
export async function checkRateLimit(
    identifier: string,
    maxRequests: number = 30,
    windowSize: number = 60
): Promise<RateLimitResult> {
    try {
        const key = `ratelimit:${identifier}`;
        const now = Date.now();
        const windowStart = now - windowSize * 1000;

        const pipeline = redis.pipeline();
        pipeline.zremrangebyscore(key, 0, windowStart);
        pipeline.zadd(key, now, `${now}-${Math.random()}`);
        pipeline.zcard(key);
        pipeline.expire(key, windowSize);

        const results = await pipeline.exec();
        const requestCount = (results?.[2]?.[1] as number) || 0;

        return {
            allowed: requestCount <= maxRequests,
            remaining: Math.max(0, maxRequests - requestCount),
            resetAt: now + windowSize * 1000,
            total: requestCount,
        };
    } catch (error) {
        return { allowed: true, remaining: maxRequests, resetAt: 0, total: 0 };
    }
}

/**
 * Increment daily API usage count for a user (Sekarang menggunakan Firestore)
 */
export async function incrementDailyCount(userId: string): Promise<number> {
    try {
        const { firestore: db } = initializeFirebase();
        const today = new Date().toISOString().split('T')[0]; // UTC yyyy-mm-dd
        const userRef = doc(db, 'users', userId);
        
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            if (data.usageDate === today) {
                const newCount = (data.usageCount || 0) + 1;
                await updateDoc(userRef, { 
                    usageCount: increment(1),
                    updatedAt: new Date()
                });
                return newCount;
            } else {
                await updateDoc(userRef, { 
                    usageDate: today, 
                    usageCount: 1,
                    updatedAt: new Date()
                });
                return 1;
            }
        }
        return 0;
    } catch (err) {
        console.error('[RateLimit] Increment failed:', err);
        return 0;
    }
}

/**
 * Get current daily API usage count for a user (Sekarang menggunakan Firestore)
 */
export async function getDailyCount(userId: string): Promise<number> {
    try {
        const { firestore: db } = initializeFirebase();
        const today = new Date().toISOString().split('T')[0];
        const userRef = doc(db, 'users', userId);
        
        const snap = await getDoc(userRef);
        if (snap.exists()) {
            const data = snap.data();
            if (data.usageDate === today) {
                return data.usageCount || 0;
            }
        }
        return 0;
    } catch {
        return 0;
    }
}
