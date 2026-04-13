import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, getDocs, doc, addDoc, deleteDoc, serverTimestamp, getDoc, where } from 'firebase/firestore';
import { validateApiRequest } from '@/lib/subscriptionGuard';
import { checkWhitelistIpLimit } from '@/lib/subscriptionGuard';

export async function GET() {
    try {
        const { firestore: db } = initializeFirebase();
        const headerList = await (await import('next/headers')).headers();
        const userId = headerList.get('x-user-id');

        if (!userId) return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });

        const ipsRef = collection(db, 'users', userId, 'whitelistIps');
        const snap = await getDocs(ipsRef);
        
        const ips = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        return NextResponse.json({ status: 'success', data: ips });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { ipAddress, label, apikey } = body;

        if (!ipAddress || !apikey) {
            return NextResponse.json({ status: 'error', message: 'IP address dan API Key wajib diisi' }, { status: 400 });
        }

        const guard = await validateApiRequest(apikey, false);
        if (!guard.success) {
            return NextResponse.json({ status: 'error', message: guard.error?.message }, { status: guard.error?.status });
        }

        const user = guard.user!;
        const limit = user.plan?.maxWhitelistIps || 0;

        const canAdd = await checkWhitelistIpLimit(user.id, limit);
        if (!canAdd) {
            return NextResponse.json({ status: 'error', message: 'Batas whitelist IP untuk paket Anda telah tercapai.' }, { status: 403 });
        }

        const { firestore: db } = initializeFirebase();
        const ipsRef = collection(db, 'users', user.id, 'whitelistIps');
        const q = query(ipsRef, where('ipAddress', '==', ipAddress));
        const dupSnap = await getDocs(q);
        
        if (!dupSnap.empty) {
            return NextResponse.json({ status: 'error', message: 'IP sudah terdaftar.' }, { status: 409 });
        }

        const newIp = await addDoc(ipsRef, {
            ipAddress,
            label: label || null,
            createdAt: serverTimestamp()
        });

        return NextResponse.json({ status: 'success', message: 'IP berhasil ditambahkan', data: { id: newIp.id } });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        const headerList = await (await import('next/headers')).headers();
        const userId = headerList.get('x-user-id');

        if (!id || !userId) return NextResponse.json({ status: 'error', message: 'Data tidak lengkap' }, { status: 400 });

        const { firestore: db } = initializeFirebase();
        await deleteDoc(doc(db, 'users', userId, 'whitelistIps', id));

        return NextResponse.json({ status: 'success', message: 'IP berhasil dihapus' });
    } catch (error) {
        return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
    }
}
