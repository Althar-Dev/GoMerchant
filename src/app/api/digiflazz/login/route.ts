import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { loginDigiflazz } from '@/lib/digiflazz';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

        const { email, password } = await req.json();
        if (!email || !password) {
            return NextResponse.json({ status: 'error', message: 'Email dan password wajib diisi' }, { status: 400 });
        }

        const { firestore: db } = initializeFirebase();
        const accountRef = doc(db, 'users', user.id, 'digiflazzAccounts', 'main');
        const existing = await getDoc(accountRef);
        
        if (existing.exists() && existing.data().isConnected) {
            return NextResponse.json({ status: 'error', message: 'Akun Digiflazz sudah terhubung. Disconnect dulu untuk login ulang.' }, { status: 409 });
        }

        const logs: string[] = [];
        const result = await loginDigiflazz(email, password, (msg) => logs.push(msg));

        if (result.status === 'success' && result.cookies) {
            await setDoc(accountRef, {
                email,
                cookiesData: result.cookies,
                isConnected: true,
                lastUsedAt: serverTimestamp(),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            }, { merge: true });
            
            return NextResponse.json({ status: 'success', message: 'Login berhasil', logs });
        }

        if (result.status === 'need_2fa' && result.cookies) {
            return NextResponse.json({
                status: 'success',
                data: { need2fa: true, tempCookies: result.cookies, message: result.message },
                logs,
            });
        }

        return NextResponse.json({ status: 'error', message: result.message || 'Login gagal', logs }, { status: 400 });
    } catch (error) {
        console.error('Digiflazz login error:', error);
        return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
    }
}


