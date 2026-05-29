import { NextRequest, NextResponse } from 'next/server';

/**
 * Simulasi Callback Pembayaran
 * Di lingkungan prototype ini, status diperbarui secara otomatis atau manual oleh Admin.
 */
export async function POST(req: NextRequest) {
    return NextResponse.json({ status: 'pending', message: 'Menunggu validasi mutasi' });
}


