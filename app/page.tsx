'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense, CategoryData, CATEGORIES as DEFAULT_CATEGORIES } from '@/lib/types';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { ExpenseList } from '@/components/ExpenseList';
import { SummaryDashboard } from '@/components/SummaryDashboard';

type Tab = 'add' | 'history' | 'summary';

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [tab, setTab] = useState<Tab>('add');
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [filterCategory, setFilterCategory] = useState('');
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  
  const [showDeploymentDialog, setShowDeploymentDialog] = useState(false);
  const [deploymentIdInput, setDeploymentIdInput] = useState('');

  const getDeploymentId = () => {
    return localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID') || '';
  };

  const fetchCategories = useCallback(async () => {
    const deploymentId = getDeploymentId();
    if (!deploymentId) return;
    try {
      const res = await fetch('/api/categories', {
        headers: { 'x-deployment-id': deploymentId }
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
    }
  }, []);

  const fetchMonthlyTotal = useCallback(async () => {
    const deploymentId = getDeploymentId();
    if (!deploymentId) return;
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const res = await fetch(`/api/expenses/monthly-total?month=${currentMonth}`, {
        headers: { 'x-deployment-id': deploymentId }
      });
      const data = await res.json();
      if (res.ok && data.total !== undefined) {
        setCurrentMonthTotal(data.total);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    const deploymentId = getDeploymentId();
    if (!deploymentId) {
      setShowDeploymentDialog(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.set('month', filterMonth);
      if (filterCategory) params.set('category', filterCategory);
      
      const url = '/api/expenses' + (params.toString() ? '?' + params.toString() : '');
      const res = await fetch(url, {
        headers: { 'x-deployment-id': deploymentId }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load expenses');
      setExpenses(data.expenses);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, [filterMonth, filterCategory]);

  useEffect(() => {
    fetchExpenses();
    fetchMonthlyTotal();
    fetchCategories();
  }, [fetchExpenses, fetchMonthlyTotal, fetchCategories]);

  const handleAdd = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
    fetchMonthlyTotal();
  };

  const handleDelete = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    fetchMonthlyTotal();
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Background blobs */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-200px',
            right: '-200px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(200,169,110,0.04) 0%, transparent 70%)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-300px',
            left: '-200px',
            width: '700px',
            height: '700px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(107,157,232,0.04) 0%, transparent 70%)',
          }}
        />
      </div>

      {loading && <GlobalLoadingOverlay />}

      {showDeploymentDialog && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: '32px', borderRadius: '4px', width: '90%', maxWidth: '400px',
            border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)'
          }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px' }}>Setup Deployment ID</h2>
            <p style={{ marginBottom: '20px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Please enter your Apps Script Deployment ID to connect to your Google Sheet.
            </p>
            <input
              type="text"
              value={deploymentIdInput}
              onChange={(e) => setDeploymentIdInput(e.target.value)}
              placeholder="AKfycbx..."
              style={{
                width: '100%', padding: '12px', marginBottom: '20px', borderRadius: '4px',
                border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)', background: 'var(--bg)', color: 'var(--text-primary)'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => {
                  if (!deploymentIdInput.trim()) return;
                  localStorage.setItem('APPS_SCRIPT_DEPLOYMENT_ID', deploymentIdInput.trim());
                  setShowDeploymentDialog(false);
                  fetchExpenses();
                  fetchCategories();
                  fetchMonthlyTotal();
                }}
                style={{
                  padding: '10px 20px', background: 'var(--accent)', color: '#000',
                  border: 'none', borderRadius: '4px', cursor: 'pointer', fontWeight: 500
                }}
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1100px',
          margin: '0 auto',
          padding: '16px 16px 64px',
        }}
      >
        {/* Header */}
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-end', flexWrap: 'wrap', gap: '16px',
            justifyContent: 'space-between',
            marginBottom: '36px',
            paddingBottom: '24px',
            borderBottom: '3px solid var(--border)',
          }}
        >
          <div>
            <div
              style={{
                fontSize: '11px',
                fontFamily: "'DM Mono', monospace",
                color: 'var(--accent)',
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                marginBottom: '6px',
              }}
            >
              Personal Finance
            </div>
            <h1
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '36px',
                fontWeight: 400,
                lineHeight: 1.1,
                color: 'var(--text-primary)',
              }}
            >
              Money Tracker
            </h1>
          </div>

          <div style={{ textAlign: 'right' }}>
            <div
              style={{
                fontSize: '11px',
                fontFamily: "'DM Mono', monospace",
                color: 'var(--text-muted)',
                marginBottom: '4px',
                letterSpacing: '0.06em',
              }}
            >
              This Month's Spending
            </div>
            <div
              style={{
                fontFamily: "'DM Serif Display', serif",
                fontSize: '24px',
                color: currentMonthTotal > 0 ? 'var(--accent)' : 'var(--text-muted)',
              }}
            >
              {new Intl.NumberFormat('id-ID', {
                style: 'currency',
                currency: 'IDR',
                minimumFractionDigits: 0,
              }).format(currentMonthTotal)}
            </div>
          </div>
        </header>

        {/* Error banner */}
        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'var(--danger-dim)',
              border: '1px solid rgba(224, 85, 85, 0.25)',
              color: 'var(--danger)',
              fontSize: '13px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
