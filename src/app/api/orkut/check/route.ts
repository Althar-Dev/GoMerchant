import { NextRequest } from 'next/server';
import { getQrisHistory } from '@/lib/orkut/orderkuota';
import {
  getPendingTransaction,
  deletePendingTransaction,
  createPaidTransaction,
  getPaidTransaction,
} from '@/lib/orkut/db';
import { success, error, handleCors } from '@/lib/orkut/response';

const PAID_EXPIRY_SECONDS = 3600; // 1 jam

/**
 * Handler untuk mengecek status pembayaran QRIS OrderKuota.
 * Mencocokkan data di Firestore dengan mutasi real-time dari API OrderKuota.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, token, transaction_id } = body;

    if (!username || !token || !transaction_id) {
      return error('MISSING_PARAMS', 'username, token, dan transaction_id wajib diisi', 400);
    }

    const paidTx = await getPaidTransaction(transaction_id);
    if (paidTx) {
      return success({
        status: 'paid',
        final_amount: paidTx.final_amount,
        paid_at: paidTx.paid_at,
      });
    }

    const tx = await getPendingTransaction(transaction_id);
    if (!tx) {
      return success({ status: 'not_found' });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > tx.expires_at) {
      await deletePendingTransaction(transaction_id);
      return success({ status: 'expired' });
    }

    const historyResult = await getQrisHistory(username, token) as any;

    const historyData = historyResult?.qris_ajaib_history?.results 
      || historyResult?.qris_history?.results
      || historyResult?.result
      || [];
    
    const history = Array.isArray(historyData) ? historyData : [];
    
    const found = history.find((h: any) => {
      const kreditStr = String(h.kredit || '').replace(/\./g, '');
      const amt = parseInt(kreditStr, 10) || 0;
      return amt === tx.final_amount && h.status === 'IN';
    });

    if (found) {
      await deletePendingTransaction(transaction_id);
      await createPaidTransaction({
        id: transaction_id,
        username,
        final_amount: tx.final_amount,
        paid_at: now,
        expires_at: now + PAID_EXPIRY_SECONDS,
      });

      return success({
        status: 'paid',
        final_amount: tx.final_amount,
        paid_at: now,
      });
    }

    return success({
      status: 'pending',
      final_amount: tx.final_amount,
      expires_in: tx.expires_at - now,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Terjadi kesalahan saat memeriksa pembayaran';
    return error('CHECK_ERROR', message, 500);
  }
}

export async function OPTIONS() {
  return handleCors();
}


