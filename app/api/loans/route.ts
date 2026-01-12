import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import {
  readLoans,
  addLoan,
  updateLoan,
} from '@/lib/storage';
import { generateId, calculateEMI, calculateTotalInterest } from '@/lib/utils';
import { Loan } from '@/types';

const createLoanSchema = z.object({
  name: z.string(),
  principal: z.number().positive(),
  interestRate: z.number().min(0),
  durationMonths: z.number().int().positive(),
  startDate: z.string(),
});

export async function GET(request: Request) {
  try {
    const auth = await requireAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const loans = await readLoans(auth.userId);
    
    return NextResponse.json({ loans });
  } catch (error) {
    console.error('Get loans error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const auth = await requireAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    // Validate input
    const result = createLoanSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }
    
    const { principal, interestRate, durationMonths } = result.data;
    const emiAmount = calculateEMI(principal, interestRate, durationMonths);
    const totalInterest = calculateTotalInterest(principal, emiAmount, durationMonths);
    
    // Generate payment schedule
    const payments = Array.from({ length: durationMonths }, (_, i) => ({
      monthNumber: i + 1,
      isPaid: false,
    }));
    
    const now = new Date().toISOString();
    const loan: Loan = {
      id: generateId(),
      userId: auth.userId,
      ...result.data,
      emiAmount,
      totalInterest,
      payments,
      createdAt: now,
      updatedAt: now,
    };
    
    await addLoan(auth.userId, loan);
    
    return NextResponse.json({ loan }, { status: 201 });
  } catch (error) {
    console.error('Create loan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const auth = await requireAuth(request);
    
    if (!auth) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const body = await request.json();
    
    if (!body.id) {
      return NextResponse.json(
        { error: 'Loan ID required' },
        { status: 400 }
      );
    }
    
    const loans = await readLoans(auth.userId);
    const loan = loans.find((l: Loan) => l.id === body.id);
    
    if (!loan) {
      return NextResponse.json(
        { error: 'Loan not found' },
        { status: 404 }
      );
    }
    
    const updated: Loan = {
      ...loan,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await updateLoan(auth.userId, updated);
    
    return NextResponse.json({ loan: updated });
  } catch (error) {
    console.error('Update loan error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
