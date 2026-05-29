import { NextRequest } from 'next/server';
import { getToken } from '@/lib/orkut/orderkuota';
import { success, error, handleCors } from '@/lib/orkut/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, otp } = body;

    if (!username || !otp) {
      return error('MISSING_PARAMS', 'username dan otp wajib diisi', 400);
    }

    const result = await getToken(username, otp);

    return success(result);
  } catch (err: any) {
    const status = err.status || 500;
    const message = err.message || 'Terjadi kesalahan saat mengambil token';
    return error('TOKEN_ERROR', message, status);
  }
}

export async function OPTIONS() {
  return handleCors();
}


