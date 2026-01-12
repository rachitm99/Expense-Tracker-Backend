import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import {
  readTransactions,
  readLoans,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  trackDeletedTransaction,
  addLoan,
  updateLoan,
  deleteLoan,
  trackDeletedLoan,
  getTransactionsSince,
  getLoansSince,
  getDeletedTransactionsSince,
  getDeletedLoansSince,
} from '@/lib/storage';
import { Transaction, Loan } from '@/types';

const transactionSchema = z.object({
  id: z.string(),
  amount: z.number(),
  category: z.string(),
  note: z.string().optional(),
  date: z.string(),
  monthKey: z.string(),
  isIncome: z.boolean(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const loanPaymentSchema = z.object({
  monthNumber: z.number(),
  isPaid: z.boolean(),
  paidDate: z.string().optional(),
});

const loanSchema = z.object({
  id: z.string(),
  name: z.string(),
  principal: z.number(),
  interestRate: z.number(),
  durationMonths: z.number(),
  startDate: z.string(),
  emiAmount: z.number(),
  totalInterest: z.number(),
  payments: z.array(loanPaymentSchema),
  createdAt: z.string(),
  updatedAt: z.string(),
});

const syncSchema = z.object({
  lastSyncTimestamp: z.string(),
  changes: z.object({
    transactions: z.object({
      new: z.array(transactionSchema),
      updated: z.array(transactionSchema),
      deleted: z.array(z.string()),
    }),
    loans: z.object({
      new: z.array(loanSchema),
      updated: z.array(loanSchema),
      deleted: z.array(z.string()),
    }),
  }),
});

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
    const result = syncSchema.safeParse(body);
    
    if (!result.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: result.error.errors },
        { status: 400 }
      );
    }
    
    const { lastSyncTimestamp, changes } = result.data;
    
    // Apply client changes to server
    
    // New transactions
    for (const transaction of changes.transactions.new) {
      const t: Transaction = { ...transaction, userId: auth.userId };
      const transactions = await readTransactions(auth.userId);
      const existing = transactions.find((x: Transaction) => x.id === t.id);
      if (!existing) {
        await addTransaction(auth.userId, t);
      }
    }
    
    // Updated transactions
    for (const transaction of changes.transactions.updated) {
      const t: Transaction = { ...transaction, userId: auth.userId };
      await updateTransaction(auth.userId, t);
    }
    
    // Deleted transactions
    for (const id of changes.transactions.deleted) {
      await deleteTransaction(auth.userId, id);
      await trackDeletedTransaction(auth.userId, id);
    }
    
    // New loans
    for (const loan of changes.loans.new) {
      const l: Loan = { ...loan, userId: auth.userId };
      const loans = await readLoans(auth.userId);
      const existing = loans.find((x: Loan) => x.id === l.id);
      if (!existing) {
        await addLoan(auth.userId, l);
      }
    }
    
    // Updated loans
    for (const loan of changes.loans.updated) {
      const l: Loan = { ...loan, userId: auth.userId };
      await updateLoan(auth.userId, l);
    }
    
    // Deleted loans
    for (const id of changes.loans.deleted) {
      await deleteLoan(auth.userId, id);
      await trackDeletedLoan(auth.userId, id);
    }
    
    // Get server changes since client's last sync
    const serverTransactions = await getTransactionsSince(auth.userId, lastSyncTimestamp);
    const serverLoans = await getLoansSince(auth.userId, lastSyncTimestamp);
    const deletedTransactions = await getDeletedTransactionsSince(auth.userId, lastSyncTimestamp);
    const deletedLoans = await getDeletedLoansSince(auth.userId, lastSyncTimestamp);
    
    const syncTimestamp = new Date().toISOString();
    
    return NextResponse.json({
      syncTimestamp,
      changes: {
        transactions: serverTransactions,
        loans: serverLoans,
        deletedTransactions,
        deletedLoans,
      },
    });
  } catch (error) {
    console.error('Bulk sync error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
