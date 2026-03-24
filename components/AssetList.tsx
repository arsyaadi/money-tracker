'use client';

import { useState } from 'react';
import { Asset } from '@/lib/types';

interface AssetListProps {
  assets: Asset[];
  onDelete: (id: string) => void;
  onEdit: (asset: Asset) => void;
}

export function AssetList({ assets, onDelete, onEdit }: AssetListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [assetToDelete, setAssetToDelete] = useState<Asset | null>(null);
  const [showTotal, setShowTotal] = useState(false);

  const handleDeleteClick = (asset: Asset) => {
    setAssetToDelete(asset);
  };

  const confirmDelete = async () => {
    if (!assetToDelete) return;
    
    setAssetToDelete(null);
    setDeletingId(assetToDelete.id);
    
    try {
      const deploymentId = localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID');
      const res = await fetch(`/api/assets?id=${assetToDelete.id}`, {
        method: 'DELETE',
        headers: deploymentId ? { 'x-deployment-id': deploymentId } : {}
      });

      if (!res.ok) throw new Error('Failed to delete asset');
      
      onDelete(assetToDelete.id);
    } catch (err) {
      console.error('Failed to delete asset:', err);
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (assets.length === 0) {
    return (
      <div
        style={{
          textAlign: 'center',
          padding: '40px 20px',
          color: 'var(--text-secondary)',
          fontSize: 'var(--font-body)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>💼</div>
        <p>No assets yet. Add your first investment or valuable!</p>
      </div>
    );
  }

  const totalValue = assets.reduce((sum, asset) => sum + asset.amount, 0);

  return (
    <>
      {assetToDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: '32px', borderRadius: '4px', width: '90%', maxWidth: '400px',
            border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)'
          }}>
            <h2 style={{ marginBottom: '16px', fontSize: 'var(--font-title)', fontFamily: "'DM Serif Display', serif", color: 'var(--text-primary)' }}>
              Delete Asset?
            </h2>
            <p style={{ marginBottom: '24px', fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{assetToDelete.icon} {assetToDelete.name}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setAssetToDelete(null)}
                style={{
                  padding: '10px 20px', background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                  border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow-sm)', borderRadius: '4px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                style={{
                  padding: '10px 20px', background: 'var(--danger)', color: '#fff',
                  border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow-sm)', borderRadius: '4px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontWeight: 600
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingId && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,219,253,0.7)', backdropFilter: 'blur(8px)', gap: '16px', color: 'var(--text-primary)'
        }}>
          <div style={{ position: 'relative', width: '44px', height: '44px' }}>
            <div style={{
              position: 'absolute', inset: 0,
              border: '4px solid var(--border)',
              borderRadius: '50%',
              boxShadow: 'var(--brutal-shadow)',
              background: 'var(--bg-elevated)',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              border: '4px solid transparent',
              borderTopColor: 'var(--danger)',
              borderRadius: '50%',
              animation: 'spin 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
              zIndex: 1,
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: 'var(--font-body)', letterSpacing: '0.05em', background: 'var(--bg-card)', padding: '6px 16px', border: '3px solid var(--border)', borderRadius: '4px', boxShadow: 'var(--brutal-shadow)' }}>
            DELETING ASSET...
          </div>
        </div>
      )}

      <div
        style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--border)',
          boxShadow: 'var(--brutal-shadow)',
          borderRadius: '4px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '3px solid var(--border)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: 'var(--bg-elevated)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontFamily: "'DM Mono', monospace", fontSize: 'var(--font-small)', color: 'var(--text-secondary)' }}>
              Total:
            </span>
            <strong style={{ color: '#3b82f6', fontFamily: "'DM Mono', monospace" }}>
              {showTotal ? formatCurrency(totalValue) : 'Rp ••••••••'}
            </strong>
          </div>
          <button
            onClick={() => setShowTotal(!showTotal)}
            style={{
              background: 'none',
              border: '2px solid var(--border)',
              borderRadius: '4px',
              padding: '4px',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            title={showTotal ? 'Hide values' : 'Show values'}
          >
            {showTotal ? (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                <line x1="1" y1="1" x2="23" y2="23" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        </div>

        {assets.map((asset) => (
          <div
            key={asset.id}
            style={{
              padding: '14px 16px',
              borderBottom: '3px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '12px',
              transition: 'background 0.1s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'var(--bg-elevated)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.background = 'transparent';
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px', fontSize: 'var(--font-body)', minWidth: 0 }}>
                <span style={{ fontSize: 'var(--font-icon-sm)' }}>{asset.icon}</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>
                  {asset.name}
                </span>
              </div>
              <div style={{ fontSize: 'var(--font-xxs)', color: 'var(--text-muted)', fontFamily: "'DM Mono', monospace" }}>
                {formatDate(asset.updatedAt)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: 'var(--font-body)',
                  color: '#3b82f6',
                  fontWeight: 600,
                  letterSpacing: '-0.02em',
                }}
              >
                {showTotal ? formatCurrency(asset.amount) : 'Rp ••••••••'}
              </span>

              <button
                onClick={() => onEdit(asset)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--font-body)',
                  padding: '4px',
                  lineHeight: 1,
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = '#3b82f6')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')
                }
                title="Edit asset"
              >
                ✏️
              </button>

              <button
                onClick={() => handleDeleteClick(asset)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                  fontSize: 'var(--font-body)',
                  padding: '4px',
                  lineHeight: 1,
                  transition: 'color 0.15s ease',
                  flexShrink: 0,
                }}
                onMouseEnter={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = 'var(--danger)')
                }
                onMouseLeave={(e) =>
                  ((e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)')
                }
                title="Delete asset"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
