
import { NextRequest, NextResponse } from 'next/server';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, collection, query, where, getDocs, setDoc, serverTimestamp, addDoc } from 'firebase/firestore';
import { GobizService } from '@/lib/gobiz';
import { normalizeAmount } from '@/lib/amountUtils';

/**
 * Telegram Webhook Receiver
 * Dilengkapi dengan Extensive Logging ke Firestore bot_logs.
 */

async function addBotLog(db: any, message: string, type: 'info' | 'error' | 'success' = 'info') {
    try {
        await addDoc(collection(db, 'bot_logs'), {
            message,
            type,
            timestamp: serverTimestamp()
        });
    } catch (e) {
        console.error('Failed to write log to Firestore:', e);
    }
}

export async function POST(req: NextRequest) {
    const { firestore: db } = initializeFirebase();
    let botToken = '';

    try {
        const update = await req.json();
        
        const botSnap = await getDoc(doc(db, 'settings', 'bot'));
        const botSettings = botSnap.data();
        if (!botSettings?.botToken) return NextResponse.json({ ok: true });
        botToken = botSettings.botToken;

        if (update.message?.text) {
            const chatId = update.message.chat.id;
            const text = update.message.text.trim().toLowerCase();
            const from = update.message.from;

            await addBotLog(db, `Received message: "${text}" from ${from.first_name} (${chatId})`);

            if (text === '/start') {
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('telegramId', '==', chatId.toString()));
                const userSnap = await getDocs(q);

                if (!userSnap.empty) {
                    const userData = userSnap.docs[0].data();
                    await addBotLog(db, `User ${userData.displayName} connected. Sending menu.`);
                    const replyText = `👋🏻 <b>Welcome Back</b>\n\nHello <b>${userData.displayName || from.first_name}</b>!,\nHow can I help you today?\n\nPlease use the menu below:`;
                    await sendMenu(botToken, chatId, replyText);
                } else {
                    await addBotLog(db, `New user detected: ${from.first_name}. Creating tracking data.`);
                    const trackRef = doc(db, 't_merchant', `t_${chatId}`);
                    await setDoc(trackRef, {
                        firstName: from.first_name,
                        username: from.username || '',
                        chatId: chatId,
                        firstStartAt: serverTimestamp()
                    }, { merge: true });

                    const welcomeNew = `👋🏻 <b>Welcome ${from.first_name}</b>\n\nNow your account is connected ✅\n\nYour ID : <code>${chatId}</code>\n\n<blockquote>GomerchPay Official</blockquote>`;
                    
                    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: welcomeNew,
                            parse_mode: 'HTML',
                            reply_markup: {
                                inline_keyboard: [[{ text: 'Register Sekarang', url: 'https://dash.pay-gomerch.web.id/signup' }]]
                            }
                        })
                    });
                }
            } else if (text === '/help') {
                await addBotLog(db, `User requested /help`);
                await sendHelp(botToken, chatId);
            }
        }

        if (update.callback_query) {
            const callback = update.callback_query;
            const chatId = callback.from.id;
            const data = callback.data;

            await addBotLog(db, `Button clicked: "${data}" by User ID: ${chatId}`);
            await answerCallback(botToken, callback.id);
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('telegramId', '==', chatId.toString()));
            const userSnap = await getDocs(q);
            const userDoc = userSnap.empty ? null : userSnap.docs[0];

            if (!userDoc) {
                await addBotLog(db, `Callback Error: User ID ${chatId} not found in Firestore.`, 'error');
                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: "❌ <b>Akun tidak terdaftar.</b>\nSilakan register di dashboard web.", parse_mode: 'HTML' })
                });
                return NextResponse.json({ ok: true });
            }

            const u = userDoc.data();

            if (data === 'profile') {
                await addBotLog(db, `Fetching profile for ${u.displayName}`);
                let planName = 'Free Plan';
                if (u.planId) {
                    const pSnap = await getDoc(doc(db, 'plans', u.planId));
                    if (pSnap.exists()) planName = pSnap.data().name;
                }

                const profileText = `👤 <b>DETAIL AKUN</b>\n\n` +
                    `▫️ Nama: <b>${u.displayName}</b>\n` +
                    `▫️ Email: <code>${u.email}</code>\n` +
                    `▫️ Saldo: <b>Rp ${(u.saldo || 0).toLocaleString('id-ID')}</b>\n` +
                    `▫️ Paket: <b>${planName}</b>\n` +
                    `▫️ API Key: <tg-spoiler><code>${u.apiKey}</code></tg-spoiler>\n\n` +
                    `<i>Update via dashboard untuk perubahan data.</i>`;

                await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ chat_id: chatId, text: profileText, parse_mode: 'HTML' })
                });
                await addBotLog(db, `Profile sent to ${u.displayName}`, 'success');
            }

            if (data.startsWith('mutasi_')) {
                const page = parseInt(data.split('_')[1]) || 1;
                await addBotLog(db, `Fetching mutations (Page ${page}) for ${u.displayName}`);
                
                const mRef = collection(db, 'users', userDoc.id, 'GomerchPays');
                const mSnap = await getDocs(mRef);
                
                if (mSnap.empty) {
                    await addBotLog(db, `Mutasi Error: No GoPay Merchant connected for ${u.displayName}`, 'error');
                    return fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: "❌ <b>Merchant belum terhubung.</b>\nSilakan hubungkan akun GoPay di web.", parse_mode: 'HTML' })
                    });
                }

                const m = mSnap.docs[0].data();
                const gobiz = new GobizService(m.xUniqueid);
                
                try {
                    const result = await gobiz.getTransactionsWithAutoRefresh(mSnap.docs[0].id, m.accessToken, m.refreshToken, { size: 100 });
                    const allHits = result.data?.hits || result.data?.data?.journals || [];
                    
                    const ITEMS_PER_PAGE = 5;
                    const totalPages = Math.ceil(allHits.length / ITEMS_PER_PAGE);
                    const startIdx = (page - 1) * ITEMS_PER_PAGE;
                    const paginated = allHits.slice(startIdx, startIdx + ITEMS_PER_PAGE);

                    let mutasiText = `📑 <b>MUTASI (${page}/${totalPages || 1})</b>\n\n`;
                    
                    if (paginated.length === 0) {
                        mutasiText += "<i>Tidak ada riwayat transaksi.</i>";
                    } else {
                        paginated.forEach((h: any, idx: number) => {
                            const tx = h.metadata?.transaction || h;
                            const amt = normalizeAmount(tx.gross_amount || tx.amount || 0);
                            const status = (tx.status || 'SUCCESS').toUpperCase();
                            mutasiText += `<b>${startIdx + idx + 1}.</b> 💰 Rp ${amt.toLocaleString('id-ID')} | ${status}\n\n`;
                        });
                    }

                    const buttons = [];
                    const row = [];
                    if (page > 1) row.push({ text: '⬅️ Prev', callback_data: `mutasi_${page - 1}` });
                    if (page < totalPages) row.push({ text: 'Next ➡️', callback_data: `mutasi_${page + 1}` });
                    if (row.length > 0) buttons.push(row);
                    buttons.push([{ text: '🏠 Menu Utama', callback_data: 'main_menu' }]);

                    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            chat_id: chatId,
                            text: mutasiText,
                            parse_mode: 'HTML',
                            reply_markup: { inline_keyboard: buttons }
                        })
                    });
                    await addBotLog(db, `Mutations sent to ${u.displayName}`, 'success');
                } catch (e: any) {
                    await addBotLog(db, `GoBiz API Error: ${e.message}`, 'error');
                    await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ chat_id: chatId, text: "❌ <b>Gagal ambil mutasi.</b>\nPastikan koneksi merchant aktif.", parse_mode: 'HTML' })
                    });
                }
            }

            if (data === 'help_data') {
                await sendHelp(botToken, chatId);
                await addBotLog(db, `Help sent to ID: ${chatId}`);
            }

            if (data === 'main_menu') {
                await addBotLog(db, `Returning to main menu for ID: ${chatId}`);
                await sendMenu(botToken, chatId, "👋🏻 <b>Menu Utama</b>\nSilakan pilih menu di bawah ini:");
            }
        }

        return NextResponse.json({ ok: true });
    } catch (error: any) {
        await addBotLog(db, `CRITICAL WEBHOOK ERROR: ${error.message}`, 'error');
        return NextResponse.json({ ok: true });
    }
}

