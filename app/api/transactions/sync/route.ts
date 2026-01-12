import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getTransactionsSince,
  getDeletedTransactionsSince,
} from '@/lib/storage';

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { searchParams } = new URL(request.url);
    const lastSync = searchParams.get('lastSync') || new Date(0).toISOString();
    
    const transactions = await getTransactionsSince(auth.userId, lastSync);
    const deleted = await getDeletedTransactionsSince(auth.userId, lastSync);
    
    return NextResponse.json({
      transactions,
      deleted,
      syncTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync transactions error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
