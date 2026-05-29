import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { 
  initDb, 
  getAvailableSuffix, 
  createPendingTransaction 
} from '@/lib/orkut/db';
import { generateDynamicQris } from '@/lib/orkut/qris';
import { success, error, handleCors } from '@/lib/orkut/response';

const EXPIRY_SECONDS = 600; // 10 menit

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, token, amount, qris_static } = body;

    if (!username || !token || !amount) {
      return error('MISSING_PARAMS', 'username, token, dan amount wajib diisi', 400);
    }

    const baseAmount = parseInt(amount, 10);
    if (isNaN(baseAmount) || baseAmount <= 0) {
      return error('INVALID_AMOUNT', 'amount harus berupa angka positif', 400);
    }

    if (!qris_static) {
      return error('MISSING_PARAMS', 'qris_static (QRIS statis) wajib diisi', 400);
    }

    await initDb();

    const suffix = await getAvailableSuffix(username);
    const finalAmount = baseAmount + suffix;
    const qrisString = generateDynamicQris(qris_static, finalAmount);
    const now = Math.floor(Date.now() / 1000);
    const txId = uuidv4();
    await createPendingTransaction({
      id: txId,
      username,
      base_amount: baseAmount,
      unique_suffix: suffix,
      final_amount: finalAmount,
      qris_string: qrisString,
      created_at: now,
      expires_at: now + EXPIRY_SECONDS,
    });

    return success({
      transaction_id: txId,
      base_amount: baseAmount,
      unique_suffix: suffix,
      final_amount: finalAmount,
      qris_string: qrisString,
      expires_at: now + EXPIRY_SECONDS,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan sistem saat menghasilkan QRIS dinamis';
    return error('GENERATE_ERROR', message, 500);
  }
}

export async function OPTIONS() {
  return handleCors();
}


