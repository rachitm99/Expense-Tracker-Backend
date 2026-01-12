import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import { readLoans, updateLoan } from '@/lib/storage';
import { Loan } from '@/types';

const payEMISchema = z.object({
  monthNumber: z.number().int().positive(),
});

export async function POST(
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
    const body = await request.json();
    
    // Validate input
    const result = payEMISchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }
    
    const loans = await readLoans(auth.userId);
    const loan = loans.find((l: Loan) => l.id === id);
    
    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }
    
    const payment = loan.payments.find(p => p.monthNumber === result.data.monthNumber);
    
    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }
    
    payment.isPaid = true;
    payment.paidDate = new Date().toISOString();
    loan.updatedAt = new Date().toISOString();
    
    await updateLoan(auth.userId, loan);
    
    return NextResponse.json({ loan });
  } catch (error) {
    console.error('Pay EMI error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
