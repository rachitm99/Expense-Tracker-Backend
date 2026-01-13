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

    // Log incoming body for debugging (trim large items)
    try {
      console.log('[/api/sync] Incoming body:', JSON.stringify(body, null, 2));
    } catch (e) {
      console.log('[/api/sync] Incoming body (non-serializable)');
    }

    // Validate input
    const result = syncSchema.safeParse(body);

    if (!result.success) {
      console.error('[/api/sync] Validation failed:', result.error.format());
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
      console.log(`[/api/sync] New transaction from client: id=${t.id} amount=${t.amount} category=${t.category}`);
      const transactions = await readTransactions(auth.userId);
      const existing = transactions.find((x: Transaction) => x.id === t.id);
      if (!existing) {
        console.log(`[/api/sync] Inserting transaction id=${t.id}`);
        await addTransaction(auth.userId, t);
      } else {
        console.log(`[/api/sync] Skipping insert; transaction already exists id=${t.id}`);
      }
    }
    
    // Updated transactions
    for (const transaction of changes.transactions.updated) {
      const t: Transaction = { ...transaction, userId: auth.userId };
      console.log(`[/api/sync] Updating transaction id=${t.id} amount=${t.amount}`);
      await updateTransaction(auth.userId, t);
    }
    
    // Deleted transactions
    for (const id of changes.transactions.deleted) {
      console.log(`[/api/sync] Deleting transaction id=${id}`);
      await deleteTransaction(auth.userId, id);
      await trackDeletedTransaction(auth.userId, id);
    }
    
    // New loans
    for (const loan of changes.loans.new) {
      const l: Loan = { ...loan, userId: auth.userId };
      console.log(`[/api/sync] New loan from client: id=${l.id} name=${l.name} principal=${l.principal}`);
      const loans = await readLoans(auth.userId);
      const existing = loans.find((x: Loan) => x.id === l.id);
      if (!existing) {
        console.log(`[/api/sync] Inserting loan id=${l.id}`);
        await addLoan(auth.userId, l);
      } else {
        console.log(`[/api/sync] Skipping insert; loan already exists id=${l.id}`);
      }
    }
    
    // Updated loans
    for (const loan of changes.loans.updated) {
      const l: Loan = { ...loan, userId: auth.userId };
      console.log(`[/api/sync] Updating loan id=${l.id} name=${l.name}`);
      await updateLoan(auth.userId, l);
    }
    
    // Deleted loans
    for (const id of changes.loans.deleted) {
      console.log(`[/api/sync] Deleting loan id=${id}`);
      await deleteLoan(auth.userId, id);
      await trackDeletedLoan(auth.userId, id);
    }
    
    // Summary log for what we received/applied
    try {
      console.log('[/api/sync] Applied client changes summary:', JSON.stringify({
        transactions: {
          new: changes.transactions.new.length,
          updated: changes.transactions.updated.length,
          deleted: changes.transactions.deleted.length,
        },
        loans: {
          new: changes.loans.new.length,
          updated: changes.loans.updated.length,
          deleted: changes.loans.deleted.length,
        }
      }, null, 2));
    } catch (e) {
      console.log('[/api/sync] Applied client changes summary (non-serializable)');
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
