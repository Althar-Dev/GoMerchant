
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc } from 'firebase/firestore';

/**
 * Welcome Message Trigger API
 * Mengirim pesan selamat datang ke Telegram setelah user berhasil mendaftar.
 */
export async function POST(req: NextRequest) {
    try {
        const { telegramId, username } = await req.json();

        if (!telegramId) {
            return NextResponse.json({ ok: false }, { status: 400 });
        }

        const { firestore: db } = initializeFirebase();
        const botSnap = await getDoc(doc(db, 'settings', 'bot'));
        const botSettings = botSnap.data();

        if (!botSettings || !botSettings.botToken) {
            return NextResponse.json({ ok: false }, { status: 500 });
        }

        const botToken = botSettings.botToken;
        const text = `👋🏻 <b>Halo ${username}!,</b>\n\nYour account has been successfully registered.\n\nThe following menu we provide:`;

        await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: telegramId,
                text: text,
                parse_mode: 'HTML',
                reply_markup: {
                    inline_keyboard: [
                        [{ text: '📊 Dashboard', url: 'https://t.me/GomerchPay_bot/app' }],
                        [
                            { text: '👤 Profile', callback_data: 'profile' },
                            { text: '📑 Mutasi', callback_data: 'mutasi_1' }
                        ],
                        [{ text: '💡 Help', callback_data: 'help' }]
                    ]
                }
            })
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('[Bot Welcome] Error:', error);
        return NextResponse.json({ ok: false }, { status: 500 });
    }
}

