'use client';

import { useState, useEffect, useCallback, useTransition } from 'react';
import Image from 'next/image';
import {
  LayoutDashboard,
  MinusCircle,
  PlusCircle,
  Wallet,
  History,
  BarChart3,
  RefreshCw,
  Sliders,
  Eye,
  EyeOff,
  Lock,
  ArrowRight,
  ArrowDownLeft,
  ArrowUpRight,
  ChevronRight,
  Info,
} from 'lucide-react';
import { Expense, Income, Asset, CategoryData } from '@/lib/types';
import {
  getExpenses,
  getIncomes,
  getAssets,
  getCategories,
  getIncomeCategories,
} from '@/lib/apiClient';
import { isPinEnabled } from '@/lib/security';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { AddIncomeForm } from '@/components/AddIncomeForm';
import { AddAssetForm } from '@/components/AddAssetForm';
import { AssetList } from '@/components/AssetList';
import { ExpenseList } from '@/components/ExpenseList';
import { IncomeList } from '@/components/IncomeList';
import { SummaryDashboard } from '@/components/SummaryDashboard';
import { SettingsModal } from '@/components/SettingsModal';
import { PinModal } from '@/components/PinModal';
import { CategoryBadge } from '@/components/CategoryBadge';

type TabType = 'dashboard' | 'add-expense' | 'add-income' | 'assets' | 'history' | 'summary';

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

function getLocalMonthKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('dashboard');
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [incomes, setIncomes] = useState<Income[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [incomeCategories, setIncomeCategories] = useState<CategoryData[]>([]);
  const [selectedMonth, setSelectedMonth] = useState<string>(() => getLocalMonthKey());
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [historyType, setHistoryType] = useState<'all' | 'expense' | 'income'>('all');
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [showBalances, setShowBalances] = useState<boolean>(true);
  const [pinProtected, setPinProtected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [, startTransition] = useTransition();

  const checkConfigured = () => {
    if (typeof window === 'undefined') return true;
    return !!localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID');
  };

  const updatePinState = useCallback(() => {
    const enabled = isPinEnabled();
    setPinProtected(enabled);
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setIsConfigured(checkConfigured());
    updatePinState();

    try {
      const [cats, incCats, expList, incList, assetList] = await Promise.all([
        getCategories().catch(() => []),
        getIncomeCategories().catch(() => []),
        getExpenses(selectedMonth || undefined).catch(() => []),
        getIncomes(selectedMonth || undefined).catch(() => []),
        getAssets().catch(() => []),
      ]);

      setCategories(cats);
      setIncomeCategories(incCats);
      setExpenses(expList);
      setIncomes(incList);
      setAssets(assetList);

      const currentMonth = getLocalMonthKey();
      const uniqueMonths = Array.from(
        new Set([
          currentMonth,
          ...expList.map((e) => (typeof e?.date === 'string' ? e.date.substring(0, 7) : '')),
          ...incList.map((i) => (typeof i?.date === 'string' ? i.date.substring(0, 7) : '')),
        ])
      ).filter((m) => !!m && m.length === 7).sort().reverse();

      setAvailableMonths(uniqueMonths);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [selectedMonth, updatePinState]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleToggleVisibility = () => {
    if (showBalances) {
      // Hide immediately
      setShowBalances(false);
    } else {
      // If PIN is configured & enabled, prompt PIN modal
      if (pinProtected) {
        setIsPinModalOpen(true);
      } else {
        setShowBalances(true);
      }
    }
  };

  const handlePinSuccess = () => {
    setShowBalances(true);
  };

  const handleAddExpense = (expense: Expense) => {
    startTransition(() => {
      setExpenses((prev) => [expense, ...prev]);
      setActiveTab('dashboard');
    });
  };

  const handleAddIncome = (income: Income) => {
    startTransition(() => {
      setIncomes((prev) => [income, ...prev]);
      setActiveTab('dashboard');
    });
  };

  const handleDeleteExpense = (id: string) => {
    setExpenses((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDeleteIncome = (id: string) => {
    setIncomes((prev) => prev.filter((i) => i.id !== id));
  };

  const handleAddAsset = (asset: Asset) => {
    setAssets((prev) => {
      const exists = prev.some((a) => a.id === asset.id);
      if (exists) {
        return prev.map((a) => (a.id === asset.id ? asset : a));
      }
      return [asset, ...prev];
    });
    setEditingAsset(null);
  };

  const handleDeleteAsset = (id: string) => {
    setAssets((prev) => prev.filter((a) => a.id !== id));
    if (editingAsset?.id === id) {
      setEditingAsset(null);
    }
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
    setActiveTab('assets');
  };

  // Calculations for Master Dashboard
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncomes = incomes.reduce((s, i) => s + i.amount, 0);
  const netCashFlow = totalIncomes - totalExpenses;
  const totalAssetNetWorth = assets.reduce((s, a) => s + a.amount, 0);
  const totalNetPosition = totalAssetNetWorth + netCashFlow;

  // Recent transactions merged
  const recentTransactions = [
    ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
    ...incomes.map((i) => ({ ...i, type: 'income' as const })),
  ]
    .filter((tx) => !!tx && typeof tx.date === 'string' && tx.date.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 flex flex-col font-sans pb-24 md:pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Logo Brand */}
          <div
            onClick={() => setActiveTab('dashboard')}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
          >
            <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center shadow-xs">
              <Image src="/logo.png" alt="Logo" width={28} height={28} className="object-contain" />
            </div>
            <span className="font-bold text-sm tracking-tight text-zinc-900">
              Money Tracker
            </span>
          </div>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
              { id: 'add-expense', label: 'Expense', icon: MinusCircle },
              { id: 'add-income', label: 'Income', icon: PlusCircle },
              { id: 'assets', label: 'Assets', icon: Wallet },
              { id: 'history', label: 'Ledger', icon: History },
              { id: 'summary', label: 'Summary', icon: BarChart3 },
            ].map((tab) => {
              const isActive = activeTab === tab.id;
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as TabType)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors ${
                    isActive
                      ? 'bg-zinc-100 text-zinc-900 font-semibold'
                      : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2">
          {/* Stealth Balance Toggle */}
          <button
            type="button"
            onClick={handleToggleVisibility}
            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 btn-press transition-colors"
            title={showBalances ? 'Hide balance figures' : pinProtected ? 'Unlock with PIN' : 'Show balances'}
          >
            {showBalances ? (
              <Eye className="w-4 h-4" />
            ) : pinProtected ? (
              <Lock className="w-4 h-4 text-zinc-900" />
            ) : (
              <EyeOff className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
            className="px-3 py-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-xs font-medium text-zinc-700 flex items-center gap-1.5 btn-press transition-colors"
            title="Sync Database"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-zinc-900' : ''}`} />
            <span className="hidden sm:inline">Sync</span>
          </button>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            className="p-1.5 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 btn-press transition-colors"
            title="Settings"
          >
            <Sliders className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Cloud DB Notice */}
      {!isConfigured && (
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 text-xs text-amber-800 flex items-center justify-between">
          <div className="flex items-center gap-2 max-w-[1100px] mx-auto w-full">
            <Info className="w-4 h-4 text-amber-700 shrink-0" />
            <span>Configure Google Apps Script Deployment ID for remote cloud storage sync.</span>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="font-semibold underline ml-auto text-amber-900"
            >
              Configure
            </button>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-[1100px] mx-auto p-4 sm:p-6 lg:p-8 flex flex-col gap-6">
        {/* ================= VIEW: DASHBOARD ================= */}
        {activeTab === 'dashboard' && (
          <div className="flex flex-col gap-6">
            {/* Hero Net Worth Card */}
            <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
              <div className="flex flex-col gap-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                    Total Financial Position
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleVisibility}
                    className="text-zinc-400 hover:text-zinc-700 transition-colors"
                    title={showBalances ? 'Hide' : 'Reveal'}
                  >
                    {showBalances ? (
                      <Eye className="w-3.5 h-3.5" />
                    ) : pinProtected ? (
                      <Lock className="w-3.5 h-3.5 text-zinc-800" />
                    ) : (
                      <EyeOff className="w-3.5 h-3.5" />
                    )}
                  </button>
                </div>

                <div className="text-3xl sm:text-5xl font-mono font-bold tracking-tight text-zinc-900 tabular-nums">
                  {showBalances ? formatAmount(totalNetPosition) : '••••••••••••'}
                </div>
                <p className="text-xs text-zinc-500 font-sans mt-0.5">
                  Liquid asset holdings plus current period net cash flow.
                </p>
              </div>

              {/* Inflow & Outflow Summary */}
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex-1 sm:flex-initial">
                  <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-0.5">
                    <ArrowDownLeft className="w-3 h-3" />
                    <span>Inflow</span>
                  </div>
                  <span className="font-mono text-sm sm:text-base font-bold text-emerald-700 tabular-nums">
                    {showBalances ? `+ ${formatAmount(totalIncomes)}` : '••••••••'}
                  </span>
                </div>

                <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex-1 sm:flex-initial">
                  <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-rose-700 mb-0.5">
                    <ArrowUpRight className="w-3 h-3" />
                    <span>Outflow</span>
                  </div>
                  <span className="font-mono text-sm sm:text-base font-bold text-rose-700 tabular-nums">
                    {showBalances ? `- ${formatAmount(totalExpenses)}` : '••••••••'}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Action Bento Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div
                onClick={() => setActiveTab('add-expense')}
                className="group cursor-pointer bg-white border border-zinc-200 rounded-xl p-5 shadow-xs hover:border-zinc-300 hover:shadow-sm btn-press transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                    Expense
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Record Expense</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Log outgoing spending.</p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('add-income')}
                className="group cursor-pointer bg-white border border-zinc-200 rounded-xl p-5 shadow-xs hover:border-zinc-300 hover:shadow-sm btn-press transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                    Income
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Record Income</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Log revenues and earnings.</p>
                </div>
              </div>

              <div
                onClick={() => setActiveTab('assets')}
                className="group cursor-pointer bg-white border border-zinc-200 rounded-xl p-5 shadow-xs hover:border-zinc-300 hover:shadow-sm btn-press transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    Portfolio
                  </span>
                  <ArrowRight className="w-4 h-4 text-zinc-400 group-hover:text-zinc-900 group-hover:translate-x-0.5 transition-all" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-zinc-900">Asset Holdings</h3>
                  <p className="text-xs text-zinc-500 mt-0.5">Manage bank balances.</p>
                </div>
              </div>
            </div>

            {/* Recent Transactions */}
            <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
              <div className="px-6 py-3.5 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-800">
                  Recent Activity
                </h3>
                <button
                  onClick={() => setActiveTab('history')}
                  className="text-xs text-zinc-500 hover:text-zinc-900 font-medium flex items-center gap-1 transition-colors"
                >
                  <span>Full Ledger</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {recentTransactions.length === 0 ? (
                <div className="p-12 text-center text-xs text-zinc-400">
                  No transactions recorded yet.
                </div>
              ) : (
                <div className="divide-y divide-zinc-100">
                  {recentTransactions.map((tx) => {
                    const isExpense = tx.type === 'expense';
                    const activeCats = isExpense ? categories : incomeCategories;

                    return (
                      <div
                        key={tx.id}
                        className="p-3.5 sm:px-6 flex items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <CategoryBadge categoryName={tx.category} categories={activeCats} size="sm" />
                          <div className="min-w-0">
                            <div className="text-xs sm:text-sm font-medium text-zinc-800 truncate">
                              {tx.title || <span className="text-zinc-400 italic">Untitled</span>}
                            </div>
                            <div className="font-mono text-[10px] text-zinc-400 mt-0.5">
                              {tx.date}
                            </div>
                          </div>
                        </div>

                        <div className="font-mono text-xs sm:text-sm font-bold tabular-nums">
                          {showBalances ? (
                            isExpense ? (
                              <span className="text-rose-600">- {formatAmount(tx.amount)}</span>
                            ) : (
                              <span className="text-emerald-600">+ {formatAmount(tx.amount)}</span>
                            )
                          ) : (
                            <span className="text-zinc-400">••••••</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= VIEW: RECORD EXPENSE ================= */}
        {activeTab === 'add-expense' && (
          <div className="flex flex-col gap-6">
            <AddExpenseForm
              categories={categories}
              onAdd={handleAddExpense}
              onRefreshCategories={loadData}
            />
          </div>
        )}

        {/* ================= VIEW: RECORD INCOME ================= */}
        {activeTab === 'add-income' && (
          <div className="flex flex-col gap-6">
            <AddIncomeForm
              categories={incomeCategories}
              onAdd={handleAddIncome}
              onRefreshCategories={loadData}
            />
          </div>
        )}

        {/* ================= VIEW: ASSETS & PORTFOLIO ================= */}
        {activeTab === 'assets' && (
          <div className="flex flex-col gap-8">
            <AssetList
              assets={assets}
              onDelete={handleDeleteAsset}
              onEdit={handleEditAsset}
              showBalances={showBalances}
              onToggleVisibility={handleToggleVisibility}
              isPinLocked={pinProtected && !showBalances}
            />

            <AddAssetForm
              onAdd={handleAddAsset}
              editingAsset={editingAsset}
              onUpdate={handleAddAsset}
              onCancelEdit={() => setEditingAsset(null)}
            />
          </div>
        )}

        {/* ================= VIEW: LEDGER HISTORY ================= */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-6">
            {/* Header & Filter Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
                  Transaction Records
                </h1>
                <p className="text-xs text-zinc-500 mt-0.5">Historical ledger logs and archives.</p>
              </div>

              {/* Filter Controls */}
              <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
                <div className="flex p-0.5 rounded-lg bg-zinc-100 border border-zinc-200">
                  {(['all', 'expense', 'income'] as const).map((type) => (
                    <button
                      key={type}
                      onClick={() => setHistoryType(type)}
                      className={`px-3 py-1 rounded-md text-xs uppercase tracking-wider font-semibold transition-all ${
                        historyType === type
                          ? 'bg-white text-zinc-900 shadow-xs'
                          : 'text-zinc-500 hover:text-zinc-900'
                      }`}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {availableMonths.length > 0 && (
                  <select
                    value={selectedMonth}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                    className="bg-white border border-zinc-200 text-xs font-mono px-3 py-1.5 rounded-lg text-zinc-700 focus:outline-none focus:border-zinc-400"
                  >
                    <option value="">All Months</option>
                    {availableMonths.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Filtered Lists */}
            {(historyType === 'all' || historyType === 'expense') && (
              <div className="flex flex-col gap-2.5">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Expenses ({expenses.length})
                </h3>
                <ExpenseList
                  expenses={expenses}
                  categories={categories}
                  onDelete={handleDeleteExpense}
                />
              </div>
            )}

            {(historyType === 'all' || historyType === 'income') && (
              <div className="flex flex-col gap-2.5 pt-4">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                  Incomes ({incomes.length})
                </h3>
                <IncomeList
                  incomes={incomes}
                  categories={incomeCategories}
                  onDelete={handleDeleteIncome}
                />
              </div>
            )}
          </div>
        )}

        {/* ================= VIEW: FINANCIAL ANALYTICS ================= */}
        {activeTab === 'summary' && (
          <SummaryDashboard
            expenses={expenses}
            incomes={incomes}
            categories={categories}
            incomeCategories={incomeCategories}
            filterMonth={selectedMonth}
            view="combined"
            showBalances={showBalances}
          />
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 py-1 flex items-center justify-around">
        {[
          { id: 'dashboard', label: 'Dash', icon: LayoutDashboard },
          { id: 'add-expense', label: 'Expense', icon: MinusCircle },
          { id: 'add-income', label: 'Income', icon: PlusCircle },
          { id: 'assets', label: 'Assets', icon: Wallet },
          { id: 'history', label: 'Ledger', icon: History },
          { id: 'summary', label: 'Stats', icon: BarChart3 },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as TabType)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg transition-colors ${
                isActive
                  ? 'text-zinc-900 font-bold'
                  : 'text-zinc-400 hover:text-zinc-700'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-label uppercase mt-0.5">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onDeploymentIdSave={loadData}
        onRefresh={loadData}
        onPinConfigChange={updatePinState}
      />

      {/* PIN Verification Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        onClose={() => setIsPinModalOpen(false)}
        onSuccess={handlePinSuccess}
      />
    </div>
  );
}