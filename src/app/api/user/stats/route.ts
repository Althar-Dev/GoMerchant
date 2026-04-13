import { NextRequest, NextResponse } from 'next/server';
import { GobizService } from '@/lib/gobiz';
import { normalizeAmount } from '@/lib/amountUtils';

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { merchantId, accessToken, refreshToken, xUniqueid } = body;

        if (!accessToken || !refreshToken || !xUniqueid) {
            return NextResponse.json({ status: 'error', message: 'Unauthorized: Missing tokens' }, { status: 401 });
        }

        const gobiz = new GobizService(xUniqueid);
        const result = await gobiz.getTransactionsWithAutoRefresh(
            merchantId || '',
            accessToken,
            refreshToken,
            { size: 20 }
        );

        const entries = result.data?.hits || result.data?.data?.journals || [];
        
        const processedTransactions = entries.map((entry: any) => {
            let amount = 0;
            let status = 'pending';
            let createdAt = new Date().toISOString();
            let customerName = 'Customer';
            let trxId = entry.id || 'N/A';

            if (entry.metadata?.transaction) {
                const tx = entry.metadata.transaction;
                amount = normalizeAmount(tx.gross_amount || tx.amount);
                status = (tx.status === 'settlement' || tx.status === 'capture') ? 'paid' : tx.status;
                createdAt = tx.transaction_time || entry.created_at || entry.time;
                customerName = tx.customer_name || 'Customer';
                trxId = tx.id || entry.id;
            } else {
                amount = normalizeAmount(entry.amount);
                status = entry.status === 'success' ? 'paid' : entry.status;
                createdAt = entry.created_at || entry.time;
                trxId = entry.id;
            }

            return {
                trxId,
                refId: entry.external_id || trxId,
                customerName,
                amount: Math.round(amount / 100),
                totalAmount: Math.round(amount / 100),
                paymentStatus: status,
                createdAt,
                merchant: { projectName: 'GoPay' }
            };
        });

        const totalRevenue = processedTransactions
            .filter((tx: any) => tx.paymentStatus === 'paid')
            .reduce((sum: number, tx: any) => sum + tx.amount, 0);

        return NextResponse.json({
            status: 'success',
            data: {
                stats: {
                    totalRevenue,
                },
                recentTransactions: processedTransactions,
                tokenRefreshed: result.tokenRefreshed,
                newAccessToken: result.newAccessToken,
                newRefreshToken: result.newRefreshToken
            },
        });
    } catch (error: any) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json({ 
            status: 'error', 
            message: error.name === 'TokenExpiredError' ? 'SESSION_EXPIRED' : (error.message || 'Server error') 
        }, { status: 500 });
    }
}
