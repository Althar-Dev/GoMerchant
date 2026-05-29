import { NextRequest } from 'next/server';
import { getBalance } from '@/lib/orkut/orderkuota';
import { success, error, handleCors } from '@/lib/orkut/response';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, token } = body;
    if (!username || !token) {
      return error('MISSING_PARAMS', 'username dan token wajib diisi', 400);
    }

    const result = await getBalance(username, token) as any;
    const accountData = result?.account?.results || result?.['0']?.results;
    const qrisData = result?.qris_menu?.results || result?.['1']?.results;

    if (!accountData) {
      return error('BALANCE_ERROR', 'Gagal mendapatkan data saldo dari OrderKuota', 500);
    }

    return success({
      balance: accountData.balance || 0,
      qris_balance: qrisData?.qris_balance || accountData.qris_balance || 0,
      name: accountData.name || '',
      username: accountData.username || username
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat mengambil saldo';
    return error('BALANCE_ERROR', message, 500);
  }
}

export async function OPTIONS() {
  return handleCors();
}