justifyContent: 'space-between',
gap: '12px',
flexWrap: 'wrap',
            }}
          >
            <span>{error}</span>
            <button
              onClick={fetchExpenses}
              style={{
                background: 'rgba(224, 85, 85, 0.15)',
                border: '1px solid rgba(224, 85, 85, 0.3)',
                color: 'var(--danger)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: '12px',
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                whiteSpace: 'nowrap',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '4px',
            marginBottom: '24px',
            background: 'var(--bg-card)',
            border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
            borderRadius: '4px',
            padding: '4px',
            width: '100%', maxWidth: 'fit-content', flexWrap: 'wrap', justifyContent: 'center', margin: '0 auto 24px',
          }}
        >
          {(
            [
              { id: 'add', label: 'Add Expense' },
              { id: 'history', label: 'History' },
              { id: 'summary', label: 'Summary' },
            ] as { id: Tab; label: string }[]
          ).map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              style={{
                padding: '8px 12px', flex: '1 1 auto',
                borderRadius: '4px',
                border: 'none',
                background: tab === id ? 'var(--accent)' : 'transparent',
                color: tab === id ? '#0d0d0f' : 'var(--text-secondary)',
                fontSize: '13px',
                fontWeight: tab === id ? 600 : 500,
                cursor: 'pointer',
                transition: 'all 0.2s',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Filters */}
        {(tab === 'history' || tab === 'summary') && (
          <div style={{
            display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
            background: 'var(--bg-card)', padding: '16px', borderRadius: '4px',
            border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)'
          }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}>
                Filter Month
              </label>
              <input
                type="month"
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
                  background: 'var(--bg)', color: 'var(--text-primary)',
                  fontFamily: "'DM Mono', monospace"
                }}
              />
            </div>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}>
                Filter Category
              </label>
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: '4px',
                  border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
                  background: 'var(--bg)', color: 'var(--text-primary)',
                  fontFamily: "'DM Mono', monospace"
                }}
              >
                <option value="">All Categories</option>
                {categories.length > 0 
                  ? categories.map(cat => (
                      <option key={cat.id || cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                    ))
                  : DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                  ))
                }
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        {tab === 'add' ? (
          <AddExpenseForm categories={categories} onAdd={handleAdd} onRefreshCategories={fetchCategories} />
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 350px), 1fr))',
              gap: '20px',
              alignItems: 'start',
            }}
          >
            {tab === 'history' && (
              <div style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                <ExpenseList expenses={expenses} categories={categories} onDelete={handleDelete} />
              </div>
            )}
            {tab === 'summary' && (
               <div style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                  <SummaryDashboard expenses={expenses} categories={categories} filterMonth={filterMonth} />
               </div>
            )}
          </div>
        )}

        <footer
          style={{
            marginTop: '48px',
            paddingTop: '24px',
            borderTop: '3px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span
            style={{
              fontSize: '11px',
              fontFamily: "'DM Mono', monospace",
              color: 'var(--text-muted)',
            }}
          >
            Built for you 💖
          </span>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => {
                setDeploymentIdInput(getDeploymentId());
                setShowDeploymentDialog(true);
              }}
              style={{
                background: 'none',
                border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
                borderRadius: '6px',
                padding: '5px 12px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontFamily: "'DM Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              }}
            >
              ⚙️ Setup
            </button>
            <button
              onClick={() => {
                fetchExpenses();
                fetchMonthlyTotal();
                fetchCategories();
              }}
              style={{
                background: 'none',
                border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
                borderRadius: '6px',
                padding: '5px 12px',
                cursor: 'pointer',
                color: 'var(--text-muted)',
                fontSize: '11px',
                fontFamily: "'DM Mono', monospace",
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-hover)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-secondary)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border)';
                (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}

function LoadingSpinner() {
  return (
    <div
      style={{
        width: '14px',
        height: '14px',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--accent)',
        borderRadius: '50%',
        animation: 'spin 0.8s linear infinite',
      }}
    >
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}


function GlobalLoadingOverlay() {
  return (
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
      <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: '14px', letterSpacing: '0.05em', background: 'var(--bg-card)', padding: '6px 16px', border: '3px solid var(--border)', borderRadius: '4px', boxShadow: 'var(--brutal-shadow)' }}>
        PROCESSING...
      </div>
    </div>
  );
}
