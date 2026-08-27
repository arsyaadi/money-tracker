'use client';

import { useState } from 'react';
import { Expense, CategoryData } from '@/lib/types';
import { deleteExpense } from '@/lib/apiClient';
import { CategoryBadge } from './CategoryBadge';

interface ExpenseListProps {
  expenses: Expense[];
  categories: CategoryData[];
  onDelete: (id: string) => void;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function ExpenseList({ expenses, categories, onDelete }: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);

  const triggerDelete = (id: string, title: string) => {
    setExpenseToDelete({ id, title: title || 'this expense' });
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    const { id } = expenseToDelete;

    setExpenseToDelete(null);
    setDeletingId(id);
    try {
      await deleteExpense(id);
      onDelete(id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete expense');
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = expenses.reduce((acc, expense) => {
    if (!acc[expense.date]) {
      acc[expense.date] = [];
    }
    acc[expense.date].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (expenses.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2 text-zinc-400">
        <span className="material-symbols-outlined text-3xl text-zinc-300">receipt_long</span>
        <h3 className="text-sm font-medium text-zinc-700">No expense records found</h3>
        <p className="text-xs">Entries will appear here in chronological order.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Delete Confirmation Modal */}
      {expenseToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-sm w-full shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2 text-rose-600">
              <span className="material-symbols-outlined text-xl">warning</span>
              <h3 className="font-semibold text-base text-zinc-900">Delete Expense?</h3>
            </div>
            <p className="text-xs text-zinc-600">
              Are you sure you want to delete <strong>{expenseToDelete.title}</strong>?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setExpenseToDelete(null)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 btn-press"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold btn-press"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {sortedDates.map((date) => {
        const dayExpenses = grouped[date];
        const dayTotal = dayExpenses.reduce((s, e) => s + e.amount, 0);

        const d = new Date(date + 'T00:00:00');
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }).format(d);

        return (
          <div
            key={date}
            className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs"
          >
            {/* Day Header */}
            <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
              <span className="font-medium text-xs text-zinc-800">
                {formattedDate}
              </span>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-zinc-400 font-mono">
                  {dayExpenses.length} {dayExpenses.length === 1 ? 'item' : 'items'}
                </span>
                <span className="font-mono text-xs font-bold text-rose-600 tabular-nums">
                  - {formatAmount(dayTotal)}
                </span>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-zinc-100">
              {dayExpenses.map((expense) => (
                <div
                  key={expense.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryBadge
                      categoryName={expense.category}
                      categories={categories}
                      size="sm"
                    />
                    <span className="text-xs font-medium text-zinc-800 truncate font-sans">
                      {expense.title || <span className="text-zinc-400 italic">Untitled</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs sm:text-sm font-bold text-rose-600 tabular-nums">
                      - {formatAmount(expense.amount)}
                    </span>

                    <button
                      type="button"
                      onClick={() => triggerDelete(expense.id, expense.title)}
                      disabled={deletingId === expense.id}
                      className="p-1 text-zinc-400 hover:text-rose-600 transition-colors rounded"
                      title="Delete expense"
                    >
                      <span className="material-symbols-outlined text-base">delete</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
