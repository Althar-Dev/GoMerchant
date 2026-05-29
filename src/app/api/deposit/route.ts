import { NextRequest, NextResponse } from 'next/server';

/**
 * Deposit API
 * Logika pembuatan transaksi telah dipindahkan ke sisi klien (page.tsx) 
 * untuk mengikuti aturan mutasi Firestore Client-side Only.
 */
export async function POST(req: NextRequest) {
    return NextResponse.json({ 
        status: 'error', 
        message: 'Endpoint ini telah didekompresi. Silakan buat deposit langsung melalui dashboard user.' 
    }, { status: 410 });
}

