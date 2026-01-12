import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import {
  readTransactions,
  addTransaction,
  updateTransaction,
} from '@/lib/storage';
import { generateId, getMonthKey } from '@/lib/utils';
import { Transaction } from '@/types';

const createTransactionSchema = z.object({
  amount: z.number().positive(),
  category: z.string(),
  note: z.string().optional(),
  date: z.string(),
  isIncome: z.boolean(),
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
    
    const transactions = await readTransactions(auth.userId);
    
    return NextResponse.json({ transactions });
  } catch (error) {
    console.error('Get transactions error:', error);
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
    const result = createTransactionSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }
    
    const now = new Date().toISOString();
    const transaction: Transaction = {
      id: generateId(),
      userId: auth.userId,
      ...result.data,
      monthKey: getMonthKey(result.data.date),
      createdAt: now,
      updatedAt: now,
    };
    
    await addTransaction(auth.userId, transaction);
    
    return NextResponse.json({ transaction }, { status: 201 });
  } catch (error) {
    console.error('Create transaction error:', error);
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
        { error: 'Transaction ID required' },
        { status: 400 }
      );
    }
    
    const transactions = await readTransactions(auth.userId);
    const existing = transactions.find((t: Transaction) => t.id === body.id);
    
    if (!existing) {
      return NextResponse.json(
        { error: 'Transaction not found' },
        { status: 404 }
      );
    }
    
    const updated: Transaction = {
      ...existing,
      ...body,
      updatedAt: new Date().toISOString(),
    };
    
    await updateTransaction(auth.userId, updated);
    
    return NextResponse.json({ transaction: updated });
  } catch (error) {
    console.error('Update transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
