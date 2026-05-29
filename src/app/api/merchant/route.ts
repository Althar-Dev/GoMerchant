
import { NextRequest, NextResponse } from 'next/server';
import { GobizService } from '@/lib/gobiz';

/**
 * Endpoint ini sekarang hanya bertugas meminta OTP dari GoBiz.
 * Tidak ada pengecekan auth server-side karena Firestore ditangani di Client.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { phoneNumber } = body;

        if (!phoneNumber) {
            return NextResponse.json({ status: 'error', message: 'Nomor telepon wajib diisi' }, { status: 400 });
        }

        let cleanPhone = phoneNumber.replace(/\D/g, '');
        if (cleanPhone.startsWith('62')) cleanPhone = cleanPhone.slice(2);
        if (cleanPhone.startsWith('0')) cleanPhone = cleanPhone.slice(1);

        const gobiz = new GobizService();
        const result = await gobiz.requestOtp(cleanPhone);

        return NextResponse.json({
            status: 'success',
            message: result.requiresOtp ? 'OTP telah dikirim' : 'Berhasil',
            data: {
                requiresOtp: result.requiresOtp,
                otpToken: result.otpToken,
                otpLength: result.otpLength,
                xUniqueid: gobiz.getXUniqueid(),
                phoneNumber: cleanPhone
            },
        });
    } catch (error: any) {
        console.error('Request OTP error:', error);
        return NextResponse.json(
            { status: 'error', message: error.response?.data?.message || 'Gagal mengirim OTP' },
            { status: 500 }
        );
    }
}

