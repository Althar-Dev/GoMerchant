import { NextRequest, NextResponse } from 'next/server';

/**
 * Admin Settings API
 * Temporarily disabled during Firebase migration.
 * Site settings will be migrated to Firestore '/settings/site' document.
 */

export async function GET() {
    return NextResponse.json({ 
        status: 'success', 
        data: { 
            siteTitle: 'GomerchPay API',
            logo: null,
            favicon: null
        } 
    });
}

export async function PUT(req: NextRequest) {
    return NextResponse.json({ 
        status: 'error', 
        message: 'Settings update is currently being migrated to Firebase. Please try again later.' 
    }, { status: 503 });
}


