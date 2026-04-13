
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { collection, query, where, getDocs, doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { hashPassword, generateOtp } from '@/lib/auth';
import { checkRateLimit } from '@/lib/rateLimit';

/**
 * Register API - Tahap 1: Pengiriman OTP via Telegram
 */
export async function POST(req: NextRequest) {
    try {
        const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || '127.0.0.1';
        const rateLimit = await checkRateLimit(`register:${clientIp}`, 5, 60);
        
        if (!rateLimit.allowed) {
            return NextResponse.json(
                { status: 'error', message: 'Terlalu banyak percobaan. Coba lagi dalam 1 menit' },
                { status: 429 }
            );
        }

        const body = await req.json();
        const { username, email, telegramId, password, confirmPassword } = body;

        if (!username || !email || !telegramId || !password || !confirmPassword) {
            return NextResponse.json({ status: 'error', message: 'Semua field wajib diisi' }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ status: 'error', message: 'Password tidak cocok' }, { status: 400 });
        }

        const { firestore: db } = initializeFirebase();
        
        const usersRef = collection(db, 'users');
        const qEmail = query(usersRef, where('email', '==', email));
        const snapEmail = await getDocs(qEmail);

        if (!snapEmail.empty) {
            return NextResponse.json({ status: 'error', message: 'Email sudah terdaftar' }, { status: 409 });
        }

        const botSnap = await getDoc(doc(db, 'settings', 'bot'));
        const botSettings = botSnap.data();

        if (!botSettings || !botSettings.botToken) {
            return NextResponse.json({ status: 'error', message: 'Sistem Bot belum dikonfigurasi oleh Admin.' }, { status: 500 });
        }

        const otp = generateOtp();
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

        const message = `🔐 <b>Kode Verifikasi GomerchPay</b>\n\nKode OTP Anda adalah: <code>${otp}</code>\n\nJangan berikan kode ini kepada siapapun. Kode berlaku selama 5 menit.`;
        
        const tgRes = await fetch(`https://api.telegram.org/bot${botSettings.botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramId,
                text: message,
                parse_mode: 'HTML'
            })
        });

        const tgData = await tgRes.json();

        if (!tgData.ok) {
            return NextResponse.json({ 
                status: 'error', 
                message: 'Gagal mengirim pesan ke Telegram ID tersebut. Pastikan Anda sudah memulai chat dengan bot.' 
            }, { status: 400 });
        }

        const hashedPassword = await hashPassword(password);

        const otpRef = doc(db, 'otp_verifications', email);
        await setDoc(otpRef, {
            email,
            otp,
            username,
            telegramId,
            hashedPassword,
            expiresAt,
            createdAt: serverTimestamp()
        });

        return NextResponse.json({
            status: 'success',
            message: 'Kode OTP telah dikirim ke Telegram Anda',
            data: { email }
        });
    } catch (error: any) {
        console.error('Register error:', error);
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
