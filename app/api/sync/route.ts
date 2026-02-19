import { NextResponse } from 'next/server';
import { z } from 'zod';
import { requireAuth } from '@/lib/auth';
import {
  readTransactions,
  addTransaction,
  updateTransaction,
  deleteTransaction,
  trackDeletedTransaction,
  getTransactionsSince,
  getDeletedTransactionsSince,
} from '@/lib/storage';
import { Transaction } from '@/types';

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

const syncSchema = z.object({
  lastSyncTimestamp: z.string(),
  changes: z.object({
    transactions: z.object({
      new: z.array(transactionSchema),
      updated: z.array(transactionSchema),
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
    
    // Summary log for what we received/applied
    try {
      console.log('[/api/sync] Applied client changes summary:', JSON.stringify({
        transactions: {
          new: changes.transactions.new.length,
          updated: changes.transactions.updated.length,
          deleted: changes.transactions.deleted.length,
        }
      }, null, 2));
    } catch (e) {
      console.log('[/api/sync] Applied client changes summary (non-serializable)');
    }

    // Get server changes since client's last sync
    const serverTransactions = await getTransactionsSince(auth.userId, lastSyncTimestamp);
    const deletedTransactions = await getDeletedTransactionsSince(auth.userId, lastSyncTimestamp);
    
    const syncTimestamp = new Date().toISOString();
    
    return NextResponse.json({
      syncTimestamp,
      changes: {
        transactions: serverTransactions,
        deletedTransactions,
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
