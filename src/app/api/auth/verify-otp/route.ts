
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, setDoc, deleteDoc, collection, query, where, getDocs, serverTimestamp } from 'firebase/firestore';
import { generateApiKey, generateToken } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { email, otp, username, telegramId, hashedPassword } = body;

        if (email) {
            const rateLimit = await checkRateLimit(`verify-otp:${email}`, 5, 60);
            if (!rateLimit.allowed) {
                return NextResponse.json({ status: 'error', message: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit' }, { status: 429 });
            }
        }

        if (!email || !otp || !username || !telegramId || !hashedPassword) {
            return NextResponse.json({ status: 'error', message: 'Data tidak lengkap' }, { status: 400 });
        }

        const { firestore: db } = initializeFirebase();
        
        const otpRef = doc(db, 'otp_verifications', email);
        const otpSnap = await getDoc(otpRef);

        if (!otpSnap.exists() || otpSnap.data().otp !== otp) {
            return NextResponse.json({ status: 'error', message: 'Kode OTP tidak valid' }, { status: 400 });
        }

        const expiresAt = otpSnap.data().expiresAt.toDate ? otpSnap.data().expiresAt.toDate() : new Date(otpSnap.data().expiresAt);
        if (new Date() > expiresAt) {
            return NextResponse.json({ status: 'error', message: 'Kode OTP sudah kadaluarsa' }, { status: 400 });
        }

        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const userSnap = await getDocs(q);

        if (!userSnap.empty) {
            return NextResponse.json({ status: 'error', message: 'Email sudah terdaftar' }, { status: 409 });
        }
        await deleteDoc(otpRef);

        return NextResponse.json({
            status: 'success',
            message: 'OTP Valid',
            data: { verified: true }
        });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
