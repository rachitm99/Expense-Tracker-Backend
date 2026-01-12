'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, Briefcase } from 'lucide-react';
import { Transaction, Loan } from '@/types';
import { formatCurrency, groupTransactionsByMonth, sortByDate, getPendingEMIs, calculateTotalPendingEMI, PendingEMI } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isIncome, setIsIncome] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchData();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/session');
      if (!response.ok) {
        router.push('/auth');
      }
    } catch (error) {
      router.push('/auth');
    }
  };

  const fetchData = async () => {
    try {
      const [transactionsRes, loansRes] = await Promise.all([
        fetch('/api/transactions'),
        fetch('/api/loans'),
      ]);

      if (transactionsRes.ok) {
        const data = await transactionsRes.json();
        setTransactions(data.transactions || []);
      }

      if (loansRes.ok) {
        const data = await loansRes.json();
        setLoans(data.loans || []);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/auth');
  };

  const calculateStats = () => {
    const income = transactions
      .filter(t => t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter(t => !t.isIncome)
      .reduce((sum, t) => sum + t.amount, 0);
    
    // Calculate pending EMIs (current + next month)
    const pendingEMITotal = calculateTotalPendingEMI(loans);
    
    // Total Wealth = Income - Expenses - Pending EMIs
    const wealth = income - expenses - pendingEMITotal;
    
    return { income, expenses, wealth, pendingEMITotal };
  };

  const stats = calculateStats();
  
  // Get pending EMIs
  const pendingEMIs = getPendingEMIs(loans);
  
  // Combine transactions and pending EMIs for display
  type DisplayItem = Transaction | PendingEMI;
  const allItems: DisplayItem[] = [...transactions, ...pendingEMIs];
  const sortedItems = sortByDate(allItems) as DisplayItem[];
  const groupedItems = groupTransactionsByMonth(sortedItems);
  const sortedMonths = Array.from(groupedItems.keys()).sort().reverse();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with TOTAL WEALTH */}
      <div className="bg-gradient-to-br from-purple-600 via-blue-600 to-indigo-600 text-white shadow-xl">
        <div className="max-w-4xl mx-auto px-6 py-8">
          {/* Top Bar */}
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-xl font-semibold">Expense Tracker</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/loans')}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                title="Loans & EMIs"
              >
                <Briefcase size={20} />
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
                title="Logout"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Total Wealth Display */}
          <div className="text-center mb-6">
            <div className="text-sm font-medium opacity-80 uppercase tracking-wider mb-2">
              Total Wealth
            </div>
            <div className="text-6xl font-bold mb-4">
              ₹{stats.wealth.toFixed(2)}
            </div>
            <div className="flex justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="text-green-300 font-semibold">Income:</span>
                <span className="font-medium">₹{stats.income.toFixed(2)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-red-300 font-semibold">Expenses:</span>
                <span className="font-medium">₹{stats.expenses.toFixed(2)}</span>
              </div>
              {stats.pendingEMITotal > 0 && (
                <div className="flex items-center gap-2">
                  <span className="text-orange-300 font-semibold">Pending EMIs:</span>
                  <span className="font-medium">₹{stats.pendingEMITotal.toFixed(2)}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <div className="flex gap-3">
          <button
            onClick={() => {
              setIsIncome(true);
              setShowAddDialog(true);
            }}
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md"
          >
            <Plus size={20} />
            Income
          </button>
          <button
            onClick={() => {
              setIsIncome(false);
              setShowAddDialog(true);
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-md"
          >
            <Plus size={20} />
            Expense
          </button>
        </div>
      </div>

      {/* Transactions List with Pending EMIs */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        {sortedMonths.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
            <div className="text-5xl mb-4">💰</div>
            <p className="text-gray-600 font-medium">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-2">Start tracking by adding income or expenses</p>
          </div>
        ) : (
          sortedMonths.map(monthKey => {
            const monthItems = groupedItems.get(monthKey) || [];
            const monthDate = new Date(monthKey + '-01');
            
            return (
              <div key={monthKey} className="mb-8">
                {/* Month Header */}
                <div className="text-lg font-bold text-gray-700 mb-3">
                  {monthDate.toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                
                {/* Items */}
                <div className="space-y-2">
                  {monthItems.map(item => {
                    // Check if it's a pending EMI
                    const isPending = 'isPending' in item && item.isPending;
                    
                    if (isPending) {
                      const pendingItem = item as PendingEMI;
                      const dueDate = new Date(pendingItem.date);
                      const monthName = dueDate.toLocaleDateString('en-US', { month: 'short' });
                      
                      return (
                        <div
                          key={pendingItem.id}
                          className="bg-orange-50 border-l-4 border-orange-400 rounded-xl p-4 shadow-sm"
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <div className="font-semibold text-orange-900">
                                Pending EMI
                              </div>
                              <div className="text-sm text-orange-700 mt-1">
                                Loan: {pendingItem.loanName}
                              </div>
                              <div className="text-xs text-orange-600 mt-1">
                                Due 1 {monthName}
                              </div>
                            </div>
                            <div className="text-xl font-bold text-orange-600">
                              ₹{pendingItem.amount.toFixed(2)}
                            </div>
                          </div>
                        </div>
                      );
                    }
                    
                    // Regular transaction
                    const transaction = item as Transaction;
                    return (
                      <div
                        key={transaction.id}
                        className="bg-white rounded-xl p-4 shadow-sm hover:shadow-md transition"
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="font-semibold text-gray-800">
                              {transaction.category}
                            </div>
                            {transaction.note && (
                              <div className="text-sm text-gray-500 mt-1">
                                {transaction.note}
                              </div>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              {new Date(transaction.date).toLocaleDateString('en-US', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                              })}
                            </div>
                          </div>
                          <div
                            className={`text-xl font-bold ${
                              transaction.isIncome ? 'text-green-600' : 'text-red-600'
                            }`}
                          >
                            {transaction.isIncome ? '+' : '-'}₹{transaction.amount.toFixed(2)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Add Transaction Dialog */}
      {showAddDialog && (
        <AddTransactionDialog
          isIncome={isIncome}
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            setShowAddDialog(false);
            fetchData();
          }}
        />
      )}
    </div>
  );
}

function AddTransactionDialog({
  isIncome,
  onClose,
  onSuccess,
}: {
  isIncome: boolean;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [amount, setAmount] = useState('');
  const [category, setCategory] = useState('');
  const [note, setNote] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(amount),
          category,
          note: note || undefined,
          date,
          isIncome,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Failed to add transaction');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md">
        <h2 className="text-2xl font-bold mb-4">
          Add {isIncome ? 'Income' : 'Expense'}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="0.01"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="Food, Salary, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Note (optional)
            </label>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="Additional details"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className={`flex-1 px-4 py-2 text-white font-semibold rounded-lg transition ${
                isIncome
                  ? 'bg-green-500 hover:bg-green-600'
                  : 'bg-red-500 hover:bg-red-600'
              } disabled:opacity-50`}
            >
              {loading ? 'Adding...' : 'Add'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
