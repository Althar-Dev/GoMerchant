import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { comparePassword, generateToken } from '@/lib/auth';

export async function POST(req: NextRequest) {
    try {
        const { email, password } = await req.json();

        if (!email || !password) {
            return NextResponse.json({ status: 'error', message: 'Email dan password wajib diisi' }, { status: 400 });
        }

        const { firestore: db } = initializeFirebase();
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email));
        const snap = await getDocs(q);

        if (snap.empty) {
            return NextResponse.json({ status: 'error', message: 'Email atau password salah' }, { status: 401 });
        }

        const userData = snap.docs[0].data();
        
        if (!userData.password) {
            return NextResponse.json({ status: 'error', message: 'Gunakan login via Firebase Client SDK' }, { status: 403 });
        }

        const valid = await comparePassword(password, userData.password);
        if (!valid) {
            return NextResponse.json({ status: 'error', message: 'Email atau password salah' }, { status: 401 });
        }

        const token = generateToken({
            userId: snap.docs[0].id,
            email: userData.email,
            role: userData.role,
        });

        return NextResponse.json({
            status: 'success',
            message: 'Login berhasil',
            data: { token, user: { id: snap.docs[0].id, email: userData.email, role: userData.role } }
        });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}


