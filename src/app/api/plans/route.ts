import { NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';

export async function GET() {
    try {
        const { firestore: db } = initializeFirebase();
        const plansRef = collection(db, 'plans');
        const q = query(plansRef, where('isActive', '==', true), orderBy('price', 'asc'));
        const snap = await getDocs(q);
        
        const plans = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        return NextResponse.json({ status: 'success', data: plans });
    } catch (error: any) {
        console.error('Get plans error:', error);
        return NextResponse.json({ status: 'success', data: [] });
    }
}
