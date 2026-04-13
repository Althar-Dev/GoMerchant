import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, getDocs, doc, updateDoc, orderBy, serverTimestamp, addDoc, getDoc } from 'firebase/firestore';
import { getAuthUser } from '@/lib/auth';

/**
 * Admin Members API
 * Mengelola data pengguna dan sinkronisasi saldo secara riil.
 */

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
        }

        const { firestore: db } = initializeFirebase();
        const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc')));
        
        const members = usersSnap.docs.map(d => ({
            id: d.id,
            ...d.data()
        }));

        return NextResponse.json({ status: 'success', data: members });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const admin = await getAuthUser();
        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
        }

        const { firestore: db } = initializeFirebase();
        const body = await req.json();
        const { userId, role, saldo } = body;

        if (!userId) return NextResponse.json({ status: 'error', message: 'User ID required' }, { status: 400 });

        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) return NextResponse.json({ status: 'error', message: 'User not found' }, { status: 404 });

        const currentData = userSnap.data();
        const updateData: any = { updatedAt: serverTimestamp() };
        
        if (role) updateData.role = role;
        
        if (saldo !== undefined) {
            const newSaldo = Number(saldo);
            const oldSaldo = Number(currentData.saldo || 0);
            updateData.saldo = newSaldo;
            
            if (newSaldo !== oldSaldo) {
                const logRef = collection(userRef, 'saldoLogs');
                await addDoc(logRef, {
                    userId,
                    amount: newSaldo - oldSaldo,
                    balanceBefore: oldSaldo,
                    balanceAfter: newSaldo,
                    type: 'admin_adjustment',
                    description: `Penyesuaian saldo manual oleh Admin (${admin.username})`,
                    createdAt: serverTimestamp()
                });
            }
        }

        await updateDoc(userRef, updateData);

        return NextResponse.json({ 
            status: 'success', 
            message: 'Data member berhasil diperbarui secara permanen.' 
        });
    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}