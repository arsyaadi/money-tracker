'use client';

import { useState, useEffect, useCallback } from 'react';
import { Expense, Income, CategoryData, Asset, CATEGORIES as DEFAULT_CATEGORIES, INCOME_CATEGORIES as DEFAULT_INCOME_CATEGORIES } from '@/lib/types';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { AddIncomeForm } from '@/components/AddIncomeForm';
import { ExpenseList } from '@/components/ExpenseList';
import { IncomeList } from '@/components/IncomeList';
import { SummaryDashboard } from '@/components/SummaryDashboard';
import { SettingsModal } from '@/components/SettingsModal';
import { AddAssetForm } from '@/components/AddAssetForm';
import { AssetList } from '@/components/AssetList';
import { initNotifications } from '@/lib/notifications';

type Tab = 'add-expense' | 'add-income' | 'assets' | 'history' | 'summary';
type HistoryFilter = 'all' | 'expense' | 'income';
type SummaryView = 'combined' | 'separate';

export default function Home() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([]);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [tab, setTab] = useState<Tab>('add-expense');
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [filterCategory, setFilterCategory] = useState('');
  const [historyFilter, setHistoryFilter] = useState<HistoryFilter>('all');
  const [summaryView, setSummaryView] = useState<SummaryView>('combined');
  const [currentMonthTotal, setCurrentMonthTotal] = useState(0);
  const [currentMonthIncome, setCurrentMonthIncome] = useState(0);
  
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

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

  const fetchIncomeCategories = useCallback(async () => {
    const deploymentId = getDeploymentId();
    if (!deploymentId) return;
    try {
      const res = await fetch('/api/income-categories', {
        headers: { 'x-deployment-id': deploymentId }
      });
      const data = await res.json();
      if (res.ok && data.categories) {
        setIncomeCategories(data.categories);
      }
    } catch (err) {
      console.error('Failed to fetch income categories:', err);
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

  const fetchMonthlyIncome = useCallback(async () => {
    const deploymentId = getDeploymentId();
    if (!deploymentId) return;
    try {
      const currentMonth = new Date().toISOString().slice(0, 7);
      const res = await fetch(`/api/incomes/monthly-total?month=${currentMonth}`, {
        headers: { 'x-deployment-id': deploymentId }
      });
      const data = await res.json();
      if (res.ok && data.total !== undefined) {
        setCurrentMonthIncome(data.total);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchExpenses = useCallback(async () => {
    const deploymentId = getDeploymentId();
    if (!deploymentId) {
      setShowSettingsModal(true);
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

  const fetchIncomes = useCallback(async () => {
    const deploymentId = getDeploymentId();
    if (!deploymentId) return;
    try {
      const params = new URLSearchParams();
      if (filterMonth) params.set('month', filterMonth);
      
      const url = '/api/incomes' + (params.toString() ? '?' + params.toString() : '');
      const res = await fetch(url, {
        headers: { 'x-deployment-id': deploymentId }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load incomes');
      setIncomes(data.incomes);
    } catch (err) {
      console.error(err);
    }
  }, [filterMonth]);

  const fetchAssets = useCallback(async () => {
    const deploymentId = getDeploymentId();
    if (!deploymentId) return;
    try {
      const res = await fetch('/api/assets', {
        headers: { 'x-deployment-id': deploymentId }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Failed to load assets');
      setAssets(data.assets);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchExpenses();
    fetchIncomes();
    fetchAssets();
    fetchMonthlyTotal();
    fetchMonthlyIncome();
    fetchCategories();
    fetchIncomeCategories();
  }, [fetchExpenses, fetchIncomes, fetchAssets, fetchMonthlyTotal, fetchMonthlyIncome, fetchCategories, fetchIncomeCategories]);

  useEffect(() => {
    initNotifications();
  }, []);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 480);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const handleAddExpense = (expense: Expense) => {
    setExpenses((prev) => [expense, ...prev]);
    fetchMonthlyTotal();
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
    fetchMonthlyTotal();
  };

  const handleAddIncome = (income: Income) => {
    setIncomes((prev) => [income, ...prev]);
    fetchMonthlyIncome();
  };

  const handleDeleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
    fetchMonthlyIncome();
  };

  const handleAddAsset = (asset: Asset) => {
    setAssets((prev) => [asset, ...prev]);
    setEditingAsset(null);
  };

  const handleUpdateAsset = (asset: Asset) => {
    setAssets((prev) => prev.map((a) => (a.id === asset.id ? asset : a)));
    setEditingAsset(null);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
  };

  const handleCancelEditAsset = () => {
    setEditingAsset(null);
  };

  const handleRefreshAll = () => {
    fetchExpenses();
    fetchIncomes();
    fetchAssets();
    fetchMonthlyTotal();
    fetchMonthlyIncome();
    fetchCategories();
    fetchIncomeCategories();
  };

  const netBalance = currentMonthIncome - currentMonthTotal;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'var(--bg)',
        color: 'var(--text-primary)',
      }}
    >
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

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onRefresh={handleRefreshAll}
        onDeploymentIdSave={() => {
          fetchExpenses();
          fetchIncomes();
          fetchCategories();
          fetchIncomeCategories();
          fetchMonthlyTotal();
          fetchMonthlyIncome();
        }}
      />

      <div
        style={{
          position: 'relative',
          zIndex: 1,
          maxWidth: '1100px',
          margin: '0 auto',
          padding: isMobile ? '16px 16px 80px' : '16px 16px 64px',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start', 
            flexWrap: 'wrap', 
            gap: '16px',
            justifyContent: 'space-between',
            marginBottom: '36px',
            paddingBottom: '24px',
            borderBottom: '3px solid var(--border)',
            flexDirection: 'column',
          }}
        >
          <div style={{ width: '100%' }}>
            <div
              style={{
                fontSize: 'var(--font-xxs)',
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
                fontSize: 'var(--font-hero)',
                fontWeight: 400,
                lineHeight: 1.1,
                color: 'var(--text-primary)',
              }}
            >
              Money Tracker
            </h1>
          </div>

          <div style={{ width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <div className="stats-header" style={{ marginBottom: 0 }}>Monthly Summary</div>
              <button
                onClick={() => setShowSummary(!showSummary)}
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
                title={showSummary ? 'Hide values' : 'Show values'}
              >
                {showSummary ? (
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
            <div className="stats-container">
              <div className="stat-item">
                <div className="stat-label">
                  <span className="stat-label-full">This Month&apos;s Income</span>
                  <span className="stat-label-short">Income</span>
                </div>
                <div className="stat-value" style={{ color: '#22c55e' }}>
                  {showSummary
                    ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(currentMonthIncome)
                    : 'Rp ••••••••'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">
                  <span className="stat-label-full">This Month&apos;s Spending</span>
                  <span className="stat-label-short">Spending</span>
                </div>
                <div className="stat-value" style={{ color: currentMonthTotal > 0 ? 'var(--accent)' : 'var(--text-muted)' }}>
                  {showSummary
                    ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(currentMonthTotal)
                    : 'Rp ••••••••'}
                </div>
              </div>
              <div className="stat-item">
                <div className="stat-label">
                  <span className="stat-label-full">Net Balance</span>
                  <span className="stat-label-short">Net</span>
                </div>
                <div className="stat-value" style={{ color: netBalance >= 0 ? '#22c55e' : 'var(--danger)' }}>
                  {showSummary
                    ? new Intl.NumberFormat('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      }).format(netBalance)
                    : 'Rp ••••••••'}
                </div>
              </div>
            </div>
          </div>
        </header>

        {error && (
          <div
            style={{
              padding: '14px 18px',
              borderRadius: '10px',
              background: 'var(--danger-dim)',
              border: '1px solid rgba(224, 85, 85, 0.25)',
              color: 'var(--danger)',
              fontSize: 'var(--font-small)',
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
              onClick={() => { fetchExpenses(); fetchIncomes(); }}
              style={{
                background: 'rgba(224, 85, 85, 0.15)',
                border: '1px solid rgba(224, 85, 85, 0.3)',
                color: 'var(--danger)',
                borderRadius: '6px',
                padding: '4px 10px',
                fontSize: 'var(--font-xs)',
                cursor: 'pointer',
                fontFamily: "'DM Mono', monospace",
                whiteSpace: 'nowrap',
              }}
            >
              Retry
            </button>
          </div>
        )}

        {!isMobile && (
          <div
            className="tabs-container"
            style={{
              marginBottom: '24px',
              width: '90%',
              maxWidth: '400px',
              margin: '0 auto 24px',
            }}
          >
            {(
              [
                { id: 'add-expense', label: 'Add Expense' },
                { id: 'add-income', label: 'Add Income' },
                { id: 'assets', label: 'Assets' },
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
                  background: tab === id ? (id === 'add-income' ? '#22c55e' : id === 'assets' ? '#3b82f6' : 'var(--accent)') : 'transparent',
                  color: tab === id ? (id === 'add-income' || id === 'assets' ? '#fff' : '#0d0d0f') : 'var(--text-secondary)',
                  fontWeight: tab === id ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {(tab === 'history' || tab === 'summary') && (
          <div style={{
            display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap',
            background: 'var(--bg-card)', padding: '16px', borderRadius: '4px',
            border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)'
          }}>
            <div style={{ flex: '1 1 140px' }}>
              <label style={{ display: 'block', fontSize: 'var(--font-xxs)', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}>
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
            {tab === 'history' && (
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-xxs)', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}>
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
                  <optgroup label="Expenses">
                    {categories.length > 0 
                      ? categories.map(cat => (
                          <option key={cat.id || cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                        ))
                      : DEFAULT_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                      ))
                    }
                  </optgroup>
                  <optgroup label="Income">
                    {incomeCategories.length > 0 
                      ? incomeCategories.map(cat => (
                          <option key={cat.id || cat.name} value={cat.name}>{cat.icon} {cat.name}</option>
                        ))
                      : DEFAULT_INCOME_CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                      ))
                    }
                  </optgroup>
                </select>
              </div>
            )}
            {tab === 'history' && (
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-xxs)', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}>
                  Show
                </label>
                <select
                  value={historyFilter}
                  onChange={(e) => setHistoryFilter(e.target.value as HistoryFilter)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '4px',
                    border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
                    background: 'var(--bg)', color: 'var(--text-primary)',
                    fontFamily: "'DM Mono', monospace"
                  }}
                >
                  <option value="all">All</option>
                  <option value="expense">Expenses Only</option>
                  <option value="income">Income Only</option>
                </select>
              </div>
            )}
            {tab === 'summary' && (
              <div style={{ flex: '1 1 140px' }}>
                <label style={{ display: 'block', fontSize: 'var(--font-xxs)', color: 'var(--text-secondary)', marginBottom: '4px', fontFamily: "'DM Mono', monospace" }}>
                  View
                </label>
                <select
                  value={summaryView}
                  onChange={(e) => setSummaryView(e.target.value as SummaryView)}
                  style={{
                    width: '100%', padding: '8px 12px', borderRadius: '4px',
                    border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
                    background: 'var(--bg)', color: 'var(--text-primary)',
                    fontFamily: "'DM Mono', monospace"
                  }}
                >
                  <option value="combined">Combined (Net Balance)</option>
                  <option value="separate">Separate</option>
                </select>
              </div>
            )}
          </div>
        )}

        {tab === 'add-expense' ? (
          <AddExpenseForm categories={categories} onAdd={handleAddExpense} onRefreshCategories={fetchCategories} />
        ) : tab === 'add-income' ? (
          <AddIncomeForm categories={incomeCategories} onAdd={handleAddIncome} onRefreshCategories={fetchIncomeCategories} />
        ) : tab === 'assets' ? (
          <div style={{ maxWidth: '600px', margin: '0 auto' }}>
            <AddAssetForm 
              onAdd={handleAddAsset} 
              editingAsset={editingAsset}
              onUpdate={handleUpdateAsset}
              onCancelEdit={handleCancelEditAsset}
            />
            {assets.length > 0 && (
              <div style={{ marginTop: '24px' }}>
                <h3 style={{ marginBottom: '12px', fontSize: 'var(--font-value)', color: '#3b82f6', fontFamily: "'DM Mono', monospace" }}>
                  Your Assets
                </h3>
                <AssetList 
                  assets={assets} 
                  onDelete={handleDeleteAsset}
                  onEdit={handleEditAsset}
                />
              </div>
            )}
          </div>
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
              <>
                {(historyFilter === 'all' || historyFilter === 'expense') && (
                  <div style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: 'var(--font-value)', color: 'var(--text-secondary)', fontFamily: "'DM Mono', monospace" }}>
                      💸 Expenses
                    </h3>
                    <ExpenseList expenses={expenses} categories={categories} onDelete={handleDeleteExpense} />
                  </div>
                )}
                {(historyFilter === 'all' || historyFilter === 'income') && (
                  <div style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                    <h3 style={{ marginBottom: '12px', fontSize: 'var(--font-value)', color: '#22c55e', fontFamily: "'DM Mono', monospace" }}>
                      💰 Income
                    </h3>
                    <IncomeList incomes={incomes} categories={incomeCategories} onDelete={handleDeleteIncome} />
                  </div>
                )}
              </>
            )}
            {tab === 'summary' && (
               <div style={{ gridColumn: '1 / -1', maxWidth: '600px', margin: '0 auto', width: '100%' }}>
                  <SummaryDashboard 
                    expenses={expenses} 
                    incomes={incomes}
                    categories={categories} 
                    incomeCategories={incomeCategories}
                    filterMonth={filterMonth}
                    view={summaryView}
                  />
               </div>
            )}
          </div>
        )}

        {!isMobile && (
          <footer
            style={{
              marginTop: '48px',
              paddingTop: '24px',
              borderTop: '3px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div style={{ display: 'flex', width: '100%', justifyContent: 'space-between', alignItems: 'center' }}>
              <span
                style={{
                  fontSize: 'var(--font-xxs)',
                  fontFamily: "'DM Mono', monospace",
                  color: 'var(--text-muted)',
                }}
              >
                Built for you 💖
              </span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  onClick={() => setShowSettingsModal(true)}
                  style={{
                    background: 'none',
                    border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--font-xxs)',
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
                  ⚙️ Settings
                </button>
                <button
onClick={() => {
                    fetchExpenses();
                    fetchIncomes();
                    fetchAssets();
                    fetchMonthlyTotal();
                    fetchMonthlyIncome();
                    fetchCategories();
                    fetchIncomeCategories();
                  }}
                  style={{
                    background: 'none',
                    border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
                    borderRadius: '6px',
                    padding: '5px 12px',
                    cursor: 'pointer',
                    color: 'var(--text-muted)',
                    fontSize: 'var(--font-xxs)',
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
            </div>
          </footer>
        )}
      </div>

      {isMobile && (
        <nav className="mobile-bottom-nav">
          {(
            [
              { id: 'add-expense', label: 'Expense', icon: '➖' },
              { id: 'add-income', label: 'Income', icon: '➕' },
              { id: 'assets', label: 'Assets', icon: '💰' },
              { id: 'history', label: 'History', icon: '📋' },
              { id: 'summary', label: 'Summary', icon: '📊' },
            ] as { id: Tab; label: string; icon: string }[]
          ).map(({ id, label, icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`mobile-nav-item ${tab === id ? 'active' : ''}`}
              style={{
                background: 'transparent',
                border: 'none',
                color: tab === id
                  ? (id === 'add-income' ? '#22c55e' : id === 'assets' ? '#3b82f6' : 'var(--accent)')
                  : 'var(--text-muted)',
              }}
            >
              <span className="nav-icon">{icon}</span>
              <span className="nav-label">{label}</span>
            </button>
          ))}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="mobile-nav-item"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-muted)',
            }}
          >
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </button>
        </nav>
      )}
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
            <div style={{
              position: 'absolute', inset: 0,
              border: '4px solid var(--border)',
              borderRadius: '50%',
              boxShadow: 'var(--brutal-shadow)',
              background: 'var(--bg-elevated)',
            }} />
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
        PROCESSING...
      </div>
    </div>
  );
}