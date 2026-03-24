'use client';

import { useState, useEffect } from 'react';
import { Asset } from '@/lib/types';
import { EmojiPicker } from './EmojiPicker';

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
    icon: '💰',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const isEditing = !!editingAsset;

  useEffect(() => {
    if (editingAsset) {
      setForm({
        name: editingAsset.name,
        amount: editingAsset.amount.toString(),
        icon: editingAsset.icon,
      });
    } else {
      setForm({ name: '', amount: '', icon: '💰' });
    }
  }, [editingAsset]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const deploymentId = localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID');

      if (isEditing && editingAsset && onUpdate) {
        const res = await fetch('/api/assets', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...(deploymentId && { 'x-deployment-id': deploymentId })
          },
          body: JSON.stringify({
            id: editingAsset.id,
            name: form.name,
            amount: Number(form.amount),
            icon: form.icon,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to update asset');
        }

        onUpdate(data.asset);
      } else {
        const res = await fetch('/api/assets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(deploymentId && { 'x-deployment-id': deploymentId })
          },
          body: JSON.stringify({
            name: form.name,
            amount: Number(form.amount),
            icon: form.icon,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          throw new Error(data.error ?? 'Failed to add asset');
        }

        onAdd(data.asset);
        setForm({ name: '', amount: '', icon: '💰' });
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: '', amount: '', icon: '💰' });
    if (onCancelEdit) onCancelEdit();
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '3px solid var(--border)',
        boxShadow: 'var(--brutal-shadow)',
        borderRadius: '4px',
        padding: '24px 16px',
        maxWidth: '460px',
        margin: '0 auto',
      }}
    >
      {loading && (
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
              borderTopColor: '#3b82f6',
              borderRadius: '50%',
              animation: 'spin 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
              zIndex: 1,
            }} />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: 'var(--font-body)', letterSpacing: '0.05em', background: 'var(--bg-card)', padding: '6px 16px', border: '3px solid var(--border)', borderRadius: '4px', boxShadow: 'var(--brutal-shadow)' }}>
            {isEditing ? 'UPDATING ASSET...' : 'ADDING ASSET...'}
          </div>
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'var(--font-value-lg)',
            marginBottom: '4px',
            color: 'var(--text-primary)',
          }}
        >
          {isEditing ? 'Edit Asset' : 'Add Asset'}
        </h2>
        <p style={{ fontSize: 'var(--font-small)', color: 'var(--text-secondary)' }}>
          Track your investments and valuables
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Name</label>
          <input
            type="text"
            required
            placeholder="e.g. Gold Ring, Apple Stock, SBI Mutual Fund"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Amount (IDR)</label>
          <input
            type="number"
            required
            step="any"
            placeholder="Current value"
            value={form.amount}
            onChange={(e) => setForm({ ...form, amount: e.target.value })}
            style={{
              ...inputStyle,
              fontFamily: "'DM Mono', monospace",
              fontSize: 'var(--font-value)',
            }}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <label style={labelStyle}>Icon</label>
          <EmojiPicker
            value={form.icon}
            onChange={(emoji) => setForm({ ...form, icon: emoji })}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '6px',
              background: 'var(--danger-dim)',
              border: '1px solid rgba(224, 85, 85, 0.2)',
              color: 'var(--danger)',
              fontSize: 'var(--font-small)',
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              padding: '12px',
              marginBottom: '16px',
              borderRadius: '6px',
              background: 'var(--success-dim)',
              border: '1px solid rgba(92, 184, 122, 0.2)',
              color: 'var(--success)',
              fontSize: 'var(--font-small)',
            }}
          >
            Asset {isEditing ? 'updated' : 'added'} successfully!
          </div>
        )}

        <div style={{ display: 'flex', gap: '12px' }}>
          {isEditing && (
            <button
              type="button"
              onClick={handleCancel}
              style={{
                flex: 1,
                padding: '13px',
                borderRadius: '4px',
                border: '3px solid var(--border)',
                boxShadow: 'var(--brutal-shadow)',
                background: 'var(--bg-elevated)',
                color: 'var(--text-primary)',
                fontFamily: "'DM Mono', monospace",
                fontWeight: 600,
                fontSize: 'var(--font-body)',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              flex: 1,
              padding: '13px',
              borderRadius: '4px',
              border: '3px solid var(--border)',
              boxShadow: 'var(--brutal-shadow)',
              background: loading ? '#3b82f644' : '#3b82f6',
              color: '#fff',
              fontFamily: "'DM Mono', monospace",
              fontWeight: 600,
              fontSize: 'var(--font-body)',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {isEditing ? 'Update Asset' : 'Add Asset'}
          </button>
        </div>
      </form>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: 'var(--font-xxs)',
  fontFamily: "'DM Mono', monospace",
  color: 'var(--text-secondary)',
  marginBottom: '6px',
  textTransform: 'uppercase',
  letterSpacing: '0.04em',
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '4px',
  border: '3px solid var(--border)',
  boxShadow: 'var(--brutal-shadow)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: 'var(--font-body)',
};