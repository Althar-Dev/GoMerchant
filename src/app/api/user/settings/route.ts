import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser, generateApiKey } from '@/lib/auth';
import { initializeFirebase } from '@/firebase/init';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(req: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ status: 'error', message: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        if (body.action === 'regenerate_key') {
            const { firestore } = initializeFirebase();
            const newKey = generateApiKey();
            
            await updateDoc(doc(firestore, 'users', user.id), {
                apiKey: newKey,
                updatedAt: serverTimestamp()
            });

            return NextResponse.json({
                status: 'success',
                message: 'API key berhasil di-regenerate',
                data: { apiKey: newKey },
            });
        }

        return NextResponse.json(
            { status: 'error', message: 'Action tidak valid' },
            { status: 400 }
        );
    } catch (error) {
        console.error('Settings action error:', error);
        return NextResponse.json({ status: 'error', message: 'Server error' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    return NextResponse.json({ status: 'error', message: 'Not implemented' }, { status: 501 });
}

