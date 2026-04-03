'use client';

import { useState } from 'react';
import { Expense, CategoryData } from '@/lib/types';

function getLocalToday() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

interface AddExpenseFormProps {
  categories: CategoryData[];
  onAdd: (expense: Expense) => void;
  onRefreshCategories: () => void;
}

export function AddExpenseForm({ categories, onAdd, onRefreshCategories }: AddExpenseFormProps) {
  const today = getLocalToday();

  const [form, setForm] = useState({
    date: today,
    amount: '',
    category: categories.length > 0 ? categories[0].name : 'Food',
    title: '',
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  // Category creation state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCat, setNewCat] = useState({ name: '', icon: '📌', color: '#ec4899' });
  const [addingCatLoading, setAddingCatLoading] = useState(false);
  const [deletingCatId, setDeletingCatId] = useState<string | null>(null);
  const [categoryToDelete, setCategoryToDelete] = useState<{id: string, name: string} | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess(false);

    try {
      const deploymentId = localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID');
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(deploymentId && { 'x-deployment-id': deploymentId })
        },
        body: JSON.stringify({
          ...form,
          amount: Number(form.amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error ?? 'Failed to add expense');
      }

      onAdd(data.expense);
      setSuccess(true);
      setForm({ date: today, amount: '', category: categories.length > 0 ? categories[0].name : 'Food', title: '' });
      setTimeout(() => setSuccess(false), 2500);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCat.name.trim()) return;
    
    setAddingCatLoading(true);
    setError('');
    
    try {
      const deploymentId = localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID');
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(deploymentId && { 'x-deployment-id': deploymentId })
        },
        body: JSON.stringify(newCat),
      });

      if (!res.ok) throw new Error('Failed to create category');
      
      onRefreshCategories();
      setForm(prev => ({ ...prev, category: newCat.name }));
      setIsAddingCategory(false);
      setNewCat({ name: '', icon: '📌', color: '#ec4899' });
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
      const deploymentId = localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID');
      const res = await fetch(`/api/categories/${id}`, {
        method: 'DELETE',
        headers: deploymentId ? { 'x-deployment-id': deploymentId } : {}
      });

      if (!res.ok) throw new Error('Failed to delete category');
      
      onRefreshCategories();
      if (form.category === name) {
        setForm(prev => ({ 
          ...prev, 
          category: categories.find(c => c.name !== name)?.name || 'Food' 
        }));
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setDeletingCatId(null);
    }
  };

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
        borderRadius: '4px',
        padding: '24px 16px',
        maxWidth: '460px',
        margin: '0 auto',
      }}
    >
      
      {/* Delete Confirmation Dialog */}
      {categoryToDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: '32px', borderRadius: '4px', width: '90%', maxWidth: '400px',
            border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)'
          }}>
            <h2 style={{ marginBottom: '16px', fontSize: 'var(--font-title)', fontFamily: "'DM Serif Display', serif", color: 'var(--text-primary)' }}>
              Delete Category?
            </h2>
            <p style={{ marginBottom: '24px', fontSize: 'var(--font-body)', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete the <strong>{categoryToDelete.name}</strong> category? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                onClick={() => setCategoryToDelete(null)}
                style={{
                  padding: '10px 20px', background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                  border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow-sm)', borderRadius: '4px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmDeleteCategory}
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

      <div style={{ marginBottom: '24px' }}>
        <h2
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: 'var(--font-value-lg)',
            marginBottom: '4px',
            color: 'var(--text-primary)',
          }}
        >
          Add Expense
        </h2>
        <p style={{ fontSize: 'var(--font-small)', color: 'var(--text-secondary)' }}>
          Keep track of your spending
        </p>
      </div>

      
      {/* Local Fullscreen Loading Overlay for Actions */}
      {(loading || addingCatLoading || deletingCatId) && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(255,219,253,0.7)', backdropFilter: 'blur(8px)', gap: '16px', color: 'var(--text-primary)'
        }}>
                    <div
            style={{
              position: 'relative',
              width: '44px',
              height: '44px',
            }}
          >
            {/* Static background circle to hold the shadow cleanly */}
            <div style={{
              position: 'absolute', inset: 0,
              border: '4px solid var(--border)',
              borderRadius: '50%',
              boxShadow: 'var(--brutal-shadow)',
              background: 'var(--bg-elevated)',
            }} />
            {/* Spinning element with no shadow */}
            <div
              style={{
                position: 'absolute', inset: 0,
                border: '4px solid transparent',
                borderTopColor: 'var(--accent)',
                borderRadius: '50%',
                animation: 'spin 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
                zIndex: 1,
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: 'var(--font-body)', letterSpacing: '0.05em', background: 'var(--bg-card)', padding: '6px 16px', border: '3px solid var(--border)', borderRadius: '4px', boxShadow: 'var(--brutal-shadow)' }}>
            {loading ? 'ADDING EXPENSE...' : addingCatLoading ? 'SAVING CATEGORY...' : 'DELETING CATEGORY...'}
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px', marginBottom: '12px' }}>
          <div>
            <label style={labelStyle}>Date</label>
            <input
              type="date"
              required
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              style={inputStyle}
            />
          </div>
          <div>
            <label style={labelStyle}>Amount</label>
            <input
              type="number"
              required
              min="1"
              step="any"
              placeholder="0"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              style={{
                ...inputStyle,
                fontFamily: "'DM Mono', monospace",
                fontSize: 'var(--font-value)',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '20px' }}>
          <label style={labelStyle}>What was this for? (Optional)</label>
          <input
            type="text"
            placeholder="e.g. Coffee at Starbucks"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            style={inputStyle}
          />
        </div>

        <div style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <label style={{...labelStyle, marginBottom: 0}}>Category</label>
            <button 
              type="button" 
              onClick={() => setIsAddingCategory(!isAddingCategory)}
              style={{ background: 'none', border: 'none', color: 'var(--accent)', cursor: 'pointer', fontSize: 'var(--font-xs)', fontWeight: 600, fontFamily: "'DM Mono', monospace" }}
            >
              {isAddingCategory ? 'Cancel' : '+ New Category'}
            </button>
          </div>

          {isAddingCategory ? (
            <div style={{ background: 'var(--bg)', padding: '12px', borderRadius: '4px', border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)', marginBottom: '16px' }}>
              <div style={{ display: 'flex', gap: '8px', marginBottom: '8px' }}>
                <input 
                  type="text" 
                  placeholder="Emoji 📌" 
                  value={newCat.icon} 
                  onChange={e => setNewCat({...newCat, icon: e.target.value})}
                  style={{...inputStyle, width: '60px', textAlign: 'center'}}
                  maxLength={2}
                />
                <input 
                  type="text" 
                  placeholder="Category Name" 
                  value={newCat.name} 
                  onChange={e => setNewCat({...newCat, name: e.target.value})}
                  style={{...inputStyle, flex: 1}}
                />
                <input 
                  type="color" 
                  value={newCat.color} 
                  onChange={e => setNewCat({...newCat, color: e.target.value})}
                  style={{...inputStyle, width: '50px', padding: '2px', cursor: 'pointer'}}
                />
              </div>
              <button 
                type="button"
                onClick={handleAddCategory}
                disabled={addingCatLoading || !newCat.name}
                style={{ width: '100%', padding: '8px', background: 'var(--text-primary)', color: 'var(--bg-card)', border: 'none', borderRadius: '4px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontWeight: 600 }}
              >
                'Save Category'
              </button>
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                gap: '8px',
              }}
            >
              {categories.map((cat) => {
                const isSelected = form.category === cat.name;
                return (
                  <div
                    key={cat.id || cat.name}
                    className="cat-container"
                    onClick={() => setForm({ ...form, category: cat.name })}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '4px',
                      padding: '10px 4px',
                      position: 'relative',
                      borderRadius: '4px',
                      border: `3px solid ${isSelected ? cat.color : 'var(--border)'}`,
                      background: isSelected ? `${cat.color}18` : 'var(--bg-elevated)',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      fontSize: 'var(--font-xxs)',
                      fontFamily: "'DM Mono', monospace",
                      color: isSelected ? cat.color : 'var(--text-secondary)'
                    }}
                  >
                    {cat.id && (
                      <button
                        type="button"
                        onClick={(e) => handleDeleteCategory(e, cat.id, cat.name)}
                        disabled={deletingCatId === cat.id}
                        style={{
                          position: 'absolute',
                          top: '-6px',
                          right: '-6px',
                          background: 'var(--danger)',
                          color: 'white',
                          border: '2px solid var(--border)',
                          borderRadius: '50%',
                          width: '20px',
                          height: '20px',
                          fontSize: 'var(--font-xs)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          opacity: 0,
                          transition: 'opacity 0.2s',
                          boxShadow: '2px 2px 0px 0px #000',
                          zIndex: 2,
                        }}
                        className="cat-delete-btn"
                        title="Delete category"
                      >
                        {deletingCatId === cat.id ? '...' : '×'}
                      </button>
                    )}
                    <span style={{ fontSize: 'var(--font-icon-sm)', lineHeight: 1, flexShrink: 0 }}>{cat.icon}</span>
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%', display: 'block', textAlign: 'center' }}>{cat.name}</span>
                  </div>
                );
              })}
            </div>
          )}
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
            Expense added successfully!
          </div>
        )}

        <button
          type="submit"
          disabled={loading || isAddingCategory}
          style={{
            width: '100%',
            padding: '13px',
            borderRadius: '4px',
            border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
            background: loading ? 'var(--accent-dim)' : 'var(--accent)',
            color: loading ? 'var(--accent)' : '#0d0d0f',
            fontFamily: "'DM Mono', monospace",
            fontWeight: 600,
            fontSize: 'var(--font-body)',
            cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background 0.2s',
          }}
        >
          'Add Expense'
        </button>
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
  border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
  background: 'var(--bg-elevated)',
  color: 'var(--text-primary)',
  outline: 'none',
  fontSize: 'var(--font-body)',
};
