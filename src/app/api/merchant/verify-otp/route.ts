import { NextRequest, NextResponse } from 'next/server';
import { GobizService } from '@/lib/gobiz';
import { encrypt } from '@/lib/encryption';

/**
 * Memverifikasi OTP dan mengembalikan token yang terenkripsi ke Client.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { otp, otpToken, xUniqueid } = body;

        if (!otp || !otpToken || !xUniqueid) {
            return NextResponse.json({ status: 'error', message: 'Data tidak lengkap' }, { status: 400 });
        }

        console.log(`[VerifyOTP] Attempting verification for xUniqueid: ${xUniqueid}`);

        const gobiz = new GobizService(xUniqueid);
        const result = await gobiz.verifyOtp(otp, otpToken);
        const encryptedAccess = encrypt(result.accessToken);
        const encryptedRefresh = encrypt(result.refreshToken);

        return NextResponse.json({
            status: 'success',
            data: {
                accessToken: encryptedAccess,
                refreshToken: encryptedRefresh,
                xUniqueid
            },
        });
    } catch (error: any) {
        const errorData = error.response?.data;
        const errorMessage = errorData?.message || errorData?.error_description || error.message || 'Verifikasi OTP gagal';
        
        console.error('[VerifyOTP] Error from GoBiz:', {
            status: error.response?.status,
            data: errorData,
            message: errorMessage
        });

        return NextResponse.json(
            { status: 'error', message: `Gagal verifikasi: ${errorMessage}` },
            { status: error.response?.status || 500 }
        );
    }
}