async function sendMenu(token: string, chatId: number, text: string) {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            chat_id: chatId,
            text: text,
            parse_mode: 'HTML',
            reply_markup: {
                inline_keyboard: [
                    [{ text: '📊 Dashboard', url: 'https://dash.pay-gomerch.web.id' }],
                    [
                        { text: '👤 Profile', callback_data: 'profile' },
                        { text: '📑 Mutasi', callback_data: 'mutasi_1' }
                    ],
                    [{ text: '💡 Help Center', callback_data: 'help_data' }]
                ]
            }
        })
    });
}

async function sendHelp(token: string, chatId: number) {
    const helpText = `💡 <b>SUPPORT CENTER</b>\n\n` +
        `Bot ini membantu Anda memantau transaksi secara real-time.\n\n` +
        `<b>Fitur:</b>\n` +
        `▫️ <b>Mutasi:</b> Cek 100 transaksi terakhir.\n` +
        `▫️ <b>Profile:</b> Cek saldo & API Key.\n\n` +
        `Butuh bantuan? Hubungi @althardev`;
    
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: chatId, text: helpText, parse_mode: 'HTML' })
    });
}

async function answerCallback(token: string, id: string) {
    await fetch(`https://api.telegram.org/bot${token}/answerCallbackQuery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ callback_query_id: id })
    });
}
