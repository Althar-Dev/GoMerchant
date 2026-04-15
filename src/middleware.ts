import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;

  // 1. Alias standar untuk semua domain
  if (pathname === '/signin') return NextResponse.rewrite(new URL('/login', req.url));
  if (pathname === '/signup') return NextResponse.rewrite(new URL('/register', req.url));
  
  // 2. Bypass middleware untuk rute Bot (Webhook)
  // Sangat penting agar Telegram bisa nembak ke /bot/webhook tanpa terhalang subdomain logic
  if (pathname.startsWith('/bot/')) {
    return NextResponse.next();
  }

  // 3. Deteksi Environment (Local vs VPS/Production)
  const isDev = hostname.includes('localhost') || hostname.includes('127.0.0.1') || hostname.includes('cloudworkstations.dev');
  
  if (isDev) {
    if (pathname === '/dashboard') return NextResponse.rewrite(new URL('/user/dashboard', req.url));
    if (pathname === '/generate') return NextResponse.rewrite(new URL('/user/generate', req.url));
    if (pathname === '/subscribe') return NextResponse.rewrite(new URL('/user/subscribe', req.url));
    if (pathname === '/checkout') return NextResponse.rewrite(new URL('/user/subscribe/checkout', req.url));
    if (pathname === '/settings') return NextResponse.rewrite(new URL('/user/settings', req.url));
    if (pathname === '/deposit') return NextResponse.rewrite(new URL('/user/deposit', req.url));
    if (pathname === '/payment') return NextResponse.rewrite(new URL('/user/payment', req.url));
    if (pathname.startsWith('/detail/')) return NextResponse.rewrite(new URL(`/user${pathname}`, req.url));
    
    if (pathname === '/admin-panel') return NextResponse.rewrite(new URL('/admin/dashboard', req.url));
    if (pathname === '/bot') return NextResponse.rewrite(new URL('/admin/bot', req.url));
    if (pathname === '/website') return NextResponse.rewrite(new URL('/admin/website', req.url));
    if (pathname === '/plans') return NextResponse.rewrite(new URL('/admin/plans', req.url));
    if (pathname === '/members') return NextResponse.rewrite(new URL('/admin/members', req.url));

    return NextResponse.next();
  }

  // 4. Konfigurasi Domain Produksi (Diambil dari .env)
  const dashDomain = process.env.NEXT_PUBLIC_DASH_DOMAIN || 'dash.pay-gomerch.web.id';
  const apiDomain = process.env.NEXT_PUBLIC_API_DOMAIN || 'api.pay-gomerch.web.id';
  const docsDomain = process.env.NEXT_PUBLIC_DOCS_DOMAIN || 'docs.pay-gomerch.web.id';

  // Routing Subdomain API
  if (hostname === apiDomain) {
    return NextResponse.rewrite(new URL(`/api${pathname}`, req.url));
  }

  // Routing Subdomain Docs
  if (hostname === docsDomain) {
    return NextResponse.rewrite(new URL(`/docs${pathname === '/' ? '' : pathname}`, req.url));
  }

  // Routing Subdomain Dashboard
  if (hostname === dashDomain) {
    if (pathname.startsWith('/api/')) return NextResponse.next();

    // Mapping rute Admin
    if (pathname === '/admin-panel' || pathname === '/admin') {
        return NextResponse.rewrite(new URL('/admin/dashboard', req.url));
    }
    if (pathname === '/bot') return NextResponse.rewrite(new URL('/admin/bot', req.url));
    if (pathname === '/website') return NextResponse.rewrite(new URL('/admin/website', req.url));
    if (pathname === '/plans') return NextResponse.rewrite(new URL('/admin/plans', req.url));
    if (pathname === '/members') return NextResponse.rewrite(new URL('/admin/members', req.url));

    // Mapping rute User
    if (pathname === '/' || pathname === '/dashboard') return NextResponse.rewrite(new URL('/user/dashboard', req.url));
    if (pathname === '/generate') return NextResponse.rewrite(new URL('/user/generate', req.url));
    if (pathname === '/subscribe') return NextResponse.rewrite(new URL('/user/subscribe', req.url));
    if (pathname === '/checkout') return NextResponse.rewrite(new URL('/user/subscribe/checkout', req.url));
    if (pathname === '/settings') return NextResponse.rewrite(new URL('/user/settings', req.url));
    if (pathname === '/deposit') return NextResponse.rewrite(new URL('/user/deposit', req.url));
    if (pathname === '/payment') return NextResponse.rewrite(new URL('/user/payment', req.url));
    
    if (pathname.startsWith('/detail/')) return NextResponse.rewrite(new URL(`/user${pathname}`, req.url));

    if (pathname.startsWith('/user/') || pathname.startsWith('/admin/')) {
        return NextResponse.next();
    }

    return NextResponse.rewrite(new URL(`/user${pathname}`, req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|img/|uploads/).*)'],
};