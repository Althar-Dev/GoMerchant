
import { headers } from 'next/headers';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc } from 'firebase/firestore';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

/**
 * Auth Utility
 * Autentikasi dikelola oleh Firebase. Properti saldo ditambahkan untuk konsistensi sistem.
 */

export interface AuthUser {
    id: string;
    role: string;
    username: string;
    email: string;
    saldo: number;
}

export async function getAuthUser(): Promise<AuthUser | null> {
    const headerList = await headers();
    const userId = headerList.get('x-user-id');
    
    if (userId) {
        try {
            const { firestore } = initializeFirebase();
            const userDoc = await getDoc(doc(firestore, 'users', userId));
            
            if (userDoc.exists()) {
                const data = userDoc.data();
                return { 
                    id: userId, 
                    role: data.role || 'USER',
                    username: data.displayName || data.username || 'User',
                    email: data.email || '',
                    saldo: Number(data.saldo || 0)
                };
            }
        } catch (error) {
            console.error('[Auth] Server-side error fetching user from Firestore:', error);
        }
        
        return { 
            id: userId, 
            role: 'USER', 
            username: 'User', 
            email: '', 
            saldo: 0 
        };
    }
    
    return null; 
}

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function generateToken(payload: any): string {
    return jwt.sign(payload, process.env.JWT_SECRET || 'GomerchPay-fallback-secret-2024', { expiresIn: '7d' });
}

export function generateApiKey(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = 'GO_';
    const randomLength = Math.floor(Math.random() * 11) + 15;
    for (let i = 0; i < randomLength; i++) {
        result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
}

export function generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
}
