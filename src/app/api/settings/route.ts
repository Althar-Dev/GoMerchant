import { NextResponse } from 'next/server';

export async function GET() {
    try {
        return NextResponse.json({
            status: 'success',
            data: {
                siteTitle: 'GomerchPay API',
                favicon: null,
                logo: '/img/logo.png',
            },
        });
    } catch (error) {
        console.error('Get public settings error:', error);
        return NextResponse.json({
            status: 'success',
            data: {
                siteTitle: 'GomerchPay API',
                favicon: null,
                logo: '/img/logo.png',
            },
        });
    }
}


