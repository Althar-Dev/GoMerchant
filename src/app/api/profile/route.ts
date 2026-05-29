import { NextRequest, NextResponse } from 'next/server';
import { validateApiRequest, getClientIp } from '@/lib/subscriptionGuard';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { apikey } = body;

        if (!apikey) {
            return NextResponse.json(
                { status: 'error', code: 400, message: 'API key wajib diisi' },
                { status: 400 }
            );
        }

        const clientIp = getClientIp(req.headers);
        const guard = await validateApiRequest(apikey, false);
        
        if (!guard.success) {
            return NextResponse.json(
                { status: 'error', code: guard.error!.code, message: guard.error!.message },
                { status: guard.error!.status }
            );
        }

        const user = guard.user!;

        return NextResponse.json({
            status: 'Success',
            data: {
                name: user.username,
                email: user.email,
                role: user.role,
                plan: user.plan?.name || 'Free',
                usage: user.currentDailyUsage || 0,
                limit: user.plan?.maxRequestsPerDay || 5
            },
        });
    } catch (error) {
        return NextResponse.json(
            { status: 'error', code: 500, message: 'Server error' },
            { status: 500 }
        );
    }
}

