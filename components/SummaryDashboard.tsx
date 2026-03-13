'use client';

import { Expense, Income, CategoryData } from '@/lib/types';

interface SummaryDashboardProps {
  expenses: Expense[];
  incomes: Income[];
  categories: CategoryData[];
  incomeCategories: CategoryData[];
  filterMonth?: string;
  view: 'combined' | 'separate';
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
  view 
}: SummaryDashboardProps) {
  const totalExpenses = expenses.reduce((s, e) => s + e.amount, 0);
  const totalIncome = incomes.reduce((s, i) => s + i.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  const periodLabel = filterMonth ? filterMonth : 'All Time';

  if (view === 'combined') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
          <StatCard
            label="Net Balance"
            value={formatAmount(netBalance)}
            sub={`${expenses.length + incomes.length} transactions`}
            accent={netBalance >= 0 ? '#22c55e' : 'var(--danger)'}
          />
          <StatCard
            label="Total Income"
            value={formatAmount(totalIncome)}
            sub={`${incomes.length} income entries`}
            accent="#22c55e"
          />
          <StatCard
            label="Total Expenses"
            value={formatAmount(totalExpenses)}
            sub={`${expenses.length} expenses`}
            accent="var(--accent)"
          />
        </div>

        <div
          style={{
            background: 'var(--bg-card)',
            border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
            borderRadius: '4px',
            padding: '16px 16px',
          }}
        >
          <h3
            style={{
              fontFamily: "'DM Serif Display', serif",
              fontSize: '18px',
              marginBottom: '16px',
              color: 'var(--text-primary)',
            }}
          >
            {periodLabel} Summary
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px',
              background: 'rgba(34, 197, 94, 0.1)',
              borderRadius: '4px',
              border: '2px solid rgba(34, 197, 94, 0.3)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#22c55e', fontWeight: 500 }}>
                💰 Income
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", color: '#22c55e', fontSize: '16px' }}>
                {formatAmount(totalIncome)}
              </span>
            </div>
            
            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px',
              background: 'rgba(249, 115, 22, 0.1)',
              borderRadius: '4px',
              border: '2px solid rgba(249, 115, 22, 0.3)'
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--accent)', fontWeight: 500 }}>
                💸 Expenses
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", color: 'var(--accent)', fontSize: '16px' }}>
                - {formatAmount(totalExpenses)}
              </span>
            </div>

            <div style={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center',
              padding: '12px',
              background: netBalance >= 0 ? 'rgba(34, 197, 94, 0.15)' : 'rgba(224, 85, 85, 0.15)',
              borderRadius: '4px',
              border: `2px solid ${netBalance >= 0 ? 'rgba(34, 197, 94, 0.4)' : 'rgba(224, 85, 85, 0.4)'}`
            }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '8px', color: netBalance >= 0 ? '#22c55e' : 'var(--danger)', fontWeight: 600, fontSize: '16px' }}>
                {netBalance >= 0 ? '📈' : '📉'} Net Balance
              </span>
              <span style={{ fontFamily: "'DM Mono', monospace", color: netBalance >= 0 ? '#22c55e' : 'var(--danger)', fontSize: '18px', fontWeight: 600 }}>
                {formatAmount(netBalance)}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const expenseByCategory = categories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.name] = expenses
      .filter((e) => e.category === cat.name)
      .reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {});

  const incomeByCategory = incomeCategories.reduce<Record<string, number>>((acc, cat) => {
    acc[cat.name] = incomes
      .filter((i) => i.category === cat.name)
      .reduce((s, i) => s + i.amount, 0);
    return acc;
  }, {});

  const maxExpense = Math.max(...Object.values(expenseByCategory), 1);
  const maxIncome = Math.max(...Object.values(incomeByCategory), 1);

  const topExpenseCategory = categories.reduce((top, cat) =>
    expenseByCategory[cat.name] > expenseByCategory[top.name] ? cat : top
  , categories[0]);

  const topIncomeCategory = incomeCategories.reduce((top, cat) =>
    incomeByCategory[cat.name] > incomeByCategory[top.name] ? cat : top
  , incomeCategories[0]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div
        style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
          borderRadius: '4px',
          padding: '16px 16px',
        }}
      >
        <h3
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '18px',
            marginBottom: '8px',
            color: '#22c55e',
          }}
        >
          💰 Income
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {periodLabel} • {formatAmount(totalIncome)} total • {incomes.length} entries
        </p>

        {incomeCategories.length === 0 || totalIncome === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            No income recorded
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incomeCategories.map((cat) => {
              const val = incomeByCategory[cat.name] ?? 0;
              if (val === 0) return null;
              const pct = totalIncome > 0 ? (val / totalIncome) * 100 : 0;
              const barPct = maxIncome > 0 ? (val / maxIncome) * 100 : 0;

              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)' }}>
                        {pct.toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '13px', fontFamily: "'DM Mono', monospace", color: '#22c55e', fontWeight: 500 }}>
                        {formatAmount(val)}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barPct}%`, borderRadius: '2px', background: '#22c55e', transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {incomes.length > 0 && topIncomeCategory && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top source</span>
            <span style={{ fontSize: '12px', fontFamily: "'DM Mono', monospace", color: '#22c55e' }}>
              {topIncomeCategory.icon} {topIncomeCategory.name}
            </span>
          </div>
        )}
      </div>

      <div
        style={{
          background: 'var(--bg-card)',
          border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
          borderRadius: '4px',
          padding: '16px 16px',
        }}
      >
        <h3
          style={{
            fontFamily: "'DM Serif Display', serif",
            fontSize: '18px',
            marginBottom: '8px',
            color: 'var(--accent)',
          }}
        >
          💸 Expenses
        </h3>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '16px' }}>
          {periodLabel} • {formatAmount(totalExpenses)} total • {expenses.length} entries
        </p>

        {categories.length === 0 || totalExpenses === 0 ? (
          <p style={{ color: 'var(--text-muted)', fontSize: '14px', textAlign: 'center', padding: '20px' }}>
            No expenses recorded
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {categories.map((cat) => {
              const val = expenseByCategory[cat.name] ?? 0;
              if (val === 0) return null;
              const pct = totalExpenses > 0 ? (val / totalExpenses) * 100 : 0;
              const barPct = maxExpense > 0 ? (val / maxExpense) * 100 : 0;

              return (
                <div key={cat.name}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                      <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{cat.name}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '11px', fontFamily: "'DM Mono', monospace", color: 'var(--text-muted)' }}>
                        {pct.toFixed(1)}%
                      </span>
                      <span style={{ fontSize: '13px', fontFamily: "'DM Mono', monospace", color: cat.color, fontWeight: 500 }}>
                        {formatAmount(val)}
                      </span>
                    </div>
                  </div>
                  <div style={{ height: '4px', background: 'var(--bg-elevated)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${barPct}%`, borderRadius: '2px', background: cat.color, transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {expenses.length > 0 && topExpenseCategory && (
          <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '3px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Top category</span>
            <span style={{ fontSize: '12px', fontFamily: "'DM Mono', monospace", color: topExpenseCategory.color }}>
              {topExpenseCategory.icon} {topExpenseCategory.name}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: string;
  sub: string;
  accent: string;
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
        borderRadius: '4px',
        padding: '16px 16px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div
        style={{
          fontSize: '11px',
          color: 'var(--text-secondary)',
          fontFamily: "'DM Mono', monospace",
          letterSpacing: '0.05em',
          textTransform: 'uppercase',
          marginBottom: '8px',
        }}
      >
        {label}
      </div>
      <div
        style={{
          fontFamily: "'DM Serif Display', serif",
          fontSize: '24px',
          color: accent,
          marginBottom: '4px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}