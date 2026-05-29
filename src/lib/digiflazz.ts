import puppeteer from 'puppeteer';
import { encrypt, decrypt } from '@/lib/encryption';

const LOGIN_URL = 'https://member.digiflazz.com/login';
const DASHBOARD_URL = 'https://member.digiflazz.com/buyer-area';
const PRODUCT_URL = 'https://member.digiflazz.com/buyer-area/product';

export interface SellerConfig {
    kategori: string;
    brand: string;
    type?: string;
    autoKodeProduk: boolean;
    autoHargaMax: boolean;
    pilihTermurah: boolean;
    sellerRandom?: boolean;
    ratingMinimal?: number;
    blockedSellers?: string[];
}

export interface SellerResult {
    product: string;
    sellerName: string;
    harga: number;
    rating: number;
}

export type LogCallback = (msg: string) => void;
function randomDelay(min = 500, max = 1500): Promise<void> {
    return new Promise((resolve) => {
        const delay = Math.floor(Math.random() * (max - min + 1)) + min;
        setTimeout(resolve, delay);
    });
}

async function launchBrowser() {
    return await puppeteer.launch({
        headless: true,
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-infobars',
            '--disable-gpu',
            '--disable-dev-shm-usage',
        ],
    });
}

export function encryptCookies(cookies: object[]): string {
    return encrypt(JSON.stringify(cookies));
}

export function decryptCookies(encrypted: string): object[] {
    return JSON.parse(decrypt(encrypted));
}

