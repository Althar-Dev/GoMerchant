import { NextRequest } from 'next/server';
import { requestOtp } from '@/lib/orkut/orderkuota';
import { success, error, handleCors } from '@/lib/orkut/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return error('MISSING_PARAMS', 'username dan password wajib diisi', 400);
    }

    const result = await requestOtp(username, password);
    return success(result);
  } catch (err: any) {
    const status = err.status || 500;
    const message = err.message || 'Terjadi kesalahan saat meminta OTP';
    return error('OTP_ERROR', message, status);
  }
}

/**
 * Handler untuk preflight request CORS.
 */
export async function OPTIONS() {
  return handleCors();
}


