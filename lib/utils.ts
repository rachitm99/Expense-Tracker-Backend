import { nanoid } from 'nanoid';

export function generateId(): string {
  return nanoid();
}

export function getMonthKey(date: string): string {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function groupTransactionsByMonth<T extends { monthKey: string }>(
  transactions: T[]
): Map<string, T[]> {
  const grouped = new Map<string, T[]>();
  
  for (const transaction of transactions) {
    const existing = grouped.get(transaction.monthKey) || [];
    existing.push(transaction);
    grouped.set(transaction.monthKey, existing);
  }
  
  return grouped;
}

export function sortByDate<T extends { date: string }>(
  items: T[],
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    return order === 'desc' ? dateB - dateA : dateA - dateB;
  });
}
