import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';
import {
  deleteLoan,
  trackDeletedLoan,
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
    
    await deleteLoan(auth.userId, id);
    await trackDeletedLoan(auth.userId, id);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete loan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
