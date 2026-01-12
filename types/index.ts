export interface Transaction {
  id: string;
  userId: string;
  amount: number;
  category: string;
  note?: string;
  date: string; // ISO date
  monthKey: string; // "2026-01"
  isIncome: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Loan {
  id: string;
  userId: string;
  name: string;
  principal: number;
  interestRate: number;
  durationMonths: number;
  startDate: string; // ISO date
  emiAmount: number;
  totalInterest: number;
  payments: LoanPayment[];
  createdAt: string;
  updatedAt: string;
}

export interface LoanPayment {
  monthNumber: number;
  isPaid: boolean;
  paidDate?: string;
}

export interface User {
  id: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

export interface Session {
  id: string;
  userId: string;
  expiresAt: string;
  createdAt: string;
}

export interface SyncRequest {
  lastSyncTimestamp: string;
  changes: {
    transactions: {
      new: Transaction[];
      updated: Transaction[];
      deleted: string[]; // IDs
    };
    loans: {
      new: Loan[];
      updated: Loan[];
      deleted: string[]; // IDs
    };
  };
}

export interface SyncResponse {
  syncTimestamp: string;
  changes: {
    transactions: Transaction[];
    loans: Loan[];
    deletedTransactions: string[];
    deletedLoans: string[];
  };
}
