'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { Asset } from '@/lib/types';
import { addAsset, updateAsset } from '@/lib/apiClient';
import { LoadingOverlay } from './LoadingOverlay';

interface AddAssetFormProps {
  onAdd: (asset: Asset) => void;
  editingAsset?: Asset | null;
  onUpdate?: (asset: Asset) => void;
  onCancelEdit?: () => void;
}

export function AddAssetForm({ onAdd, editingAsset, onUpdate, onCancelEdit }: AddAssetFormProps) {
  const [form, setForm] = useState({
    name: '',
    amount: '',
    icon: 'wallet',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isEditing = !!editingAsset;

  useEffect(() => {
    if (editingAsset) {
      const raw = String(editingAsset.amount).replace(/\D/g, '');
      const formatted = raw ? new Intl.NumberFormat('id-ID').format(Number(raw)) : '';
      setForm({
        name: editingAsset.name,
        amount: formatted,
        icon: editingAsset.icon || 'wallet',
      });
    } else {
      setForm({
        name: '',
        amount: '',
        icon: 'wallet',
      });
    }
  }, [editingAsset]);

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    const formatted = digits ? new Intl.NumberFormat('id-ID').format(Number(digits)) : '';
    setForm((prev) => ({ ...prev, amount: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setError('Please enter asset holding name');
      return;
    }
    const rawAmount = Number(form.amount.replace(/\D/g, ''));
    if (isNaN(rawAmount) || rawAmount < 0) {
      setError('Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      if (isEditing && editingAsset) {
        const updated = await updateAsset({
          id: editingAsset.id,
          name: form.name.trim(),
          amount: rawAmount,
          icon: form.icon,
        });
        onUpdate?.(updated);
      } else {
        const created = await addAsset({
          name: form.name.trim(),
          amount: rawAmount,
          icon: form.icon,
        });
        onAdd(created);
      }

      setSuccess(true);
      setForm({
        name: '',
        amount: '',
        icon: 'wallet',
      });
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[620px] mx-auto flex flex-col gap-6">
      {/* Fullscreen Loading Overlay for Actions */}
      {loading && (
        <LoadingOverlay message={isEditing ? 'UPDATING ASSET...' : 'ADDING ASSET...'} />
      )}

      {/* Main Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-5">
        <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
          <h2 className="text-sm font-bold text-zinc-900 uppercase tracking-wider">
            {isEditing ? 'Edit Asset Holding' : 'Add Asset Holding'}
          </h2>
          {isEditing && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="text-xs text-zinc-500 hover:text-zinc-900 font-medium"
            >
              Cancel
            </button>
          )}
        </div>

        {error && (
          <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>Asset holding saved!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="asset-name" className="text-xs font-medium text-zinc-700">
              Holding / Account Name
            </label>
            <input
              id="asset-name"
              type="text"
              placeholder="e.g., Bank BCA, Emergency Fund, Gold..."
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="w-full px-3.5 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 text-xs focus:outline-none focus:border-zinc-500"
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="asset-amount" className="text-xs font-medium text-zinc-700">
              Valuation / Balance (IDR)
            </label>
            <div className="relative flex items-center">
              <span className="absolute left-3.5 font-mono font-semibold text-sm text-zinc-400 pointer-events-none">
                Rp
              </span>
              <input
                id="asset-amount"
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={form.amount}
                onChange={handleAmountChange}
                className="w-full pl-12 pr-4 py-2.5 rounded-lg border border-zinc-200 bg-white text-zinc-900 font-mono text-base font-bold focus:outline-none focus:border-zinc-500"
                required
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-2.5 px-4 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold uppercase tracking-wider btn-press disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
              <span>{loading ? (isEditing ? 'Updating Holding...' : 'Saving Holding...') : isEditing ? 'Update Holding' : 'Add Holding'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}