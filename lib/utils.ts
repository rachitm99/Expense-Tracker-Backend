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

export function calculateEMI(
  principal: number,
  annualRate: number,
  durationMonths: number
): number {
  const monthlyRate = annualRate / 12 / 100;
  
  if (monthlyRate === 0) {
    return principal / durationMonths;
  }
  
  const emi =
    (principal * monthlyRate * Math.pow(1 + monthlyRate, durationMonths)) /
    (Math.pow(1 + monthlyRate, durationMonths) - 1);
  
  return Math.round(emi * 100) / 100;
}

export function calculateTotalInterest(
  principal: number,
  emiAmount: number,
  durationMonths: number
): number {
  const totalPayment = emiAmount * durationMonths;
  return Math.round((totalPayment - principal) * 100) / 100;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function getNextEMIDate(loan: {
  startDate: string;
  payments: Array<{ monthNumber: number; isPaid: boolean }>;
}): Date | null {
  const unpaidPayment = loan.payments.find(p => !p.isPaid);
  
  if (!unpaidPayment) return null;
  
  const startDate = new Date(loan.startDate);
  const nextDate = new Date(startDate);
  nextDate.setMonth(startDate.getMonth() + unpaidPayment.monthNumber - 1);
  
  return nextDate;
}

export function getDaysUntilDue(dueDate: Date): number {
  const now = new Date();
  const diff = dueDate.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function getEMIUrgencyColor(daysUntil: number): string {
  if (daysUntil < 0) return 'text-red-600';
  if (daysUntil <= 7) return 'text-red-500';
  if (daysUntil <= 14) return 'text-orange-500';
  if (daysUntil <= 21) return 'text-yellow-500';
  return 'text-blue-500';
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

export interface PendingEMI {
  id: string;
  loanId: string;
  loanName: string;
  amount: number;
  date: string;
  monthKey: string;
  monthNumber: number;
  isPending: true;
}

export function getPendingEMIs(loans: Array<{
  id: string;
  name: string;
  emiAmount: number;
  startDate: string;
  payments: Array<{ monthNumber: number; isPaid: boolean }>;
}>): PendingEMI[] {
  const pendingEMIs: PendingEMI[] = [];
  const currentDate = new Date();
  const currentMonth = getMonthKey(currentDate.toISOString());
  const nextMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1);
  const nextMonthKey = getMonthKey(nextMonth.toISOString());

  for (const loan of loans) {
    const unpaidPayments = loan.payments.filter(p => !p.isPaid);
    
    for (const payment of unpaidPayments) {
      const startDate = new Date(loan.startDate);
      const emiDate = new Date(startDate.getFullYear(), startDate.getMonth() + payment.monthNumber - 1, 1);
      const emiMonthKey = getMonthKey(emiDate.toISOString());
      
      // Include EMIs for current and next month only
      if (emiMonthKey === currentMonth || emiMonthKey === nextMonthKey) {
        pendingEMIs.push({
          id: `pending-${loan.id}-${payment.monthNumber}`,
          loanId: loan.id,
          loanName: loan.name,
          amount: loan.emiAmount,
          date: emiDate.toISOString(),
          monthKey: emiMonthKey,
          monthNumber: payment.monthNumber,
          isPending: true,
        });
      }
    }
  }

  return pendingEMIs;
}

export function calculateTotalPendingEMI(loans: Array<{
  id: string;
  name: string;
  emiAmount: number;
  startDate: string;
  payments: Array<{ monthNumber: number; isPaid: boolean }>;
}>): number {
  const pendingEMIs = getPendingEMIs(loans);
  return pendingEMIs.reduce((sum, emi) => sum + emi.amount, 0);
}
