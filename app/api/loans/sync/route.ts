import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  getLoansSince,
  getDeletedLoansSince,
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
    
    const loans = await getLoansSince(auth.userId, lastSync);
    const deleted = await getDeletedLoansSince(auth.userId, lastSync);
    
    return NextResponse.json({
      loans,
      deleted,
      syncTimestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Sync loans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
