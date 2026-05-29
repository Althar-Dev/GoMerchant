
import { NextRequest, NextResponse } from 'next/server';
import { okVerifyOtp, hasToken } from '@/lib/orderkuota';
import { encrypt } from '@/lib/encryption';

export async function POST(req: NextRequest) {
    try {
        const { okUsername, otp, projectName } = await req.json();

        if (!okUsername || !otp || !projectName) {
            return NextResponse.json(
                { status: 'error', message: 'Data tidak lengkap' },
                { status: 400 }
            );
        }

        const res = await okVerifyOtp(okUsername, otp);

        if (res.error) {
            return NextResponse.json({ status: 'error', message: res.error }, { status: 400 });
        }

        if (!res.result || !hasToken(res.result)) {
            return NextResponse.json(
                { status: 'error', message: 'Gagal mendapatkan token setelah verifikasi' },
                { status: 502 }
            );
        }

        const token = res.result;
        const encryptedToken = encrypt(token.token);

        return NextResponse.json({
            status: 'success',
            data: {
                okId: token.id,
                okUsername: token.username || okUsername,
                okName: token.name || null,
                okAuthToken: encryptedToken,
                okBalance: token.balance || null,
            },
        });
    } catch (error) {
        console.error('OK verify-otp error:', error);
        return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
    }
}

