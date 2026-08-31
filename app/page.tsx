'use client';

import { useState, useEffect, useCallback, useMemo, useTransition } from 'react';
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
  Info,
  ReceiptText,
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
import { initNotifications } from '@/lib/notifications';
import { AddExpenseForm } from '@/components/AddExpenseForm';
import { AddIncomeForm } from '@/components/AddIncomeForm';
import { AddAssetForm } from '@/components/AddAssetForm';
import { AssetList } from '@/components/AssetList';
import { ExpenseList } from '@/components/ExpenseList';
import { IncomeList } from '@/components/IncomeList';
import { SummaryDashboard } from '@/components/SummaryDashboard';
import { SettingsModal } from '@/components/SettingsModal';
import { PinModal } from '@/components/PinModal';
import { SplashScreen } from '@/components/SplashScreen';
import {
  DashboardSkeleton,
  AssetListSkeleton,
  LedgerSkeleton,
  SummarySkeleton,
} from '@/components/Skeleton';
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

function getMonthKeyFromDate(dateStr?: string): string {
  if (!dateStr) return '';
  const str = String(dateStr).trim();
  if (str.length >= 7 && str[4] === '-') {
    return str.substring(0, 7);
  }
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const y = parsed.getFullYear();
    const m = String(parsed.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }
  return '';
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
        getExpenses().catch(() => []),
        getIncomes().catch(() => []),
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
          ...expList.map((e) => getMonthKeyFromDate(e?.date)),
          ...incList.map((i) => getMonthKeyFromDate(i?.date)),
        ])
      ).filter((m) => !!m && m.length === 7).sort().reverse();

      setAvailableMonths(uniqueMonths);
    } catch (err) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, [updatePinState]);

  useEffect(() => {
    initNotifications();
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
    });
  };

  const handleAddIncome = (income: Income) => {
    startTransition(() => {
      setIncomes((prev) => [income, ...prev]);
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

  // Active month label for Master Dashboard
  const activeMonthName = useMemo(() => {
    if (!selectedMonth) return 'All Time';
    const [y, m] = selectedMonth.split('-');
    if (y && m) {
      const d = new Date(parseInt(y, 10), parseInt(m, 10) - 1, 1);
      return new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(d);
    }
    return selectedMonth;
  }, [selectedMonth]);

  // Calculations for Master Dashboard (Current / Selected Month)
  const dashboardExpenses = useMemo(() => {
    return selectedMonth
      ? expenses.filter((e) => getMonthKeyFromDate(e.date) === selectedMonth)
      : expenses;
  }, [expenses, selectedMonth]);

  const dashboardIncomes = useMemo(() => {
    return selectedMonth
      ? incomes.filter((i) => getMonthKeyFromDate(i.date) === selectedMonth)
      : incomes;
  }, [incomes, selectedMonth]);

  const currentMonthExpenses = useMemo(() => {
    return dashboardExpenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  }, [dashboardExpenses]);

  const currentMonthIncomes = useMemo(() => {
    return dashboardIncomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  }, [dashboardIncomes]);

  const currentMonthNetPosition = currentMonthIncomes - currentMonthExpenses;

  // Filtered lists for Ledger and Summary views
  const filteredExpenses = dashboardExpenses;
  const filteredIncomes = dashboardIncomes;

  // Recent transactions merged
  const recentTransactions = [
    ...expenses.map((e) => ({ ...e, type: 'expense' as const })),
    ...incomes.map((i) => ({ ...i, type: 'income' as const })),
  ]
    .filter((tx) => !!tx && typeof tx.date === 'string' && tx.date.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 8);

  return (
    <div className="min-h-screen bg-[#fafaf9] text-zinc-900 flex flex-col font-sans pb-[calc(env(safe-area-inset-bottom,0px)+5.5rem)] md:pb-12">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-zinc-200 px-4 sm:px-8 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] sm:pt-3 flex items-center justify-between transition-all">
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
          loading ? (
            <DashboardSkeleton />
          ) : (
            <div className="flex flex-col gap-6">
              {/* Hero Net Worth Card */}
              <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Net Balance ({activeMonthName})
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

                  <div
                    className={`text-3xl sm:text-5xl font-mono font-bold tracking-tight tabular-nums ${
                      currentMonthNetPosition >= 0 ? 'text-zinc-900' : 'text-rose-600'
                    }`}
                  >
                    {showBalances ? formatAmount(currentMonthNetPosition) : '••••••••••••'}
                  </div>
                  <p className="text-xs text-zinc-500 font-sans mt-0.5">
                    {currentMonthNetPosition >= 0
                      ? `Net surplus cash flow in ${activeMonthName}.`
                      : `Net deficit cash flow in ${activeMonthName}.`}
                  </p>
                </div>

                {/* Inflow & Outflow Summary (This Month) + Month Filter */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
                  <div className="flex items-center gap-3 flex-1 sm:flex-initial">
                    <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex-1 sm:flex-initial min-w-[130px]">
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-emerald-700 mb-0.5">
                        <ArrowDownLeft className="w-3 h-3" />
                        <span>Inflow ({activeMonthName})</span>
                      </div>
                      <span className="font-mono text-sm sm:text-base font-bold text-emerald-700 tabular-nums">
                        {showBalances ? `+ ${formatAmount(currentMonthIncomes)}` : '••••••••'}
                      </span>
                    </div>

                    <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex-1 sm:flex-initial min-w-[130px]">
                      <div className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-rose-700 mb-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        <span>Outflow ({activeMonthName})</span>
                      </div>
                      <span className="font-mono text-sm sm:text-base font-bold text-rose-700 tabular-nums">
                        {showBalances ? `- ${formatAmount(currentMonthExpenses)}` : '••••••••'}
                      </span>
                    </div>
                  </div>

                  {availableMonths.length > 0 && (
                    <select
                      value={selectedMonth}
                      onChange={(e) => setSelectedMonth(e.target.value)}
                      className="bg-white border border-zinc-200 text-xs font-mono rounded-lg px-2.5 py-2 text-zinc-800 focus:outline-none focus:border-zinc-400 self-end sm:self-center"
                      title="Filter Month"
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

              {/* Quick Action Bento Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('add-expense')}
                  className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs hover:border-zinc-300 btn-press transition-all flex flex-col justify-between text-left h-28"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-rose-600 uppercase tracking-wider">
                      Expense
                    </span>
                    <MinusCircle className="w-4 h-4 text-rose-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Record Expense</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Log outgoing spending</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('add-income')}
                  className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs hover:border-zinc-300 btn-press transition-all flex flex-col justify-between text-left h-28"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">
                      Income
                    </span>
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Record Income</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Log revenues and earnings</p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveTab('assets')}
                  className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs hover:border-zinc-300 btn-press transition-all flex flex-col justify-between text-left h-28"
                >
                  <div className="flex items-center justify-between w-full">
                    <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                      Portfolio
                    </span>
                    <Wallet className="w-4 h-4 text-zinc-900" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-900">Asset Holdings</h3>
                    <p className="text-xs text-zinc-500 mt-0.5">Manage bank balances</p>
                  </div>
                </button>
              </div>

              {/* Recent Transactions */}
              <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
                <div className="px-6 py-3.5 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-zinc-600" />
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-800">
                      Recent Activity
                    </h3>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveTab('history')}
                    className="text-xs font-medium text-zinc-600 hover:text-zinc-950 flex items-center gap-1 transition-colors"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>

                {recentTransactions.length === 0 ? (
                  <div className="p-12 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
                    <ReceiptText className="w-8 h-8 text-zinc-300 stroke-1" />
                    <p>No transaction activity logged yet.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-zinc-100">
                    {recentTransactions.map((tx) => {
                      const isExpense = tx.type === 'expense';
                      return (
                        <div
                          key={`${tx.type}-${tx.id}`}
                          className="p-3.5 sm:px-6 flex items-center justify-between gap-4 hover:bg-zinc-50/70 transition-colors"
                        >
                          <div className="flex items-center gap-3.5 min-w-0">
                            <CategoryBadge
                              categoryName={tx.category}
                              categories={isExpense ? categories : incomeCategories}
                              size="sm"
                            />
                            <div className="min-w-0">
                              <div className="text-xs sm:text-sm font-medium text-zinc-900 truncate font-sans">
                                {tx.title || <span className="text-zinc-400 italic">Untitled</span>}
                              </div>
                              <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
                                {tx.date}
                              </div>
                            </div>
                          </div>

                          <div className="font-mono text-xs sm:text-sm font-bold tabular-nums">
                            {isExpense ? (
                              <span className="text-rose-600">- {formatAmount(tx.amount)}</span>
                            ) : (
                              <span className="text-emerald-600">+ {formatAmount(tx.amount)}</span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )
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
          loading ? (
            <AssetListSkeleton />
          ) : (
            <div className="flex flex-col gap-8">
              <AssetList
                assets={assets}
                onEdit={handleEditAsset}
                onDelete={handleDeleteAsset}
                showBalances={showBalances}
              />
              <AddAssetForm
                onAdd={handleAddAsset}
                editingAsset={editingAsset}
                onUpdate={handleAddAsset}
                onCancelEdit={() => setEditingAsset(null)}
              />
            </div>
          )
        )}

        {/* ================= VIEW: LEDGER HISTORY ================= */}
        {activeTab === 'history' && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white border border-zinc-200 p-4 rounded-xl shadow-xs">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-zinc-700" />
                <h2 className="text-sm font-bold text-zinc-900">Ledger History</h2>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <div className="flex bg-zinc-100 p-0.5 rounded-lg border border-zinc-200 text-xs">
                  {(['all', 'expense', 'income'] as const).map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setHistoryType(type)}
                      className={`px-3 py-1 rounded-md capitalize font-medium transition-colors ${
                        historyType === type
                          ? 'bg-white text-zinc-950 shadow-xs'
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
                    className="bg-white border border-zinc-200 text-xs font-mono rounded-lg px-2.5 py-1.5 text-zinc-800 focus:outline-none focus:border-zinc-400"
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

            {loading ? (
              <LedgerSkeleton />
            ) : (
              <>
                {(historyType === 'all' || historyType === 'expense') && (
                  <div className="flex flex-col gap-2.5">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Expenses ({filteredExpenses.length})
                    </h3>
                    <ExpenseList
                      expenses={filteredExpenses}
                      categories={categories}
                      onDelete={handleDeleteExpense}
                    />
                  </div>
                )}

                {(historyType === 'all' || historyType === 'income') && (
                  <div className="flex flex-col gap-2.5 pt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
                      Incomes ({filteredIncomes.length})
                    </h3>
                    <IncomeList
                      incomes={filteredIncomes}
                      categories={incomeCategories}
                      onDelete={handleDeleteIncome}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ================= VIEW: FINANCIAL ANALYTICS ================= */}
        {activeTab === 'summary' && (
          loading ? (
            <SummarySkeleton />
          ) : (
            <SummaryDashboard
              expenses={filteredExpenses}
              incomes={filteredIncomes}
              categories={categories}
              incomeCategories={incomeCategories}
              filterMonth={selectedMonth}
              showBalances={showBalances}
            />
          )
        )}
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-zinc-200 px-2 pt-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] flex items-center justify-around">
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

      {/* Cold-Start Mobile Splash Screen */}
      <SplashScreen isLoading={loading} />
    </div>
  );
}