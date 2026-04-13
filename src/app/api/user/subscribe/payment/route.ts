import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, collection } from 'firebase/firestore';
import { v4 as uuidv4 } from 'uuid';

/**
 * GoPay Merchant Admin Payment Generator
 * Membuat invoice deposit/langganan yang harus dibayar ke QRIS Pusat Admin.
 */
export async function POST(req: NextRequest) {
    try {
        const { planId, userId } = await req.json();
        const { firestore: db } = initializeFirebase();

        if (!planId || !userId) {
            return NextResponse.json({ status: 'error', message: 'Missing parameters' }, { status: 400 });
        }

        // 1. Ambil data Plan & User
        const planRef = doc(db, 'plans', planId);
        const userRef = doc(db, 'users', userId);
        const settingsRef = doc(db, 'business', 'settings');
        
        const [planSnap, userSnap, settingsSnap] = await Promise.all([
            getDoc(planRef),
            getDoc(userRef),
            getDoc(settingsRef)
        ]);
        
        if (!planSnap.exists()) return NextResponse.json({ status: 'error', message: 'Plan not found' }, { status: 404 });
        if (!userSnap.exists()) return NextResponse.json({ status: 'error', message: 'User not found' }, { status: 404 });
        
        const plan = planSnap.data();
        const user = userSnap.data();
        const settings = settingsSnap.data();

        // 2. Jika paket gratis, langsung aktifkan
        if (plan.price === 0) {
            const expiresAtDate = new Date();
            expiresAtDate.setDate(expiresAtDate.getDate() + (plan.durationDays || 30));

            await setDoc(userRef, {
                planId: planId,
                planExpiresAt: Timestamp.fromDate(expiresAtDate),
                updatedAt: serverTimestamp()
            }, { merge: true });

            return NextResponse.json({ status: 'success', message: 'Free plan activated' });
        }

        // 3. Pastikan Admin sudah setup BaseQR di settings
        if (!settings?.gopayBaseQr) {
            return NextResponse.json({ 
                status: 'error', 
                message: 'Admin belum melakukan setup QRIS pusat (BaseQR). Hubungi bantuan.' 
            }, { status: 503 });
        }

        // 4. Generate Kode Unik & Trx ID
        const internalTrxId = `SUB-${uuidv4().substring(0, 8).toUpperCase()}`;
        const uniqueCode = Math.floor(Math.random() * 900) + 100; // 3 digit unik (100-999)
        const totalAmount = plan.price + uniqueCode;
        const expiresAtDate = new Date(Date.now() + 15 * 60 * 1000); // Expired dalam 15 menit

        // 5. Simpan Transaksi di Firestore
        await setDoc(doc(db, 'transactions', internalTrxId), {
            userId,
            planId,
            trxId: internalTrxId,
            amount: plan.price,
            uniqueCode: uniqueCode,
            totalAmount: totalAmount,
            toolType: 'subscription',
            paymentStatus: 'pending',
            qrString: settings.gopayBaseQr, // Simpan QRIS statis admin di sini
            createdAt: serverTimestamp(),
            expiresAt: Timestamp.fromDate(expiresAtDate)
        });

        return NextResponse.json({
            status: 'success',
            data: { 
                trxId: internalTrxId,
                totalAmount: totalAmount,
                uniqueCode: uniqueCode,
                qrString: settings.gopayBaseQr,
                expiresAt: expiresAtDate.toISOString()
            }
        });

    } catch (error: any) {
        console.error('[Payment API Error]', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
