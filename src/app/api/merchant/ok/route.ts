import { NextRequest, NextResponse } from 'next/server';
import { okLoginRequest, isOtpRequired, hasToken } from '@/lib/orderkuota';
import { encrypt } from '@/lib/encryption';

/**
 * Endpoint ini hanya bertugas melakukan request login ke OrderKuota.
 * Data tidak lagi disimpan di sini, melainkan dikembalikan ke Client untuk disimpan di Firestore.
 */
export async function POST(req: NextRequest) {
    try {
        const { projectName, okUsername, okPassword } = await req.json();

        if (!projectName || !okUsername || !okPassword) {
            return NextResponse.json(
                { status: 'error', message: 'Nama project, username, dan password wajib diisi' },
                { status: 400 }
            );
        }

        const loginRes = await okLoginRequest(okUsername, okPassword);

        if (loginRes.error) {
            return NextResponse.json(
                { status: 'error', message: loginRes.error },
                { status: 400 }
            );
        }

        if (!loginRes.result) {
            return NextResponse.json(
                { status: 'error', message: 'OrderKuota API tidak memberikan respons yang valid. Silakan coba beberapa saat lagi.' },
                { status: 502 }
            );
        }

        if (isOtpRequired(loginRes.result)) {
            return NextResponse.json({
                status: 'success',
                data: {
                    requiresOtp: true,
                    otpMethod: loginRes.result.otp,
                    otpTarget: loginRes.result.otp_value,
                    okUsername,
                    projectName,
                },
            });
        }

        if (hasToken(loginRes.result)) {
            const tokenData = loginRes.result;
            const encryptedToken = encrypt(tokenData.token);

            return NextResponse.json({
                status: 'success',
                message: 'Akun OrderKuota berhasil terhubung',
                data: {
                    requiresOtp: false,
                    okId: tokenData.id,
                    okUsername: tokenData.username || okUsername,
                    okName: tokenData.name || null,
                    okAuthToken: encryptedToken,
                    okBalance: tokenData.balance || null,
                },
            });
        }

        return NextResponse.json(
            { status: 'error', message: 'Format respons dari OrderKuota tidak dikenali' },
            { status: 502 }
        );

    } catch (error: any) {
        console.error('POST OK merchant error:', error);
        return NextResponse.json(
            { status: 'error', message: `Terjadi kesalahan internal: ${error.message}` },
            { status: 500 }
        );
    }
}