export async function loginDigiflazz(
    email: string,
    password: string,
    log: LogCallback
): Promise<{ status: 'success' | 'need_2fa' | 'error'; cookies?: string; message?: string; pageHtml?: string }> {
    let browser;
    try {
        log('🖥️ Membuka browser headless...');
        browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7' });

        log('🌐 Membuka halaman login Digiflazz...');
        await page.goto(LOGIN_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(3000, 5000);

        log('📧 Mengisi email...');
        const emailFilled = await page.evaluate((em: string) => {
            const inputs = Array.from(document.querySelectorAll('input')).filter(el => {
                const r = el.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
            });
            const emailInput = inputs.find(i => i.type === 'email' || i.type === 'text') || inputs[0];
            if (emailInput) { emailInput.value = ''; emailInput.focus(); return true; }
            return false;
        }, email);
        if (!emailFilled) { await browser.close(); return { status: 'error', message: 'Tidak bisa menemukan form login' }; }
        await page.type('input[type="email"], input[type="text"]', email, { delay: 30 });
        await randomDelay(300, 500);

        log('🔑 Mengisi password...');
        await page.type('input[type="password"]', password, { delay: 30 });
        await randomDelay(300, 500);

        log('🚀 Klik tombol login...');
        await page.evaluate(() => {
            const btns = [...document.querySelectorAll('button'), ...document.querySelectorAll('input[type="submit"]')];
            for (const btn of btns) {
                const text = (btn.textContent || '').toLowerCase();
                const r = (btn as HTMLElement).getBoundingClientRect();
                if (r.width > 0 && (text.includes('login') || text.includes('masuk') || (btn as HTMLInputElement).type === 'submit')) {
                    (btn as HTMLElement).click(); return;
                }
            }
            if (btns.length > 0) (btns[0] as HTMLElement).click();
        });
        await randomDelay(5000, 8000);
        const bodyText = await page.evaluate(() => document.body.innerText.toLowerCase());
        const currentUrl = page.url();
        const is2FA = bodyText.includes('verifikasi') || bodyText.includes('2fa') || bodyText.includes('a2f') ||
            bodyText.includes('otp') || bodyText.includes('authenticator') || bodyText.includes('kode keamanan') ||
            currentUrl.includes('2fa') || currentUrl.includes('verify') || currentUrl.includes('otp');

        if (is2FA) {
            log('🔐 Halaman 2FA terdeteksi — masukkan kode verifikasi');
            const cookies = await page.cookies();
            const encCookies = encryptCookies(cookies);
            await browser.close();
            return { status: 'need_2fa', cookies: encCookies, message: 'Masukkan kode A2F dari authenticator app' };
        }

        const finalUrl = page.url();
        const loginSuccess = finalUrl.includes('buyer-area') || finalUrl.includes('seller-area') || finalUrl.includes('dashboard') ||
            (!finalUrl.includes('login') && !finalUrl.includes('2fa') && !finalUrl.includes('verify'));

        if (loginSuccess) {
            log('✅ Login berhasil!');
            const cookies = await page.cookies();
            const encCookies = encryptCookies(cookies);
            await browser.close();
            return { status: 'success', cookies: encCookies };
        } else {
            const errorText = await page.evaluate(() => {
                const alerts = document.querySelectorAll('.alert, .error, .text-danger, .text-red-500, [role="alert"]');
                return Array.from(alerts).map(el => (el as HTMLElement).innerText.trim()).filter(t => t).join(' | ');
            });
            log(`❌ Login gagal: ${errorText || 'Periksa email dan password'}`);
            await browser.close();
            return { status: 'error', message: errorText || 'Login gagal, periksa email dan password' };
        }
    } catch (error) {
        if (browser) await browser.close();
        const msg = error instanceof Error ? error.message : 'Unknown error';
        log(`❌ Error: ${msg}`);
        return { status: 'error', message: msg };
    }
}

export async function verify2FA(
    tempCookies: string,
    code: string,
    log: LogCallback
): Promise<{ status: 'success' | 'error'; cookies?: string; message?: string }> {
    let browser;
    try {
        log('🖥️ Membuka browser untuk verifikasi 2FA...');
        browser = await launchBrowser();
        const page = await browser.newPage();
        const cookies = decryptCookies(tempCookies);
        await page.setCookie(...cookies as Parameters<typeof page.setCookie>[0][]);

        log('🌐 Membuka halaman 2FA...');
        await page.goto(DASHBOARD_URL, { waitUntil: 'networkidle2', timeout: 30000 });
        await randomDelay(2000, 3000);
        log('🔢 Memasukkan kode 2FA...');
        const otpInputs = await page.evaluate(() => {
            return Array.from(document.querySelectorAll('input')).filter(el => {
                const r = el.getBoundingClientRect();
                return r.width > 0 && r.height > 0;
            }).map(el => ({ type: el.type, name: el.name, id: el.id }));
        });

        if (otpInputs.length > 0) {
            const sel = otpInputs[0].id ? `#${otpInputs[0].id}` :
                otpInputs[0].name ? `input[name="${otpInputs[0].name}"]` : `input[type="${otpInputs[0].type}"]`;
            await page.click(sel);
            await page.type(sel, code, { delay: 50 });
        } else {
            await page.keyboard.type(code, { delay: 50 });
        }
        await randomDelay(500, 1000);
        await page.evaluate(() => {
            const btns = [...document.querySelectorAll('button'), ...document.querySelectorAll('input[type="submit"]')];
            for (const btn of btns) {
                const r = (btn as HTMLElement).getBoundingClientRect();
                if (r.width > 0) { (btn as HTMLElement).click(); return; }
            }
        });
        log('⏳ Memverifikasi kode 2FA...');
        await randomDelay(5000, 8000);

        const finalUrl = page.url();
        const success = finalUrl.includes('buyer-area') || finalUrl.includes('dashboard') ||
            (!finalUrl.includes('login') && !finalUrl.includes('2fa'));

        if (success) {
            log('✅ Verifikasi 2FA berhasil!');
            const finalCookies = await page.cookies();
            const encCookies = encryptCookies(finalCookies);
            await browser.close();
            return { status: 'success', cookies: encCookies };
        } else {
            log('❌ Kode 2FA salah atau expired');
            await browser.close();
            return { status: 'error', message: 'Kode 2FA salah atau expired' };
        }
    } catch (error) {
        if (browser) await browser.close();
        const msg = error instanceof Error ? error.message : 'Unknown error';
        return { status: 'error', message: msg };
    }
}

function generateRandomCode(): string {
    return Math.floor(1000 + Math.random() * 9000).toString();
}

export async function runSellerAutomation(
    encryptedCookies: string,
    config: SellerConfig,
    log: LogCallback,
    checkSaldo: () => Promise<number>,
    deductSaldo: () => Promise<boolean>
): Promise<{ success: boolean; processed: number; skipped: number; stopped: boolean }> {
    let browser;
    let processed = 0, skipped = 0, stopped = false;

    try {
        log('🖥️ Membuka browser...');
        browser = await launchBrowser();
        const page = await browser.newPage();
        await page.setExtraHTTPHeaders({ 'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7' });

        log('🍪 Memuat cookies...');
        const cookies = decryptCookies(encryptedCookies);
        await page.setCookie(...cookies as Parameters<typeof page.setCookie>[0][]);

        log('🌐 Membuka halaman produk...');
        await page.goto(PRODUCT_URL, { waitUntil: 'networkidle2', timeout: 60000 });
        await randomDelay(2000, 3000);
        if (page.url().includes('login')) {
            log('❌ Session expired — login ulang diperlukan');
            await browser.close();
            return { success: false, processed: 0, skipped: 0, stopped: false };
        }
        log('✅ Session valid');
        log(`🔍 Filter: ${config.kategori} > ${config.brand} > ${config.type || 'Semua'}`);
        await page.evaluate((text: string) => {
            for (const el of document.querySelectorAll('.el-tabs__item, [role="tab"]'))
                if ((el as HTMLElement).textContent?.trim() === text && (el as HTMLElement).getBoundingClientRect().height > 0) (el as HTMLElement).click();
        }, config.kategori);
        await randomDelay(1500, 2000);
        await page.evaluate((text: string, ci: boolean) => {
            for (const btn of document.querySelectorAll('button.el-button')) {
                const t = (btn as HTMLElement).textContent?.trim() || '';
                const match = ci ? t.toUpperCase() === text.toUpperCase() : t === text;
                if (match && (btn as HTMLElement).getBoundingClientRect().height > 0) {
                    (btn as HTMLElement).click(); return;
                }
            }
            for (const el of document.querySelectorAll('span, div')) {
                const t = (el as HTMLElement).textContent?.trim() || '';
                const r = (el as HTMLElement).getBoundingClientRect();
                const match = ci ? t.toUpperCase() === text.toUpperCase() : t === text;
                if (match && r.height > 0 && r.height < 50) {
                    const btn = (el as HTMLElement).closest('button');
                    if (btn) { btn.click(); return; }
                    (el as HTMLElement).click(); return;
                }
            }
        }, config.brand, true);
        await randomDelay(1500, 2000);
        if (config.type) {
            await page.evaluate((text: string, ci: boolean) => {
                for (const btn of document.querySelectorAll('button.el-button')) {
                    const t = (btn as HTMLElement).textContent?.trim() || '';
                    const match = ci ? t.toUpperCase() === text.toUpperCase() : t === text;
                    if (match && (btn as HTMLElement).getBoundingClientRect().height > 0) {
                        (btn as HTMLElement).click(); return;
                    }
                }
                for (const el of document.querySelectorAll('span, div')) {
                    const t = (el as HTMLElement).textContent?.trim() || '';
                    const r = (el as HTMLElement).getBoundingClientRect();
                    const match = ci ? t.toUpperCase() === text.toUpperCase() : t === text;
                    if (match && r.height > 0 && r.height < 50) {
                        const btn = (el as HTMLElement).closest('button');
                        if (btn) { btn.click(); return; }
                        (el as HTMLElement).click(); return;
                    }
                }
            }, config.type, false);
            await randomDelay(1500, 2000);
        }

        log(`✅ Filter diterapkan`);
        const startWait = Date.now();
        let btnCount = 0;
        while (Date.now() - startWait < 15000) {
            btnCount = await page.evaluate(() => {
                let cnt = 0;
                for (const b of document.querySelectorAll('button.table-fullwidth')) {
                    if (b.getBoundingClientRect().height > 0) cnt++;
                }
                return cnt;
            });
            if (btnCount > 0) break;
            await randomDelay(500, 800);
        }

        if (btnCount === 0) {
            log('❌ Tidak ada produk ditemukan');
            await browser.close();
            return { success: false, processed: 0, skipped: 0, stopped: false };
        }

        const products = await page.evaluate(() => {
            const buttons = document.querySelectorAll('button.table-fullwidth');
            const result: { namaProduk: string; seller: string; harga: string }[] = [];
            for (let i = 0; i < buttons.length; i++) {
                if (buttons[i].getBoundingClientRect().height === 0) continue;
                const row = buttons[i].closest('.el-table__row');
                if (!row) continue;
                const cells = row.querySelectorAll('td');
                const nama = cells[4]?.querySelector('.cell')?.textContent?.trim() || '';
                const lines = (cells[6]?.querySelector('.cell')?.textContent?.trim() || '').split('\n').filter((s: string) => s.trim());
                const seller = lines.pop()?.trim() || 'N/A';
                const harga = cells[7]?.querySelector('.cell')?.textContent?.trim() || '';
                result.push({ namaProduk: nama, seller, harga });
            }
            return result;
        });

        const total = products.length;
        log(`📊 ${total} produk ditemukan\n`);

        if (config.ratingMinimal && config.ratingMinimal > 0) log(`⭐ Rating Min: ${config.ratingMinimal}`);
        if (config.blockedSellers && config.blockedSellers.length > 0) log(`🚫 Blocked: ${config.blockedSellers.join(', ')}`);

        const selectedSellers: SellerResult[] = [];
        for (let i = 0; i < products.length; i++) {
            const saldo = await checkSaldo();
            if (saldo < 15) {
                log(`\n💰 Saldo tidak cukup (${saldo}P). Tools dihentikan.`);
                log(`💾 Menyimpan hasil terakhir...`);
                stopped = true;
                break;
            }

            const prod = products[i];
            log(`📦 [${i + 1}/${total}] ${prod.namaProduk}`);
            log(`   Seller saat ini: ${prod.seller} ${prod.harga}`);
            const start2 = Date.now();
            let cnt = 0;
            while (Date.now() - start2 < 10000) {
                cnt = await page.evaluate(() => {
                    let d = 0;
                    for (const b of document.querySelectorAll('button.table-fullwidth')) {
                        if (b.getBoundingClientRect().height > 0) d++;
                    }
                    return d;
                });
                if (cnt > 0) break;
                await randomDelay(500, 800);
            }

            if (cnt === 0) {
                log('   ❌ Skip (tabel error)');
                skipped++;
                continue;
            }

            const found = await page.evaluate((name: string) => {
                const buttons = document.querySelectorAll('button.table-fullwidth');
                for (let i = 0; i < buttons.length; i++) {
                    if (buttons[i].getBoundingClientRect().height === 0) continue;
                    const row = buttons[i].closest('.el-table__row');
                    if (!row) continue;
                    const nama = row.querySelectorAll('td')[4]?.querySelector('.cell')?.textContent?.trim() || '';
                    if (nama === name) { (buttons[i] as HTMLElement).click(); return true; }
                }
                return false;
            }, prod.namaProduk);

            if (!found) {
                log('   ❌ Skip (tombol tidak ditemukan)');
                skipped++;
                continue;
            }

            const dStart = Date.now();
            let dialogOpen = false;
            while (Date.now() - dStart < 8000) {
                dialogOpen = await page.evaluate(() => {
                    for (const w of document.querySelectorAll('.el-dialog__wrapper'))
                        if ((w as HTMLElement).style.display !== 'none' && w.querySelector('.el-dialog.is-fullscreen')) return true;
                    return false;
                });
                if (dialogOpen) break;
                await randomDelay(300, 500);
            }

            if (!dialogOpen) {
                log('   ❌ Skip (dialog tidak terbuka)');
                skipped++;
                continue;
            }

            await page.evaluate(() => {
                const d = document.querySelector('.el-dialog.is-fullscreen .el-table__body-wrapper');
                if (d) { d.scrollTop = d.scrollHeight; }
            });
            await randomDelay(300, 500);
            await page.evaluate(() => {
                const d = document.querySelector('.el-dialog.is-fullscreen .el-table__body-wrapper');
                if (d) { d.scrollTop = 0; }
            });
            await randomDelay(300, 500);

            const pgInfo = await page.evaluate(() => {
                const dialog = document.querySelector('.el-dialog.is-fullscreen');
                if (!dialog) return { current: 1, total: 1 };
                const pagination = dialog.querySelector('.el-pagination');
                if (!pagination) return { current: 1, total: 1 };
                const numbers = pagination.querySelectorAll('.el-pager .number');
                let maxPage = 1;
                for (const n of numbers) { const num = parseInt(n.textContent || '1'); if (num > maxPage) maxPage = num; }
                return { current: 1, total: maxPage };
            });

            interface SellerEntry { index: number; sellerName: string; harga: number; rating: number; page: number }
            let allSellers: SellerEntry[] = [];
            const readPage = async () => {
                return await page.evaluate(() => {
                    const dialog = document.querySelector('.el-dialog.is-fullscreen');
                    if (!dialog) return [];
                    const result: { index: number; sellerName: string; harga: number; rating: number }[] = [];
                    const rows = dialog.querySelectorAll('.el-table__body .el-table__row');
                    rows.forEach((row, i) => {
                        if (!Array.from(row.querySelectorAll('button')).find(b => b.textContent?.trim() === 'Pilih')) return;
                        let harga = 0, name = '', rating = 0;
                        for (const c of row.querySelectorAll('td')) {
                            const m = c.textContent?.trim().match(/^Rp\s+([\d.,]+)/);
                            if (m) harga = parseInt(m[1].replace(/\./g, '')) || 0;
                        }
                        for (const c of row.querySelectorAll('td')) {
                            const rMatch = c.textContent?.trim().match(/^(\d+\.?\d*)\s/);
                            if (rMatch) { const v = parseFloat(rMatch[1]); if (v > 0 && v <= 5) { rating = v; break; } }
                        }
                        for (const c of row.querySelectorAll('td')) {
                            const lines = (c as HTMLElement).innerText.trim().split('\n').filter((l: string) => l.trim());
                            if (lines.length >= 2 && ((c as HTMLElement).innerText.includes('IP') || (c as HTMLElement).innerText.includes('api'))) {
                                name = lines[lines.length - 1].trim(); break;
                            }
                        }
                        if (name && harga > 0) result.push({ index: i, sellerName: name, harga, rating });
                    });
                    return result;
                });
            };

            let pageSellers = await readPage();
            allSellers.push(...pageSellers.map(s => ({ ...s, page: 1 })));

            for (let p = 2; p <= pgInfo.total; p++) {
                const clicked = await page.evaluate(() => {
                    const dialog = document.querySelector('.el-dialog.is-fullscreen');
                    if (!dialog) return false;
                    const nextBtn = dialog.querySelector('.el-pagination .btn-next') as HTMLButtonElement;
                    if (nextBtn && !nextBtn.disabled) { nextBtn.click(); return true; }
                    return false;
                });
                if (!clicked) break;
                await randomDelay(1000, 1500);
                pageSellers = await readPage();
                allSellers.push(...pageSellers.map(s => ({ ...s, page: p })));
            }

            log(`   📋 ${allSellers.length} seller ditemukan`);
            const blocklist = (config.blockedSellers || []).map(s => s.toLowerCase());
            if (blocklist.length > 0) {
                const before = allSellers.length;
                allSellers = allSellers.filter(s => !blocklist.includes(s.sellerName.toLowerCase()));
                if (before - allSellers.length > 0) log(`   🚫 ${before - allSellers.length} seller diblokir`);
            }
            const minRating = config.ratingMinimal || 0;
            if (minRating > 0) {
                const before = allSellers.length;
                allSellers = allSellers.filter(s => s.rating >= minRating);
                if (before - allSellers.length > 0) log(`   ⭐ ${before - allSellers.length} seller rating terlalu rendah`);
            }

            if (allSellers.length === 0) {
                log(`   ⚠️ Tidak ada seller yang memenuhi kriteria`);
                skipped++;
                await page.evaluate(() => {
                    for (const btn of document.querySelectorAll('.el-dialog__headerbtn')) {
                        const w = (btn as HTMLElement).closest('.el-dialog__wrapper');
                        if (w && (w as HTMLElement).style.display !== 'none') (btn as HTMLElement).click();
                    }
                });
                await randomDelay(500, 800);
                continue;
            }
            let selected: SellerEntry;
            if (config.pilihTermurah) {
                selected = allSellers.reduce((min, s) => s.harga < min.harga ? s : min, allSellers[0]);
            } else {
                selected = allSellers[Math.floor(Math.random() * allSellers.length)];
            }
            const currentPg = await page.evaluate(() => {
                const dialog = document.querySelector('.el-dialog.is-fullscreen');
                const active = dialog?.querySelector('.el-pagination .el-pager .number.active');
                return active ? parseInt(active.textContent || '1') : 1;
            });
            if (currentPg !== selected.page) {
                await page.evaluate((num: number) => {
                    const dialog = document.querySelector('.el-dialog.is-fullscreen');
                    for (const n of dialog?.querySelectorAll('.el-pagination .el-pager .number') || [])
                        if (parseInt(n.textContent || '0') === num) { (n as HTMLElement).click(); return; }
                }, selected.page);
                await randomDelay(1000, 1500);
            }
            await page.evaluate((idx: number) => {
                const d = document.querySelector('.el-dialog.is-fullscreen');
                const rows = d?.querySelectorAll('.el-table__body .el-table__row');
                if (rows?.[idx]) rows[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, selected.index);
            await randomDelay(300, 500);

            const pilihOk = await page.evaluate((idx: number) => {
                const d = document.querySelector('.el-dialog.is-fullscreen');
                const btn = Array.from(d?.querySelectorAll('.el-table__body .el-table__row')?.[idx]?.querySelectorAll('button') || [])
                    .find(b => b.textContent?.trim() === 'Pilih');
                if (btn) { (btn as HTMLElement).click(); return true; }
                return false;
            }, selected.index);

            if (pilihOk) {
                log(`   ✅ Seller: ${selected.sellerName} | Rp ${selected.harga.toLocaleString()} | ⭐ ${selected.rating}`);
                const deducted = await deductSaldo();
                if (deducted) {
                    const remaining = await checkSaldo();
                    log(`   💰 -15P | Saldo: ${remaining}P`);
                }
                processed++;
                selectedSellers.push({ product: prod.namaProduk, sellerName: selected.sellerName, harga: selected.harga, rating: selected.rating });
            } else {
                log(`   ❌ Gagal klik Pilih`);
                skipped++;
            }

            await randomDelay(3000, 5000);
            await page.evaluate(() => {
                for (const btn of document.querySelectorAll('.el-dialog__headerbtn')) {
                    const w = (btn as HTMLElement).closest('.el-dialog__wrapper');
                    if (w && (w as HTMLElement).style.display !== 'none') (btn as HTMLElement).click();
                }
            });
            await randomDelay(500, 800);
            await page.evaluate((text: string) => {
                for (const el of document.querySelectorAll('.el-tabs__item, [role="tab"]'))
                    if ((el as HTMLElement).textContent?.trim() === text) (el as HTMLElement).click();
            }, config.kategori);
            await randomDelay(1000, 1500);
            await page.evaluate((text: string) => {
                for (const el of document.querySelectorAll('button.el-button, span, div')) {
                    const t = (el as HTMLElement).textContent?.trim() || '';
                    if (t.toUpperCase() === text.toUpperCase() && (el as HTMLElement).getBoundingClientRect().height > 0) {
                        const button = (el as HTMLElement).closest('button') || el;
                        (button as HTMLElement).click(); return;
                    }
                }
            }, config.brand);
            await randomDelay(1000, 1500);
            if (config.type) {
                await page.evaluate((text: string) => {
                    for (const el of document.querySelectorAll('button.el-button, span, div')) {
                        if ((el as HTMLElement).textContent?.trim() === text && (el as HTMLElement).getBoundingClientRect().height > 0) {
                            const button = (el as HTMLElement).closest('button') || el;
                            (button as HTMLElement).click(); return;
                        }
                    }
                }, config.type);
                await randomDelay(1000, 1500);
            }

            if (config.autoKodeProduk || config.autoHargaMax) {
                await randomDelay(1500, 2000);
                const s3 = Date.now();
                while (Date.now() - s3 < 10000) {
                    const c = await page.evaluate(() => document.querySelectorAll('button.table-fullwidth').length);
                    if (c > 0) break;
                    await randomDelay(500, 800);
                }

                for (const sel of selectedSellers) {
                    if (config.autoKodeProduk) {
                        const code = generateRandomCode();
                        await page.evaluate((n: string, c: string) => {
                            for (const btn of document.querySelectorAll('button.table-fullwidth')) {
                                const row = btn.closest('.el-table__row');
                                if (!row) continue;
                                if ((row.querySelectorAll('td')[4]?.querySelector('.cell')?.textContent?.trim() || '') === n) {
                                    const inp = row.querySelector('input[placeholder="Kode Produk"]') as HTMLInputElement;
                                    if (inp) {
                                        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                                        s?.call(inp, c); inp.dispatchEvent(new Event('input', { bubbles: true }));
                                    }
                                }
                            }
                        }, sel.product, code);
                        await randomDelay(200, 400);
                    }
                    if (config.autoHargaMax && sel.harga > 0) {
                        await page.evaluate((n: string, h: number) => {
                            for (const btn of document.querySelectorAll('button.table-fullwidth')) {
                                const row = btn.closest('.el-table__row');
                                if (!row) continue;
                                if ((row.querySelectorAll('td')[4]?.querySelector('.cell')?.textContent?.trim() || '') === n) {
                                    const inp = row.querySelectorAll('td')[3]?.querySelector('input.el-input__inner') as HTMLInputElement;
                                    if (inp) {
                                        const s = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                                        s?.call(inp, h.toString()); inp.dispatchEvent(new Event('input', { bubbles: true }));
                                    }
                                }
                            }
                        }, sel.product, sel.harga);
                        await randomDelay(200, 400);
                    }
                }
            }

            log('');
        }

        if (processed > 0) {
            log('💾 Menyimpan semua perubahan...');
            const savedClicked = await page.evaluate(() => {
                for (const btn of document.querySelectorAll('button, .el-button')) {
                    if (btn.textContent?.trim().includes('Simpan Semua Perubahan')) { (btn as HTMLElement).click(); return true; }
                }
                return false;
            });
            if (savedClicked) {
                await randomDelay(1500, 2000);
                for (let attempt = 0; attempt < 3; attempt++) {
                    const clicked = await page.evaluate(() => {
                        for (const w of document.querySelectorAll('.el-dialog__wrapper')) {
                            if ((w as HTMLElement).style.display === 'none') continue;
                            if ((w.textContent || '').includes('Konfirmasi') || (w.textContent || '').includes('Perubahan')) {
                                for (const btn of w.querySelectorAll('button')) {
                                    if (btn.textContent?.trim() === 'Simpan') { (btn as HTMLElement).click(); return true; }
                                }
                            }
                        }
                        for (const btn of document.querySelectorAll('.el-message-box__btns .el-button--primary')) {
                            if ((btn as HTMLElement).getBoundingClientRect().width > 0) { (btn as HTMLElement).click(); return true; }
                        }
                        return false;
                    });
                    if (clicked) { await randomDelay(2000, 3000); break; }
                    await randomDelay(800, 1200);
                }
                log('   ✅ Perubahan tersimpan!');
            }
        }

        const finalCookies = await page.cookies();
        const newEncCookies = encryptCookies(finalCookies);

        await browser.close();
        log('\n' + '═'.repeat(50));
        log(`📊 Selesai! ${processed}/${total} berhasil, ${skipped} skip${stopped ? ' (SALDO HABIS)' : ''}`);
        for (const s of selectedSellers) {
            log(`   ✅ ${s.product} → ${s.sellerName} (Rp ${s.harga.toLocaleString()})`);
        }
        log('═'.repeat(50));

        return { success: true, processed, skipped, stopped };
    } catch (error) {
        if (browser) await browser.close();
        const msg = error instanceof Error ? error.message : 'Unknown error';
        log(`❌ Error: ${msg}`);
        return { success: false, processed, skipped, stopped };
    }
}


