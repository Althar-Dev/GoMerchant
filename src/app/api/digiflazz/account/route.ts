import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, deleteDoc } from 'firebase/firestore';

/**
 * API Akun Digiflazz
 * Dimigrasikan ke Firestore untuk menggantikan Prisma.
 */

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

        const { firestore: db } = initializeFirebase();
        const accountRef = doc(db, 'users', user.id, 'digiflazzAccounts', 'main');
        const accountSnap = await getDoc(accountRef);

        const accountData = accountSnap.exists() ? accountSnap.data() : null;

        return NextResponse.json({
            status: 'success',
            data: accountData ? { 
                id: accountSnap.id, 
                email: accountData.email, 
                connected: accountData.isConnected, 
                lastUsedAt: accountData.lastUsedAt?.toDate ? accountData.lastUsedAt.toDate() : accountData.lastUsedAt, 
                createdAt: accountData.createdAt?.toDate ? accountData.createdAt.toDate() : accountData.createdAt 
            } : null,
            saldo: user.saldo,
        });
    } catch (error) {
        console.error('Digiflazz account error:', error);
        return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE() {
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

        const { firestore: db } = initializeFirebase();
        const accountRef = doc(db, 'users', user.id, 'digiflazzAccounts', 'main');
        await deleteDoc(accountRef);

        return NextResponse.json({ status: 'success', message: 'Akun Digiflazz berhasil di-disconnect' });
    } catch (error) {
        console.error('Digiflazz disconnect error:', error);
        return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
    }
}


