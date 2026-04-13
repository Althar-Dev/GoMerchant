
import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

/**
 * Setup Bot API (Admin Only)
 * Mendaftarkan URL webhook ke server Telegram.
 * Menggunakan domain pay-gomerch.web.id agar bypass middleware dashboard.
 */
export async function POST(req: NextRequest) {
    try {
        const admin = await getAuthUser();
        if (!admin || admin.role !== 'ADMIN') {
            return NextResponse.json({ status: 'error', message: 'Forbidden' }, { status: 403 });
        }

        const body = await req.json();
        const { botToken } = body;

        if (!botToken) {
            return NextResponse.json({ status: 'error', message: 'Bot Token is required' }, { status: 400 });
        }

        const webhookUrl = `https://pay-gomerch.web.id/bot/webhook`;

        console.log(`[Bot Setup] Registering Webhook: ${webhookUrl}`);

        const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                url: webhookUrl,
                allowed_updates: ["message", "callback_query"], 
                drop_pending_updates: true
            })
        });

        const tgData = await tgRes.json();

        if (tgData.ok) {
            return NextResponse.json({ 
                status: 'success', 
                message: `Webhook berhasil didaftarkan ke Telegram!`,
                webhookUrl: webhookUrl
            });
        } else {
            return NextResponse.json({ 
                status: 'error', 
                message: tgData.description || 'Gagal mendaftarkan webhook.' 
            }, { status: 400 });
        }

    } catch (error: any) {
        return NextResponse.json({ status: 'error', message: error.message }, { status: 500 });
    }
}
