'use client';

import { useState } from 'react';
import { Trash2, ReceiptText } from 'lucide-react';
import { Expense, CategoryData } from '@/lib/types';
import { deleteExpense } from '@/lib/apiClient';
import { CategoryBadge } from './CategoryBadge';
import { ConfirmDialog } from './ConfirmDialog';

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

export function ExpenseList({
  expenses,
  categories,
  onDelete,
}: ExpenseListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [expenseToDelete, setExpenseToDelete] = useState<{ id: string; title: string } | null>(null);

  const triggerDelete = (id: string, title: string) => {
    setExpenseToDelete({ id, title: title || 'this expense' });
  };

  const confirmDelete = async () => {
    if (!expenseToDelete) return;
    const { id } = expenseToDelete;

    setDeletingId(id);
    try {
      await deleteExpense(id);
      onDelete(id);
      setExpenseToDelete(null);
    } catch (err) {
      console.error('Failed to delete expense:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = expenses.reduce((acc, expense) => {
    const d = expense?.date ? String(expense.date).substring(0, 10) : 'Unknown Date';
    if (!acc[d]) {
      acc[d] = [];
    }
    acc[d].push(expense);
    return acc;
  }, {} as Record<string, Expense[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === 'Unknown Date') return 1;
    if (b === 'Unknown Date') return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (expenses.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2 text-zinc-400">
        <ReceiptText className="w-8 h-8 text-zinc-300 stroke-1" />
        <h3 className="text-sm font-medium text-zinc-700">No expense records found</h3>
        <p className="text-xs">Entries will appear here in chronological order.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!expenseToDelete}
        onClose={() => setExpenseToDelete(null)}
        onConfirm={confirmDelete}
        title="Delete Expense Record?"
        description={
          <>
            Are you sure you want to delete <strong>{expenseToDelete?.title}</strong>? This action will remove the record permanently from your ledger.
          </>
        }
        confirmLabel="Delete Record"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deletingId === expenseToDelete?.id}
      />

      {sortedDates.map((date) => {
        const dayExpenses = grouped[date];
        const dayTotal = dayExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);

        const d = date !== 'Unknown Date' ? new Date(date + 'T00:00:00') : null;
        const formattedDate =
          d && !isNaN(d.getTime())
            ? new Intl.DateTimeFormat('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              }).format(d)
            : date;

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
                      <Trash2 className="w-3.5 h-3.5" />
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
