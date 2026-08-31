'use client';

import { useState } from 'react';
import { Eye, EyeOff, Lock, Edit2, Trash2, Wallet } from 'lucide-react';
import { Asset } from '@/lib/types';
import { deleteAsset } from '@/lib/apiClient';
import { ConfirmDialog } from './ConfirmDialog';
import { LoadingOverlay } from './LoadingOverlay';

interface AssetListProps {
  assets: Asset[];
  onDelete: (id: string) => void;
  onEdit: (asset: Asset) => void;
  showBalances?: boolean;
  onToggleVisibility?: () => void;
  isPinLocked?: boolean;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function AssetList({
  assets,
  onDelete,
  onEdit,
  showBalances = true,
  onToggleVisibility,
  isPinLocked = false,
}: AssetListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<{ id: string; name: string } | null>(null);

  const totalAssets = assets.reduce((sum, a) => sum + (Number(a.amount) || 0), 0);

  const triggerDelete = (id: string, name: string) => {
    setAssetToDelete({ id, name: name || 'this asset' });
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    const { id } = assetToDelete;

    setDeletingId(id);
    try {
      await deleteAsset(id);
      onDelete(id);
      setAssetToDelete(null);
    } catch (err) {
      console.error('Failed to delete asset:', err);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Fullscreen Loading Overlay for Deletions */}
      {deletingId && <LoadingOverlay message="REMOVING ASSET..." />}

      {/* Delete Confirmation Modal */}
      <ConfirmDialog
        isOpen={!!assetToDelete}
        onClose={() => setAssetToDelete(null)}
        onConfirm={confirmDelete}
        title="Remove Asset Holding?"
        description={
          <>
            Are you sure you want to remove <strong>{assetToDelete?.name}</strong> from your portfolio?
          </>
        }
        confirmLabel="Remove Asset"
        cancelLabel="Cancel"
        variant="danger"
        isLoading={deletingId === assetToDelete?.id}
      />

      {/* Hero Portfolio Valuation Banner */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Portfolio Valuation
            </span>
            {onToggleVisibility && (
              <button
                type="button"
                onClick={onToggleVisibility}
                className="p-1 rounded text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors flex items-center gap-1"
                title={showBalances ? 'Hide balance figures' : isPinLocked ? 'Enter PIN to reveal figures' : 'Reveal balance figures'}
              >
                {showBalances ? (
                  <Eye className="w-3.5 h-3.5" />
                ) : isPinLocked ? (
                  <Lock className="w-3.5 h-3.5 text-zinc-700" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5" />
                )}
              </button>
            )}
          </div>

          <div className="text-2xl sm:text-4xl font-mono font-bold text-zinc-900 tabular-nums">
            {showBalances ? formatAmount(totalAssets) : '••••••••••••'}
          </div>
          <p className="text-xs text-zinc-500 mt-1 font-sans">
            Cumulative across {assets.length} active holdings and accounts.
          </p>
        </div>

        <div className="px-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200">
          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block">
            Total Holdings
          </span>
          <span className="font-mono text-base font-bold text-zinc-900">
            {assets.length} Positions
          </span>
        </div>
      </div>

      {/* Asset Holdings Table */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-3.5 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-700">
            Holdings Breakdown
          </h3>
          <span className="text-xs font-mono text-zinc-500">
            Allocation Share
          </span>
        </div>

        {assets.length === 0 ? (
          <div className="p-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
            <Wallet className="w-8 h-8 text-zinc-300 stroke-1" />
            <p>No holdings recorded yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-zinc-100">
            {assets.map((asset) => {
              const sharePercent = totalAssets > 0 ? (asset.amount / totalAssets) * 100 : 0;
              return (
                <div
                  key={asset.id}
                  className="p-4 sm:px-6 flex items-center justify-between gap-4 hover:bg-zinc-50/80 transition-colors"
                >
                  <div className="flex items-center gap-3.5 min-w-0">
                    <div className="w-9 h-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-zinc-700 shrink-0">
                      <Wallet className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-zinc-900 truncate">
                        {asset.name}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[11px] font-medium text-zinc-500 font-mono">
                          {sharePercent.toFixed(1)}% of total
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="font-mono text-sm sm:text-base font-bold text-zinc-900 tabular-nums">
                      {showBalances ? formatAmount(asset.amount) : '••••••'}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEdit(asset)}
                        className="p-1.5 rounded text-zinc-400 hover:text-zinc-800 hover:bg-zinc-100 transition-colors"
                        title="Edit holding"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => triggerDelete(asset.id, asset.name)}
                        disabled={deletingId === asset.id}
                        className="p-1.5 rounded text-zinc-400 hover:text-rose-600 hover:bg-zinc-100 transition-colors"
                        title="Remove holding"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
