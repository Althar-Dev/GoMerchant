
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, serverTimestamp, Timestamp, writeBatch } from 'firebase/firestore';

/**
 * SValePay Manual Verification API (Anti-Double Claim)
 * Mengecek status transaksi secara real-time ke API SValePay dan mencegah klaim ganda.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { trxId } = body;
        const { firestore: db } = initializeFirebase();

        if (!trxId) return NextResponse.json({ status: 'error', message: 'TRX ID required' }, { status: 400 });

        console.log(`[SValePay Verify] Checking status for: ${trxId}`);
        const txRef = doc(db, 'transactions', trxId);
        const txSnap = await getDoc(txRef);
        const settingsSnap = await getDoc(doc(db, 'business', 'settings'));

        if (!txSnap.exists()) {
            return NextResponse.json({ status: 'error', message: 'Transaksi tidak ditemukan di database kami.' }, { status: 404 });
        }
        
        const tx = txSnap.data();
        const settings = settingsSnap.data();
        if (tx.paymentStatus === 'paid') {
            return NextResponse.json({ 
                status: 'already_paid', 
                message: 'Paket untuk transaksi ini sudah aktif. Anda tidak bisa mengklaimnya dua kali.' 
            });
        }

        if (!settings?.svaleBusinessId || !settings?.svaleSecretKey) {
            return NextResponse.json({ status: 'error', message: 'Konfigurasi gateway pembayaran belum disetup oleh Admin.' }, { status: 503 });
        }

        const svaleRes = await fetch(`https://api.svalepay.web.id/api/v1/payments/status?trx_id=${trxId}&m=${settings.svaleBusinessId}`, {
            method: 'GET',
            headers: {
                'X-Business-ID': settings.svaleBusinessId,
                'X-Secret-Key': settings.svaleSecretKey
            }
        });

        const svaleData = await svaleRes.json();
        const remoteStatus = (svaleData.data?.status || '').toUpperCase();

        if (remoteStatus === 'PAID' || remoteStatus === 'SUCCESS') {
            const batch = writeBatch(db);
            batch.update(txRef, {
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

                    batch.update(doc(db, 'users', tx.userId), {
                        planId: tx.planId,
                        planExpiresAt: Timestamp.fromDate(expiresAtDate),
                        updatedAt: serverTimestamp()
                    });
                }
            }
            await batch.commit();
            console.log(`[SValePay Verify] Successfully activated plan for ${tx.userId} using TRX ${trxId}`);

            return NextResponse.json({ status: 'success', message: 'Pembayaran berhasil diverifikasi dan paket telah aktif!' });
        }

        return NextResponse.json({ 
            status: 'pending', 
            message: 'Pembayaran belum terdeteksi lunas di server SValePay.',
            remoteStatus 
        });

    } catch (error: any) {
        console.error('[SValePay Verify Error]', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}

