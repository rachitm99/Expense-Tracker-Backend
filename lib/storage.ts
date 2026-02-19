import { Pool } from 'pg';
import { Transaction } from '@/types';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.DATABASE_URL?.includes('sslmode=require') ? { rejectUnauthorized: false } : undefined,
});

// User Storage
export async function getUserByEmail(email: string) {
  const result = await pool.query(
    'SELECT * FROM users WHERE email = $1 LIMIT 1',
    [email]
  );
  return result.rows[0];
}

export async function getUserById(userId: string) {
  const result = await pool.query(
    'SELECT * FROM users WHERE id = $1 LIMIT 1',
    [userId]
  );
  return result.rows[0];
}

export async function createUser(user: { id: string; email: string; passwordHash: string; createdAt: string }) {
  await pool.query(
    'INSERT INTO users (id, email, password_hash, created_at) VALUES ($1, $2, $3, $4)',
    [user.id, user.email, user.passwordHash, user.createdAt]
  );
}

// Transaction Storage
export async function readTransactions(userId: string): Promise<Transaction[]> {
  const result = await pool.query(
    `SELECT 
      id,
      user_id as "userId",
      amount,
      category,
      note,
      date,
      month_key as "monthKey",
      is_income as "isIncome",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM transactions
    WHERE user_id = $1 AND deleted_at IS NULL
    ORDER BY date DESC`,
    [userId]
  );
  
  return result.rows.map(row => ({
    ...row,
    amount: parseFloat(row.amount),
  })) as Transaction[];
}

export async function addTransaction(userId: string, transaction: Transaction): Promise<void> {
  await pool.query(
    `INSERT INTO transactions (
      id, user_id, amount, category, note, date, month_key, 
      is_income, created_at, updated_at
    )
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
    [
      transaction.id, userId, transaction.amount, transaction.category,
      transaction.note || null, transaction.date, transaction.monthKey,
      transaction.isIncome, transaction.createdAt, transaction.updatedAt
    ]
  );
}

export async function updateTransaction(userId: string, transaction: Transaction): Promise<void> {
  await pool.query(
    `UPDATE transactions
    SET 
      amount = $1,
      category = $2,
      note = $3,
      date = $4,
      month_key = $5,
      is_income = $6,
      updated_at = $7
    WHERE id = $8 AND user_id = $9`,
    [
      transaction.amount, transaction.category, transaction.note || null,
      transaction.date, transaction.monthKey, transaction.isIncome,
      transaction.updatedAt, transaction.id, userId
    ]
  );
}

export async function deleteTransaction(userId: string, transactionId: string): Promise<void> {
  await pool.query(
    'UPDATE transactions SET deleted_at = NOW() WHERE id = $1 AND user_id = $2',
    [transactionId, userId]
  );
}

export async function getTransactionsSince(userId: string, timestamp: string): Promise<Transaction[]> {
  const result = await pool.query(
    `SELECT 
      id,
      user_id as "userId",
      amount,
      category,
      note,
      date,
      month_key as "monthKey",
      is_income as "isIncome",
      created_at as "createdAt",
      updated_at as "updatedAt"
    FROM transactions
    WHERE user_id = $1 
      AND updated_at > $2
      AND deleted_at IS NULL
    ORDER BY updated_at ASC`,
    [userId, timestamp]
  );
  
  return result.rows.map(row => ({
    ...row,
    amount: parseFloat(row.amount),
  })) as Transaction[];
}

// Deleted Items Tracking
export async function trackDeletedTransaction(userId: string, transactionId: string): Promise<void> {
  await pool.query(
    'INSERT INTO deleted_items (user_id, item_type, item_id, deleted_at) VALUES ($1, $2, $3, NOW())',
    [userId, 'transaction', transactionId]
  );
}

export async function getDeletedTransactionsSince(userId: string, timestamp: string): Promise<string[]> {
  const result = await pool.query(
    `SELECT item_id
    FROM deleted_items
    WHERE user_id = $1
      AND item_type = $2
      AND deleted_at > $3
    ORDER BY deleted_at ASC`,
    [userId, 'transaction', timestamp]
  );
  
  return result.rows.map(row => row.item_id);
}
