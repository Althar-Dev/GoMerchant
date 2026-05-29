import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, getDocs, doc, setDoc, deleteDoc, updateDoc, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuthUser } from '@/lib/auth';

/**
 * Admin Plans API
 * Mengelola daftar paket langganan menggunakan Firestore.
 */

export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }

        const { firestore: db } = initializeFirebase();
        const snap = await getDocs(query(collection(db, 'plans'), orderBy('price', 'asc')));
        const plans = snap.docs.map(d => ({ id: d.id, ...d.data() }));

        return NextResponse.json({ status: 'success', data: plans });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }

        const { firestore: db } = initializeFirebase();
        const body = await req.json();
        const { name, price, durationDays, maxRequestsPerDay } = body;

        const newDocRef = doc(collection(db, 'plans'));
        await setDoc(newDocRef, {
            name,
            price: parseInt(price),
            durationDays: parseInt(durationDays),
            maxRequestsPerDay: parseInt(maxRequestsPerDay),
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        return NextResponse.json({ status: 'success', message: 'Plan berhasil dibuat' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Gagal membuat plan' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }

        const { firestore: db } = initializeFirebase();
        const body = await req.json();
        const { id, ...data } = body;

        if (!id) return NextResponse.json({ status: 'error', message: 'ID required' }, { status: 400 });

        await updateDoc(doc(db, 'plans', id), {
            ...data,
            updatedAt: serverTimestamp()
        });

        return NextResponse.json({ status: 'success', message: 'Plan diperbarui' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Gagal update plan' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }

        const { firestore: db } = initializeFirebase();
        const id = req.nextUrl.searchParams.get('id');
        if (!id) return NextResponse.json({ status: 'error', message: 'ID required' }, { status: 400 });

        await deleteDoc(doc(db, 'plans', id));
        return NextResponse.json({ status: 'success', message: 'Plan dihapus' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Gagal hapus plan' }, { status: 500 });
    }
}

