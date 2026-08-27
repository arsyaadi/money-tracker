'use client';

import { useState } from 'react';
import { AlertCircle, Trash2, ArrowDownLeft } from 'lucide-react';
import { Income, CategoryData } from '@/lib/types';
import { deleteIncome } from '@/lib/apiClient';
import { CategoryBadge } from './CategoryBadge';

interface IncomeListProps {
  incomes: Income[];
  categories: CategoryData[];
  onDelete: (id: string) => void;
  showBalances?: boolean;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function IncomeList({
  incomes,
  categories,
  onDelete,
  showBalances = true,
}: IncomeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<{ id: string; title: string } | null>(null);

  const triggerDelete = (id: string, title: string) => {
    setIncomeToDelete({ id, title: title || 'this income' });
  };

  const confirmDelete = async () => {
    if (!incomeToDelete) return;
    const { id } = incomeToDelete;

    setIncomeToDelete(null);
    setDeletingId(id);
    try {
      await deleteIncome(id);
      onDelete(id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete income');
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = incomes.reduce((acc, income) => {
    const d = income?.date ? String(income.date).substring(0, 10) : 'Unknown Date';
    if (!acc[d]) {
      acc[d] = [];
    }
    acc[d].push(income);
    return acc;
  }, {} as Record<string, Income[]>);

  const sortedDates = Object.keys(grouped).sort((a, b) => {
    if (a === 'Unknown Date') return 1;
    if (b === 'Unknown Date') return -1;
    return new Date(b).getTime() - new Date(a).getTime();
  });

  if (incomes.length === 0) {
    return (
      <div className="bg-white border border-zinc-200 rounded-xl p-12 text-center flex flex-col items-center justify-center gap-2 text-zinc-400">
        <ArrowDownLeft className="w-8 h-8 text-zinc-300 stroke-1" />
        <h3 className="text-sm font-medium text-zinc-700">No income records found</h3>
        <p className="text-xs">Entries will appear here in chronological order.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      {/* Delete Confirmation Modal */}
      {incomeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-sm w-full shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2 text-zinc-900">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h3 className="font-semibold text-base text-zinc-900">Delete Income Entry?</h3>
            </div>
            <p className="text-xs text-zinc-600">
              Are you sure you want to delete <strong>{incomeToDelete.title}</strong>?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setIncomeToDelete(null)}
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
        const dayIncomes = grouped[date];
        const dayTotal = dayIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);

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
                  {dayIncomes.length} {dayIncomes.length === 1 ? 'item' : 'items'}
                </span>
                <span className="font-mono text-xs font-bold text-emerald-600 tabular-nums">
                  {showBalances ? `+ ${formatAmount(dayTotal)}` : '••••••'}
                </span>
              </div>
            </div>

            {/* Rows */}
            <div className="divide-y divide-zinc-100">
              {dayIncomes.map((income) => (
                <div
                  key={income.id}
                  className="p-3.5 sm:px-5 flex items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <CategoryBadge
                      categoryName={income.category}
                      categories={categories}
                      size="sm"
                    />
                    <span className="text-xs font-medium text-zinc-800 truncate font-sans">
                      {income.title || <span className="text-zinc-400 italic">Untitled</span>}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs sm:text-sm font-bold text-emerald-600 tabular-nums">
                      {showBalances ? `+ ${formatAmount(income.amount)}` : '••••••'}
                    </span>

                    <button
                      type="button"
                      onClick={() => triggerDelete(income.id, income.title)}
                      disabled={deletingId === income.id}
                      className="p-1 text-zinc-400 hover:text-rose-600 transition-colors rounded"
                      title="Delete income"
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