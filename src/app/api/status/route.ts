import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getClientIp } from '@/lib/subscriptionGuard';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs, updateDoc, doc, getDoc, serverTimestamp, writeBatch } from 'firebase/firestore';
import { GobizService } from '@/lib/gobiz';
import { normalizeAmount } from '@/lib/amountUtils';
import { okGetMutasi } from '@/lib/orderkuota';

/**
 * API Status Pengecekan (Public API)
 * Digunakan oleh sistem developer untuk mengecek apakah transaksi sudah lunas.
 * Alur: Cek Firestore -> Jika Pending, Cek Mutasi Real-time di Akun User -> Update Firestore -> Response.
 */
export async function POST(req: NextRequest) {
    try {
        const { firestore: db } = initializeFirebase();
        const body = await req.json();
        const { apikey, ref_id } = body;

        if (!apikey || !ref_id) {
            return NextResponse.json(
                { status: 'error', code: 400, message: 'Field apikey dan ref_id wajib diisi' },
                { status: 400 }
            );
        }

        const guard = await validateApiRequest(apikey, false);
        if (!guard.success) {
            return NextResponse.json(
                { status: 'error', code: guard.error!.code, message: guard.error!.message },
                { status: guard.error!.status }
            );
        }
        const user = guard.user!;
        const transRef = collection(db, 'transactions');
        const q = query(transRef, where('userId', '==', user.id), where('refId', '==', ref_id));
        const snap = await getDocs(q);

        if (snap.empty) {
            return NextResponse.json(
                { status: 'error', code: 404, message: 'Transaksi tidak ditemukan' },
                { status: 404 }
            );
        }

        const transaction = snap.docs[0].data();
        const transId = snap.docs[0].id;

        if (transaction.paymentStatus === 'paid') {
            return NextResponse.json({
                status: 'success', code: 200,
                message: 'Pembayaran berhasil',
                data: {
                    trx_id: transaction.trxId,
                    ref_id: transaction.refId,
                    amount: transaction.amount,
                    total_amount: transaction.totalAmount,
                    payment_status: 'paid',
                    paid_at: transaction.paidAt ? (transaction.paidAt.toDate ? transaction.paidAt.toDate().toISOString() : transaction.paidAt) : null,
                },
            });
        }

        const expiry = transaction.expiresAt.toDate ? transaction.expiresAt.toDate() : new Date(transaction.expiresAt);
        if (new Date() > expiry) {
            await updateDoc(doc(db, 'transactions', transId), { paymentStatus: 'expired' });
            return NextResponse.json({
                status: 'success', code: 200,
                message: 'Transaksi telah kadaluarsa',
                data: { trx_id: transaction.trxId, ref_id: transaction.refId, payment_status: 'expired' }
            });
        }

        let isPaid = false;

        if (transaction.toolType === 'GomerchPay' && transaction.merchantId) {
            const mRef = doc(db, 'users', user.id, 'GomerchPays', transaction.merchantId);
            const mSnap = await getDoc(mRef);
            
            if (mSnap.exists()) {
                const m = mSnap.data();
                const gobiz = new GobizService(m.xUniqueid);
                
                try {
                    const result = await gobiz.getTransactionsWithAutoRefresh(
                        transaction.merchantId,
                        m.accessToken,
                        m.refreshToken,
                        { size: 20 }
                    );

                    const entries = result.data?.hits || result.data?.data?.journals || [];
                    const found = entries.find((entry: any) => {
                        let amt = 0;
                        if (entry.metadata?.transaction) {
                            amt = normalizeAmount(entry.metadata.transaction.gross_amount || entry.metadata.transaction.amount);
                        } else {
                            amt = normalizeAmount(entry.amount);
                        }
                        
                        if (amt >= transaction.totalAmount * 100) amt = Math.round(amt / 100);
                        
                        const status = (entry.metadata?.transaction?.status || entry.status || '').toLowerCase();
                        return amt === transaction.totalAmount && ['settlement', 'success', 'capture'].includes(status);
                    });

                    if (found) isPaid = true;
                    if (result.tokenRefreshed) {
                        await updateDoc(mRef, {
                            accessToken: result.newAccessToken,
                            refreshToken: result.newRefreshToken,
                            updatedAt: serverTimestamp()
                        });
                    }
                } catch (e) {
                    console.error('[Status API] GoBiz check failed:', e);
                }
            }
        } else if (transaction.toolType === 'orderKuota' && transaction.merchantId) {
            const mRef = doc(db, 'users', user.id, 'orderKuotaMerchants', transaction.merchantId);
            const mSnap = await getDoc(mRef);

            if (mSnap.exists()) {
                const m = mSnap.data();
                try {
                    const res = await okGetMutasi(m.okUsername, m.okAuthToken || m.okToken);
                    if (res.result) {
                        const found = res.result.find((h: any) => {
                            const kredit = parseInt(h.kredit.replace(/\./g, '')) || 0;
                            return kredit === transaction.totalAmount && h.status === 'IN';
                        });
                        if (found) isPaid = true;
                    }
                } catch (e) {
                    console.error('[Status API] OrderKuota check failed:', e);
                }
            }
        }
        if (isPaid) {
            await updateDoc(doc(db, 'transactions', transId), {
                paymentStatus: 'paid',
                paidAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            return NextResponse.json({
                status: 'success', code: 200,
                message: 'Pembayaran berhasil dideteksi',
                data: {
                    trx_id: transaction.trxId,
                    ref_id: transaction.refId,
                    amount: transaction.amount,
                    total_amount: transaction.totalAmount,
                    payment_status: 'paid',
                    paid_at: new Date().toISOString()
                },
            });
        }
        return NextResponse.json({
            status: 'success', code: 200,
            message: 'Menunggu pembayaran',
            data: {
                trx_id: transaction.trxId,
                ref_id: transaction.refId,
                amount: transaction.amount,
                total_amount: transaction.totalAmount,
                payment_status: 'pending',
                paid_at: null
            },
        });

    } catch (error: any) {
        console.error('Status API error:', error);
        return NextResponse.json(
            { status: 'error', code: 500, message: `Server error: ${error.message}` },
            { status: 500 }
        );
    }
}


