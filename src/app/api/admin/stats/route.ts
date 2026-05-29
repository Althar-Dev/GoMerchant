import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs, getCountFromServer, orderBy, limit } from 'firebase/firestore';
import { getAuthUser } from '@/lib/auth';

/**
 * Admin Stats API
 * Menghitung statistik riil dari koleksi Firestore 'users' dan 'transactions'.
 */
export async function GET() {
    try {
        const user = await getAuthUser();
        if (!user || user.role !== 'ADMIN') {
            return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
        }

        const { firestore: db } = initializeFirebase();
        const usersCountSnap = await getCountFromServer(collection(db, 'users'));
        const txCountSnap = await getCountFromServer(collection(db, 'transactions'));
        const paidTxQuery = query(collection(db, 'transactions'), where('paymentStatus', '==', 'paid'));
        const paidTxSnap = await getDocs(paidTxQuery);
        
        let totalRevenue = 0;
        paidTxSnap.forEach(doc => {
            const data = doc.data();
            totalRevenue += Number(data.totalAmount || data.amount || 0);
        });

        const recentTxQuery = query(collection(db, 'transactions'), orderBy('createdAt', 'desc'), limit(10));
        const recentTxSnap = await getDocs(recentTxQuery);
        const recentTransactions = recentTxSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? doc.data().createdAt.toDate().toISOString() : doc.data().createdAt
        }));

        const recentUsersQuery = query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(5));
        const recentUsersSnap = await getDocs(recentUsersQuery);
        const recentUsers = recentUsersSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({
            status: 'success',
            data: {
                totalUsers: usersCountSnap.data().count,
                totalTransactions: txCountSnap.data().count,
                totalRevenue,
                recentTransactions,
                recentUsers,
            },
        });
    } catch (error: any) {
        console.error('[Admin API] Stats calculation error:', error);
        return NextResponse.json({ status: 'error', message: error.message || 'Server error' }, { status: 500 });
    }
}

