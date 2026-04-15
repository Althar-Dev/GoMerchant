# GomerchPay API - VPS Deployment Guide

Platform gateway pembayaran QRIS otomatis terintegrasi Gopay Merchant. Dibuat dengan Next.js, Tailwind, dan Firebase.

## Persyaratan VPS
- Node.js 18.x atau lebih baru
- Firebase Project (Firestore & Auth aktif)
- Nginx (sebagai Reverse Proxy)
- PM2 (Process Manager)

## Cara Instalasi di VPS (Ubuntu/Debian)

### 1. Persiapan Awal
Update system dan install library yang dibutuhkan untuk Puppeteer:
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y ca-certificates fonts-liberation libasound2 libatk-bridge2.0-0 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgbm1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libnss3 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 lsb-release wget xdg-utils
```

### 2. Clone & Install
```bash
git clone <URL_REPO_ANDA>
cd gobiz-gateway
npm install
```

### 3. Konfigurasi Environment
Buat file `.env` di root folder:
```env
# Firebase Client Config (Copy dari Firebase Console)
NEXT_PUBLIC_FIREBASE_PROJECT_ID="..."
NEXT_PUBLIC_FIREBASE_APP_ID="..."
NEXT_PUBLIC_FIREBASE_API_KEY="..."

# App Config
NEXT_PUBLIC_APP_URL="https://your-domain.com"
NEXT_PUBLIC_DASH_DOMAIN="dash.your-domain.com"
NEXT_PUBLIC_API_DOMAIN="api.your-domain.com"
NEXT_PUBLIC_DOCS_DOMAIN="docs.your-domain.com"

# Encryption (Wajib 64 karakter hex)
ENCRYPTION_KEY="masukkan_64_karakter_hex_disini"
```

### 4. Build & Run
```bash
npm run build
pm2 start npm --name "gomerch-pay" -- start
```

### 5. Konfigurasi Nginx
Pastikan domain dan subdomain lo mengarah ke IP VPS, lalu buat config Nginx:
```nginx
server {
    listen 80;
    server_name your-domain.com dash.your-domain.com api.your-domain.com docs.your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Keamanan
- Selalu gunakan SSL (Certbot/LetsEncrypt).
- Jangan bagikan `ENCRYPTION_KEY` ke siapapun.
- Pastikan Firestore Security Rules sudah terpasang sesuai file `firestore.rules`.

---
Build with 💙 by AltharDev