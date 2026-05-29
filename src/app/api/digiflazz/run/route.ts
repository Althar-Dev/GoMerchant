import { NextRequest } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { runSellerAutomation, SellerConfig } from '@/lib/digiflazz';
import { initializeFirebase } from '@/firebase/init';
import { doc, getDoc, updateDoc, increment, collection, addDoc, serverTimestamp, runTransaction } from 'firebase/firestore';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return new Response(JSON.stringify({ status: 'error', message: 'Unauthorized' }), {
                status: 401, headers: { 'Content-Type': 'application/json' },
            });
        }

        if (user.saldo < 15) {
            return new Response(JSON.stringify({ status: 'error', message: `Saldo tidak cukup (${user.saldo}P). Minimum 15P untuk menjalankan tools.` }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            });
        }

        const { firestore: db } = initializeFirebase();
        const accountRef = doc(db, 'users', user.id, 'digiflazzAccounts', 'main');
        const accountSnap = await getDoc(accountRef);
        const account = accountSnap.data();

        if (!accountSnap.exists() || !account?.isConnected) {
            return new Response(JSON.stringify({ status: 'error', message: 'Belum login ke Digiflazz. Login terlebih dahulu.' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            });
        }

        const body = await req.json();
        const config: SellerConfig = {
            kategori: body.kategori || '',
            brand: body.brand || '',
            type: body.type || '',
            autoKodeProduk: body.autoKodeProduk ?? true,
            autoHargaMax: body.autoHargaMax ?? true,
            pilihTermurah: body.pilihTermurah ?? false,
            sellerRandom: body.sellerRandom ?? true,
            ratingMinimal: body.ratingMinimal ?? 0,
            blockedSellers: body.blockedSellers || [],
        };

        if (!config.kategori || !config.brand) {
            return new Response(JSON.stringify({ status: 'error', message: 'Kategori dan Brand wajib diisi' }), {
                status: 400, headers: { 'Content-Type': 'application/json' },
            });
        }

        const encoder = new TextEncoder();
        const stream = new ReadableStream({
            async start(controller) {
                const log = (msg: string) => {
                    try {
                        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'log', message: msg })}\n\n`));
                    } catch { }
                };

                const checkSaldo = async (): Promise<number> => {
                    const uSnap = await getDoc(doc(db, 'users', user.id));
                    return uSnap.data()?.saldo ?? 0;
                };

                const deductSaldo = async (): Promise<boolean> => {
                    try {
                        let success = false;
                        await runTransaction(db, async (transaction) => {
                            const userRef = doc(db, 'users', user.id);
                            const uSnap = await transaction.get(userRef);
                            const currentSaldo = uSnap.data()?.saldo ?? 0;
                            
                            if (currentSaldo < 15) throw new Error('Insufficient balance');
                            
                            transaction.update(userRef, { saldo: increment(-15), updatedAt: serverTimestamp() });
                            
                            const logRef = doc(collection(userRef, 'saldoLogs'));
                            transaction.set(logRef, {
                                userId: user.id,
                                amount: -15,
                                balanceBefore: currentSaldo,
                                balanceAfter: currentSaldo - 15,
                                type: 'usage',
                                description: 'Digiflazz seller automation',
                                createdAt: serverTimestamp()
                            });
                            success = true;
                        });
                        return success;
                    } catch { return false; }
                };

                try {
                    log('🚀 Memulai Digiflazz Seller Automation...');
                    const result = await runSellerAutomation(
                        account.cookiesData,
                        config,
                        log,
                        checkSaldo,
                        deductSaldo
                    );

                    await updateDoc(accountRef, { lastUsedAt: serverTimestamp() });

                    if (!result.success && result.processed === 0) {
                        await updateDoc(accountRef, { isConnected: false });
                    }

                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'done', ...result })}\n\n`));
                } catch (error) {
                    const msg = error instanceof Error ? error.message : 'Unknown error';
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'error', message: msg })}\n\n`));
                } finally {
                    controller.close();
                }
            },
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                'Connection': 'keep-alive',
            },
        });
    } catch (error) {
        console.error('Digiflazz run error:', error);
        return new Response(JSON.stringify({ status: 'error', message: 'Server error' }), {
            status: 500, headers: { 'Content-Type': 'application/json' },
        });
    }
}

