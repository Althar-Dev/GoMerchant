
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { firestore: db } = initializeFirebase();

        console.log('[SValePay Webhook] Received payload:', JSON.stringify(body));
        const reference = body.external_id || body.reference || body.data?.external_id;
        const status = (body.status || body.data?.status || '').toUpperCase();

        if (!reference) {
            return NextResponse.json({ status: 'ignored', reason: 'Missing reference' });
        }

        if (status !== 'PAID' && status !== 'SUCCESS') {
            return NextResponse.json({ status: 'ignored', reason: 'Status not paid', receivedStatus: status });
        }

        const txRef = doc(db, 'transactions', reference);
        const txSnap = await getDoc(txRef);

        if (!txSnap.exists()) {
            console.error(`[SValePay Webhook] Transaction ${reference} not found in database.`);
            return NextResponse.json({ status: 'error', message: 'Transaction not found' }, { status: 404 });
        }

        const tx = txSnap.data();
        if (tx.paymentStatus === 'paid') {
            return NextResponse.json({ status: 'already_processed' });
        }

        await updateDoc(txRef, {
            paymentStatus: 'paid',
            paidAt: serverTimestamp(),
            updatedAt: serverTimestamp()
        });

        if (tx.toolType === 'subscription' && tx.planId && tx.userId) {
            const planSnap = await getDoc(doc(db, 'plans', tx.planId));
            if (planSnap.exists()) {
                const plan = planSnap.data();
                const expiresAtDate = new Date();
                expiresAtDate.setDate(expiresAtDate.getDate() + (plan.durationDays || 30));

                const userRef = doc(db, 'users', tx.userId);
                await updateDoc(userRef, {
                    planId: tx.planId,
                    planExpiresAt: Timestamp.fromDate(expiresAtDate),
                    updatedAt: serverTimestamp()
                });
                
                console.log(`[SValePay Webhook] Plan ${plan.name} activated for user ${tx.userId}`);
            }
        }

        return NextResponse.json({ status: 'success' });

    } catch (error: any) {
        console.error('[SValePay Webhook] CRITICAL ERROR:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

