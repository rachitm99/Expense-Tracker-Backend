import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  deleteTransaction,
  trackDeletedTransaction,
} from '@/lib/storage';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const { id } = await params;
    
    await deleteTransaction(auth.userId, id);
    await trackDeletedTransaction(auth.userId, id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
