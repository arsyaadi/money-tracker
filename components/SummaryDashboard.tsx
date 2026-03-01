'use client';

import { Expense, CategoryData } from '@/lib/types';
import { CategoryBadge } from './CategoryBadge';

interface SummaryDashboardProps {
  expenses: Expense[];
  categories: CategoryData[];
  filterMonth?: string;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function SummaryDashboard({ expenses, categories, filterMonth }: SummaryDashboardProps) {
  const total = expenses.reduce((s, e) => s + e.amount, 0);

  // Use dynamic categories for the reduce key
  const catNames = categories.map(c => c.name);

  const byCategory = catNames.reduce<Record<string, number>>((acc, catName) => {
    acc[catName] = expenses
      .filter((e) => e.category === catName)
      .reduce((s, e) => s + e.amount, 0);
    return acc;
  }, {});

  const maxVal = Math.max(...Object.values(byCategory), 1);

  // Month filter display logic
  const periodLabel = filterMonth ? `Total in ${filterMonth}` : 'All Time Total';

  let topCategoryName = catNames[0] || 'Unknown';
  if (catNames.length > 0) {
    topCategoryName = catNames.reduce((top, catName) =>
      byCategory[catName] > byCategory[top] ? catName : top
    , catNames[0]);
  }
  
  const topCategoryData = categories.find(c => c.name === topCategoryName);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Stats cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        <StatCard
          label={periodLabel}
          value={formatAmount(total)}
          sub={`${expenses.length} transactions`}
          accent="var(--accent)"
        />
        <StatCard
          label="Top Category"
          value={topCategoryName}
          sub={formatAmount(byCategory[topCategoryName] || 0)}
          accent={topCategoryData?.color || '#000'}
        />
      </div>

      {/* Category breakdown */}
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
          By Category
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {categories.map((cat) => {
            const val = byCategory[cat.name] ?? 0;
            const pct = total > 0 ? (val / total) * 100 : 0;
            const barPct = maxVal > 0 ? (val / maxVal) * 100 : 0;

            return (
              <div key={cat.name}>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: '6px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '14px' }}>{cat.icon}</span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {cat.name}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      style={{
                        fontSize: '11px',
                        fontFamily: "'DM Mono', monospace",
                        color: 'var(--text-muted)',
                      }}
                    >
                      {pct.toFixed(1)}%
                    </span>
                    <span
                      style={{
                        fontSize: '13px',
                        fontFamily: "'DM Mono', monospace",
                        color: val > 0 ? cat.color : 'var(--text-muted)',
                        fontWeight: 500,
                      }}
                    >
                      {formatAmount(val)}
                    </span>
                  </div>
                </div>
                <div
                  style={{
                    height: '4px',
                    background: 'var(--bg-elevated)',
                    borderRadius: '2px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${barPct}%`,
                      borderRadius: '2px',
                      background: val > 0 ? cat.color : 'var(--text-muted)',
                      transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
                      opacity: val > 0 ? 1 : 0.2,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {expenses.length > 0 && topCategoryData && (
          <div
            style={{
              marginTop: '20px',
              paddingTop: '16px',
              borderTop: '3px solid var(--border)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Top category
            </span>
            <span
              style={{
                fontSize: '12px',
                fontFamily: "'DM Mono', monospace",
                color: topCategoryData.color,
              }}
            >
              {topCategoryData.icon} {topCategoryData.name}
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
          color: 'var(--text-primary)',
          marginBottom: '4px',
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{sub}</div>
    </div>
  );
}
