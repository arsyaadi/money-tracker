'use client';

import { useState } from 'react';
import { Plus, CheckCircle2, AlertCircle, X, Tag } from 'lucide-react';
import { Income, CategoryData } from '@/lib/types';
import { addIncome, addIncomeCategory, deleteIncomeCategory } from '@/lib/apiClient';

function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

interface AddIncomeFormProps {
  categories: CategoryData[];
  onAdd: (income: Income) => void;
  onRefreshCategories?: () => void;
}

export function AddIncomeForm({ categories, onAdd, onRefreshCategories }: AddIncomeFormProps) {
  const today = getLocalToday();

  const [form, setForm] = useState({
    date: today,
    amount: '',
    category: categories.length > 0 ? categories[0].name : 'Salary',
    title: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [addingCatLoading, setAddingCatLoading] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.amount || Number(form.amount) <= 0) {
      setError('Please enter a valid income amount');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const created = await addIncome({
        ...form,
        amount: Number(form.amount),
      });

      onAdd(created);
      setSuccess(true);
      setForm({
        date: today,
        amount: '',
        category: categories.length > 0 ? categories[0].name : 'Salary',
        title: '',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    setAddingCatLoading(true);
    setError('');

    try {
      await addIncomeCategory({ name: newCatName.trim(), icon: 'tag', color: '#09090b' });
      onRefreshCategories?.();
      setForm((prev) => ({ ...prev, category: newCatName.trim() }));
      setIsAddingCategory(false);
      setNewCatName('');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setAddingCatLoading(false);
    }
  };

  const handleDeleteCategory = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    setCategoryToDelete({ id, name });
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    const { id, name } = categoryToDelete;

    setCategoryToDelete(null);
    setDeletingCatId(id);
    setError('');

    try {
      await deleteIncomeCategory(id);
      onRefreshCategories?.();
      if (form.category === name) {
        setForm((prev) => ({
          ...prev,
          category: categories.find((c) => c.name !== name)?.name || 'Salary',
        }));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingCatId(null);
    }
  };

  return (
    <div className="w-full max-w-[620px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
          Record Income
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-sans">
          Log revenue, earnings, or cash inflows.
        </p>
      </header>

      {/* Delete Confirmation Modal */}
      {categoryToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-sm w-full shadow-lg flex flex-col gap-4">
            <div className="flex items-center gap-2 text-zinc-900">
              <AlertCircle className="w-5 h-5 text-rose-600" />
              <h3 className="font-semibold text-base text-zinc-900">Delete Income Source?</h3>
            </div>
            <p className="text-xs text-zinc-600">
              Are you sure you want to remove <strong>{categoryToDelete.name}</strong>?
            </p>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                className="px-4 py-2 rounded-lg border border-zinc-200 text-xs font-medium text-zinc-700 hover:bg-zinc-50 btn-press"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold btn-press"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Income recorded successfully!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          {/* Amount Input */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="amount" className="text-xs font-medium text-zinc-700">
              Amount (IDR)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono font-semibold text-base text-zinc-400 pointer-events-none">
                Rp
              </span>
              <input
                id="amount"
                type="number"
                inputMode="numeric"
                placeholder="0"
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className="w-full pl-12 pr-4 py-3 rounded-lg border border-zinc-200 bg-white text-zinc-900 placeholder-zinc-400 font-mono text-xl font-bold focus:outline-none focus:border-zinc-500 transition-colors"
                required
              />
            </div>
          </div>

          {/* Date & Note Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label htmlFor="date" className="text-xs font-medium text-zinc-700">
                Date
              </label>
              <input
                id="date"
                type="date"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-xs font-mono focus:outline-none focus:border-zinc-500 transition-colors"
                required
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label htmlFor="title" className="text-xs font-medium text-zinc-700">
                Source / Description
              </label>
              <input
                id="title"
                type="text"
                placeholder="e.g., Monthly Salary, Consulting..."
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-xs placeholder-zinc-400 focus:outline-none focus:border-zinc-500 transition-colors"
              />
            </div>
          </div>

          {/* Category Selector */}
          <div className="flex flex-col gap-2.5 pt-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-zinc-700">
                Income Source
              </span>
              <button
                type="button"
                onClick={() => setIsAddingCategory(!isAddingCategory)}
                className="text-xs text-zinc-500 hover:text-zinc-900 font-medium transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingCategory ? 'Cancel' : 'New Source'}</span>
              </button>
            </div>

            {/* Add Custom Category Drawer */}
            {isAddingCategory && (
              <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="New source name..."
                  value={newCatName}
                  onChange={(e) => setNewCatName(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-xs text-zinc-900 focus:outline-none focus:border-zinc-400"
                />
                <button
                  type="button"
                  onClick={handleAddCategory}
                  disabled={addingCatLoading || !newCatName.trim()}
                  className="px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-medium transition-colors disabled:opacity-50"
                >
                  {addingCatLoading ? '...' : 'Add'}
                </button>
              </div>
            )}

            {/* Category Chips List */}
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => {
                const isSelected = form.category === cat.name;
                return (
                  <div
                    key={cat.id}
                    onClick={() => setForm({ ...form, category: cat.name })}
                    className={`group cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors select-none ${
                      isSelected
                        ? 'bg-zinc-900 border-zinc-900 text-white shadow-xs'
                        : 'bg-white border-zinc-200 text-zinc-700 hover:bg-zinc-50'
                    }`}
                  >
                    <Tag className={`w-3.5 h-3.5 ${isSelected ? 'text-zinc-300' : 'text-zinc-500'}`} />
                    <span>{cat.name}</span>

                    {/* Delete Chip */}
                    <button
                      type="button"
                      onClick={(e) => handleDeleteCategory(e, cat.id, cat.name)}
                      disabled={deletingCatId === cat.id}
                      className={`opacity-0 group-hover:opacity-100 hover:text-rose-500 transition-opacity p-0.5 ${
                        isSelected ? 'text-zinc-400 hover:text-white' : 'text-zinc-400'
                      }`}
                      title="Delete source"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Submit CTA */}
          <div className="pt-3">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider btn-press disabled:opacity-50 transition-colors"
            >
              {loading ? 'Saving...' : 'Record Income'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}