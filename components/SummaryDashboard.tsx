'use client';

import { ArrowDownLeft, ArrowUpRight, PieChart, TrendingUp } from 'lucide-react';
import { Expense, Income, CategoryData } from '@/lib/types';
import { DonutChart, getPaletteColor, DonutSegment } from './DonutChart';

interface SummaryDashboardProps {
  expenses: Expense[];
  incomes: Income[];
  categories: CategoryData[];
  incomeCategories: CategoryData[];
  filterMonth?: string;
  view?: 'combined' | 'separate';
  showBalances?: boolean;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function SummaryDashboard({
  expenses,
  incomes,
  categories,
  incomeCategories,
  filterMonth,
  showBalances = true,
}: SummaryDashboardProps) {
  const totalExpenses = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0);
  const totalIncome = incomes.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const netBalance = totalIncome - totalExpenses;
  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  const periodLabel = filterMonth || 'All Time';

  const expenseByCategory = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.name] = expenses
      .filter((e) => e.category === cat.name)
      .reduce((s, e) => s + (Number(e.amount) || 0), 0);
    return acc;
  }, {});

  const incomeByCategory = incomeCategories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.name] = incomes
      .filter((i) => i.category === cat.name)
      .reduce((s, i) => s + (Number(i.amount) || 0), 0);
    return acc;
  }, {});

  const sortedExpenseCategories = [...categories]
    .filter((c) => (expenseByCategory[c.name] ?? 0) > 0)
    .sort((a, b) => (expenseByCategory[b.name] ?? 0) - (expenseByCategory[a.name] ?? 0));

  const sortedIncomeCategories = [...incomeCategories]
    .filter((c) => (incomeByCategory[c.name] ?? 0) > 0)
    .sort((a, b) => (incomeByCategory[b.name] ?? 0) - (incomeByCategory[a.name] ?? 0));

  // Prepare donut segments
  const expenseSegments: DonutSegment[] = sortedExpenseCategories.map((cat, idx) => ({
    name: cat.name,
    value: expenseByCategory[cat.name] ?? 0,
    color: getPaletteColor(idx, 'expense'),
  }));

  const incomeSegments: DonutSegment[] = sortedIncomeCategories.map((cat, idx) => ({
    name: cat.name,
    value: incomeByCategory[cat.name] ?? 0,
    color: getPaletteColor(idx, 'income'),
  }));

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6">
      {/* Header */}
      <header className="flex flex-col gap-1">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-zinc-900">
          Financial Summary
        </h1>
        <p className="text-xs sm:text-sm text-zinc-500 font-sans">
          Cash flow overview, savings rate metrics, and category distributions for {periodLabel}.
        </p>
      </header>

      {/* Hero Net Balance Card */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
              Net Cash Flow
            </span>
            <div
              className={`text-3xl sm:text-5xl font-mono font-bold tracking-tight tabular-nums ${
                netBalance >= 0 ? 'text-zinc-900' : 'text-rose-600'
              }`}
            >
              {showBalances ? formatAmount(netBalance) : '••••••••••••'}
            </div>
            <p className="text-xs text-zinc-500 mt-1 font-sans">
              {netBalance >= 0 ? 'Surplus cash flow this period' : 'Deficit cash flow this period'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 min-w-[180px]">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 block mb-1">
              Savings Rate
            </span>
            <div
              className={`text-2xl font-mono font-bold tabular-nums ${
                savingsRate >= 0 ? 'text-emerald-600' : 'text-rose-600'
              }`}
            >
              {savingsRate.toFixed(1)}%
            </div>
            <div className="w-full bg-zinc-200 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  savingsRate >= 0 ? 'bg-emerald-600' : 'bg-rose-600'
                }`}
                style={{ width: `${Math.min(Math.max(savingsRate, 0), 100)}%` }}
              />
            </div>
          </div>
        </div>

        {/* 2-Column Inflow & Outflow Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold uppercase tracking-wider mb-1">
              <ArrowDownLeft className="w-4 h-4" />
              <span>Total Inflow ({incomes.length})</span>
            </div>
            <div className="font-mono text-xl font-bold text-emerald-700 tabular-nums">
              {showBalances ? `+ ${formatAmount(totalIncome)}` : '••••••••'}
            </div>
          </div>

          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200">
            <div className="flex items-center gap-1.5 text-rose-700 text-xs font-semibold uppercase tracking-wider mb-1">
              <ArrowUpRight className="w-4 h-4" />
              <span>Total Outflow ({expenses.length})</span>
            </div>
            <div className="font-mono text-xl font-bold text-rose-700 tabular-nums">
              {showBalances ? `- ${formatAmount(totalExpenses)}` : '••••••••'}
            </div>
          </div>
        </div>
      </div>

      {/* 2-Column Donut Charts Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Expense Donut Chart Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <PieChart className="w-4 h-4 text-rose-600" />
              <span>Expense Categories</span>
            </h3>
            <span className="font-mono text-xs font-bold text-rose-600 tabular-nums">
              {showBalances ? formatAmount(totalExpenses) : '••••••'}
            </span>
          </div>

          <DonutChart
            data={expenseSegments}
            total={totalExpenses}
            formatValue={formatAmount}
            showBalances={showBalances}
            emptyLabel="No expense records for this period."
            accentType="expense"
          />
        </div>

        {/* Income Donut Chart Card */}
        <div className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col gap-4">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-600" />
              <span>Income Sources</span>
            </h3>
            <span className="font-mono text-xs font-bold text-emerald-600 tabular-nums">
              {showBalances ? formatAmount(totalIncome) : '••••••'}
            </span>
          </div>

          <DonutChart
            data={incomeSegments}
            total={totalIncome}
            formatValue={formatAmount}
            showBalances={showBalances}
            emptyLabel="No income records for this period."
            accentType="income"
          />
        </div>
      </div>
    </div>
  );
}