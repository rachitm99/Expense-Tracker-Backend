'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, LogOut, TrendingUp, TrendingDown, Wallet } from 'lucide-react';
import { Transaction } from '@/types';
import { formatCurrency, groupTransactionsByMonth, sortByDate } from '@/lib/utils';

export default function DashboardPage() {
  const router = useRouter();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [isIncome, setIsIncome] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchTransactions();
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

  const fetchTransactions = async () => {
    try {
      const response = await fetch('/api/transactions');
      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error);
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
    return { income, expenses, wealth: income - expenses };
  };

  const stats = calculateStats();
  const groupedTransactions = groupTransactionsByMonth(sortByDate(transactions));
  const sortedMonths = Array.from(groupedTransactions.keys()).sort().reverse();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-xl text-gray-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-600 to-blue-600 text-white p-6 shadow-lg">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-2xl font-bold">Expense Tracker</h1>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/loans')}
                className="px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                Loans
              </button>
              <button
                onClick={handleLogout}
                className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>

          {/* Wealth Display */}
          <div className="text-center mb-6">
            <div className="text-sm opacity-90 mb-1">Total Wealth</div>
            <div className="text-5xl font-bold mb-2">
              {formatCurrency(stats.wealth)}
            </div>
          </div>

          {/* Income & Expenses */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp size={20} className="text-green-300" />
                <span className="text-sm opacity-90">Income</span>
              </div>
              <div className="text-2xl font-bold text-green-300">
                {formatCurrency(stats.income)}
              </div>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown size={20} className="text-red-300" />
                <span className="text-sm opacity-90">Expenses</span>
              </div>
              <div className="text-2xl font-bold text-red-300">
                {formatCurrency(stats.expenses)}
              </div>
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
            className="flex-1 bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
          >
            <Plus size={20} />
            Add Income
          </button>
          <button
            onClick={() => {
              setIsIncome(false);
              setShowAddDialog(true);
            }}
            className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
          >
            <Plus size={20} />
            Add Expense
          </button>
        </div>
      </div>

      {/* Transactions List */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        {sortedMonths.length === 0 ? (
          <div className="text-center py-12">
            <Wallet size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">No transactions yet</p>
            <p className="text-sm text-gray-400 mt-1">Add your first transaction above</p>
          </div>
        ) : (
          sortedMonths.map(monthKey => {
            const monthTransactions = groupedTransactions.get(monthKey) || [];
            return (
              <div key={monthKey} className="mb-6">
                <div className="text-sm font-semibold text-gray-600 mb-3 uppercase">
                  {new Date(monthKey + '-01').toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
                <div className="space-y-2">
                  {monthTransactions.map(transaction => (
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
                            {new Date(transaction.date).toLocaleDateString()}
                          </div>
                        </div>
                        <div
                          className={`text-xl font-bold ${
                            transaction.isIncome ? 'text-green-600' : 'text-red-600'
                          }`}
                        >
                          {transaction.isIncome ? '+' : '-'}
                          {formatCurrency(transaction.amount)}
                        </div>
                      </div>
                    </div>
                  ))}
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
            fetchTransactions();
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
