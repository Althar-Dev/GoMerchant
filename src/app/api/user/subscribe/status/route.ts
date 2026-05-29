import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { 
    doc, 
    getDoc, 
    collection, 
    serverTimestamp, 
    Timestamp,
    writeBatch
} from 'firebase/firestore';
import { GobizService } from '@/lib/gobiz';
import { normalizeAmount } from '@/lib/amountUtils';

/**
 * API untuk memverifikasi status pembayaran otomatis secara manual (Triggered by button).
 * Mengecek mutasi pada akun GoPay Merchant Admin.
 */
export async function GET(req: NextRequest) {
    try {
        const { firestore: db } = initializeFirebase();
        const id = req.nextUrl.searchParams.get('id');

        if (!id) {
            return NextResponse.json({ status: 'error', message: 'ID transaksi tidak valid.' }, { status: 400 });
        }

        // 1. Ambil data transaksi dari koleksi global
        const txRef = doc(db, 'transactions', id);
        const txSnap = await getDoc(txRef);
        if (!txSnap.exists()) {
            return NextResponse.json({ status: 'error', message: 'Data transaksi tidak ditemukan.' }, { status: 404 });
        }

        const transaction = txSnap.data();
        if (transaction.paymentStatus === 'paid') {
            return NextResponse.json({ status: 'success', data: { payment_status: 'paid' } });
        }

        // 2. Cek Expiry
        const now = new Date();
        const expiryDate = transaction.expiresAt instanceof Timestamp ? transaction.expiresAt.toDate() : new Date(transaction.expiresAt);
        
        if (now > expiryDate) {
            await writeBatch(db).update(txRef, { paymentStatus: 'expired', updatedAt: serverTimestamp() }).commit();
            return NextResponse.json({ status: 'success', data: { payment_status: 'expired' } });
        }

        // 3. Ambil Kredensial Admin dari settings
        const settingsSnap = await getDoc(doc(db, 'business', 'settings'));
        const settings = settingsSnap.data();

        if (!settings?.adminUid || !settings?.adminMerchantId) {
            return NextResponse.json({ 
                status: 'error', 
                message: 'Konfigurasi Admin belum lengkap. Hubungi pemilik sistem.' 
            }, { status: 503 });
        }

        // 4. Ambil Token Admin GoPay
        const adminMerchantRef = doc(db, 'users', settings.adminUid, 'GomerchPays', settings.adminMerchantId);
        const adminMerchantSnap = await getDoc(adminMerchantRef);

        if (!adminMerchantSnap.exists()) {
            return NextResponse.json({ status: 'error', message: 'Akun GoPay Admin tidak terhubung.' }, { status: 503 });
        }

        const adminMerchant = adminMerchantSnap.data();

        // 5. Cek Mutasi GoBiz
        const gobiz = new GobizService(adminMerchant.xUniqueid);
        const result = await gobiz.getTransactionsWithAutoRefresh(
            settings.adminMerchantId,
            adminMerchant.accessToken,
            adminMerchant.refreshToken,
            { size: 50 } 
        );

        const entries = result.data?.hits || result.data?.data?.journals || [];
        const foundPayment = entries.find((entry: any) => {
            let entryAmount = 0;
            if (entry.metadata?.transaction) {
                entryAmount = normalizeAmount(entry.metadata.transaction.gross_amount || entry.metadata.transaction.amount);
            } else {
                entryAmount = normalizeAmount(entry.amount);
            }
            
            // GoBiz biasanya dalam sen, jadi kita bagi 100 jika lebih dari nominal wajar
            let normalizedEntryAmount = entryAmount;
            if (entryAmount >= transaction.totalAmount * 100) {
                normalizedEntryAmount = Math.round(entryAmount / 100);
            }
            
            const rawStatus = (entry.metadata?.transaction?.status || entry.status || '').toLowerCase();
            const isValidStatus = ['settlement', 'success', 'capture'].includes(rawStatus);
            
            return normalizedEntryAmount === transaction.totalAmount && isValidStatus;
        });

        // 6. Jika ditemukan, update User & Transaksi (Batch)
        if (foundPayment) {
            const batch = writeBatch(db);
            
            // Update Status Transaksi
            batch.update(txRef, {
                paymentStatus: 'paid',
                paidAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            });

            // Update Paket User
            if (transaction.toolType === 'subscription' && transaction.planId) {
                const planSnap = await getDoc(doc(db, 'plans', transaction.planId));
                if (planSnap.exists()) {
                    const plan = planSnap.data();
                    const expiresAt = new Date(Date.now() + (plan.durationDays || 30) * 24 * 60 * 60 * 1000);

                    batch.update(doc(db, 'users', transaction.userId), {
                        planId: transaction.planId,
                        planExpiresAt: Timestamp.fromDate(expiresAt),
                        updatedAt: serverTimestamp()
                    });
                }
            }

            // Update Saldo jika tipenya Deposit
            if (transaction.toolType === 'deposit') {
                batch.update(doc(db, 'users', transaction.userId), {
                    saldo: (transaction.currentSaldo || 0) + transaction.amount,
                    updatedAt: serverTimestamp()
                });
            }

            await batch.commit();

            return NextResponse.json({
                status: 'success',
                data: { payment_status: 'paid' }
            });
        }

        // 7. Simpan Token baru jika ter-refresh
        if (result.tokenRefreshed && result.newAccessToken) {
            await writeBatch(db).update(adminMerchantRef, {
                accessToken: result.newAccessToken,
                refreshToken: result.newRefreshToken,
                updatedAt: serverTimestamp()
            }).commit();
        }

        return NextResponse.json({
            status: 'success',
            data: { 
                payment_status: 'pending',
                message: 'Dana belum masuk. Pastikan Anda sudah transfer nominal yang sesuai termasuk kode unik.'
            }
        });

    } catch (error: any) {
        console.error('[VerifyStatus Error]', error);
        return NextResponse.json({ 
            status: 'error', 
            message: error.message || 'Terjadi kesalahan saat memeriksa mutasi.'
        }, { status: 500 });
    }
}


