'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, ArrowLeft, CheckCircle, Trash2, Clock } from 'lucide-react';
import { Loan } from '@/types';
import { formatCurrency, getNextEMIDate, getDaysUntilDue, getEMIUrgencyColor } from '@/lib/utils';

export default function LoansPage() {
  const router = useRouter();
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);

  useEffect(() => {
    checkAuth();
    fetchLoans();
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

  const fetchLoans = async () => {
    try {
      const response = await fetch('/api/loans');
      if (response.ok) {
        const data = await response.json();
        setLoans(data.loans || []);
      }
    } catch (error) {
      console.error('Failed to fetch loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePayEMI = async (loanId: string, monthNumber: number) => {
    try {
      const response = await fetch(`/api/loans/${loanId}/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ monthNumber }),
      });

      if (response.ok) {
        fetchLoans();
      } else {
        alert('Failed to mark EMI as paid');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const handleDeleteLoan = async (loanId: string) => {
    if (!confirm('Are you sure you want to delete this loan?')) return;

    try {
      const response = await fetch(`/api/loans/${loanId}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchLoans();
      } else {
        alert('Failed to delete loan');
      }
    } catch (error) {
      alert('Network error');
    }
  };

  const getNextEMI = () => {
    let nextEMI: { loan: Loan; date: Date; daysUntil: number } | null = null;

    for (const loan of loans) {
      const nextDate = getNextEMIDate(loan);
      if (nextDate) {
        const daysUntil = getDaysUntilDue(nextDate);
        if (!nextEMI || daysUntil < nextEMI.daysUntil) {
          nextEMI = { loan, date: nextDate, daysUntil };
        }
      }
    }

    return nextEMI;
  };

  const nextEMI = getNextEMI();

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
          <div className="flex items-center gap-4 mb-6">
            <button
              onClick={() => router.push('/')}
              className="p-2 bg-white/20 hover:bg-white/30 rounded-lg transition"
            >
              <ArrowLeft size={20} />
            </button>
            <h1 className="text-2xl font-bold">Loans & EMIs</h1>
          </div>

          {/* Next EMI Alert */}
          {nextEMI && (
            <div className={`bg-white/10 backdrop-blur rounded-xl p-4 ${getEMIUrgencyColor(nextEMI.daysUntil).replace('text-', 'border-l-4 border-')}`}>
              <div className="flex items-center gap-2 mb-2">
                <Clock size={20} />
                <span className="font-semibold">Next EMI Due</span>
              </div>
              <div className="text-2xl font-bold mb-1">
                {formatCurrency(nextEMI.loan.emiAmount)}
              </div>
              <div className="text-sm opacity-90">
                {nextEMI.loan.name} • {nextEMI.date.toLocaleDateString()} 
                {nextEMI.daysUntil >= 0 ? ` (${nextEMI.daysUntil} days)` : ' (Overdue)'}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add Loan Button */}
      <div className="max-w-4xl mx-auto px-6 py-4">
        <button
          onClick={() => setShowAddDialog(true)}
          className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 rounded-xl flex items-center justify-center gap-2 transition shadow-lg"
        >
          <Plus size={20} />
          Add Loan
        </button>
      </div>

      {/* Loans List */}
      <div className="max-w-4xl mx-auto px-6 pb-8">
        {loans.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">No loans yet</div>
            <p className="text-sm text-gray-400">Add a loan to start tracking EMIs</p>
          </div>
        ) : (
          <div className="space-y-4">
            {loans.map(loan => {
              const unpaidPayments = loan.payments.filter(p => !p.isPaid);
              const paidPayments = loan.payments.filter(p => p.isPaid);
              const nextPayment = unpaidPayments[0];
              const progress = (paidPayments.length / loan.payments.length) * 100;

              return (
                <div key={loan.id} className="bg-white rounded-xl p-6 shadow-sm">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-800">{loan.name}</h3>
                      <div className="text-sm text-gray-500 mt-1">
                        Started {new Date(loan.startDate).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteLoan(loan.id)}
                      className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <div className="text-sm text-gray-500">Principal</div>
                      <div className="text-lg font-semibold">{formatCurrency(loan.principal)}</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Interest Rate</div>
                      <div className="text-lg font-semibold">{loan.interestRate}%</div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">EMI Amount</div>
                      <div className="text-lg font-semibold text-orange-600">
                        {formatCurrency(loan.emiAmount)}
                      </div>
                    </div>
                    <div>
                      <div className="text-sm text-gray-500">Total Interest</div>
                      <div className="text-lg font-semibold">{formatCurrency(loan.totalInterest)}</div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Progress</span>
                      <span>{paidPayments.length} / {loan.payments.length} paid</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>

                  {/* Next Payment */}
                  {nextPayment && (
                    <div className="border-t pt-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <div className="text-sm text-gray-500">Next EMI</div>
                          <div className="font-semibold">Month {nextPayment.monthNumber}</div>
                        </div>
                        <button
                          onClick={() => handlePayEMI(loan.id, nextPayment.monthNumber)}
                          className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg transition"
                        >
                          <CheckCircle size={18} />
                          Mark as Paid
                        </button>
                      </div>
                    </div>
                  )}

                  {unpaidPayments.length === 0 && (
                    <div className="border-t pt-4 text-center text-green-600 font-semibold">
                      ✓ All EMIs Paid!
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Loan Dialog */}
      {showAddDialog && (
        <AddLoanDialog
          onClose={() => setShowAddDialog(false)}
          onSuccess={() => {
            setShowAddDialog(false);
            fetchLoans();
          }}
        />
      )}
    </div>
  );
}

function AddLoanDialog({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [name, setName] = useState('');
  const [principal, setPrincipal] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [durationMonths, setDurationMonths] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch('/api/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          principal: parseFloat(principal),
          interestRate: parseFloat(interestRate),
          durationMonths: parseInt(durationMonths),
          startDate,
        }),
      });

      if (response.ok) {
        onSuccess();
      } else {
        alert('Failed to add loan');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl p-6 w-full max-w-md my-8">
        <h2 className="text-2xl font-bold mb-4">Add Loan</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Loan Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="Home Loan, Car Loan, etc."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Principal Amount
            </label>
            <input
              type="number"
              value={principal}
              onChange={(e) => setPrincipal(e.target.value)}
              required
              min="1"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interest Rate (% per year)
            </label>
            <input
              type="number"
              value={interestRate}
              onChange={(e) => setInterestRate(e.target.value)}
              required
              min="0"
              step="0.01"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="0.00"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (months)
            </label>
            <input
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              required
              min="1"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
              placeholder="12"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
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
              className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-lg transition disabled:opacity-50"
            >
              {loading ? 'Adding...' : 'Add Loan'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
