'use client';

import { useState } from 'react';
import { Income, CategoryData } from '@/lib/types';
import { CategoryBadge } from './CategoryBadge';

interface IncomeListProps {
  incomes: Income[];
  categories: CategoryData[];
  onDelete: (id: string) => void;
}

function formatAmount(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export function IncomeList({ incomes, categories, onDelete }: IncomeListProps) {
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [incomeToDelete, setIncomeToDelete] = useState<{id: string, title: string} | null>(null);

  const triggerDelete = (id: string, title: string) => {
    setIncomeToDelete({ id, title: title || 'this income' });
  };

  const confirmDelete = async () => {
    if (!incomeToDelete) return;
    const { id } = incomeToDelete;
    
    setIncomeToDelete(null);
    setDeletingId(id);
    try {
      const deploymentId = localStorage.getItem('APPS_SCRIPT_DEPLOYMENT_ID');
      const res = await fetch(`/api/incomes/${id}`, {
        method: 'DELETE',
        headers: deploymentId ? { 'x-deployment-id': deploymentId } : {},
      });
      if (!res.ok) throw new Error('Failed to delete');
      onDelete(id);
    } catch (err) {
      console.error(err);
      alert('Failed to delete income');
    } finally {
      setDeletingId(null);
    }
  };

  const grouped = incomes.reduce((acc, income) => {
    if (!acc[income.date]) {
      acc[income.date] = [];
    }
    acc[income.date].push(income);
    return acc;
  }, {} as Record<string, Income[]>);

  const sortedDates = Object.keys(grouped).sort(
    (a, b) => new Date(b).getTime() - new Date(a).getTime()
  );

  if (incomes.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '40px 16px',
          background: 'var(--bg-card)',
          border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
          borderRadius: '4px',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '48px', marginBottom: '16px', opacity: 0.4 }}>💵</div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
          No income yet. Add your first one!
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '24px',
      }}
    >
      
      {incomeToDelete && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            background: 'var(--bg-card)', padding: '32px', borderRadius: '4px', width: '90%', maxWidth: '400px',
            border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)', textAlign: 'left'
          }}>
            <h2 style={{ marginBottom: '16px', fontSize: '20px', fontFamily: "'DM Serif Display', serif", color: 'var(--text-primary)' }}>
              Delete Income?
            </h2>
            <p style={{ marginBottom: '24px', fontSize: '14px', color: 'var(--text-secondary)' }}>
              Are you sure you want to delete <strong>{incomeToDelete.title}</strong>? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                onClick={() => setIncomeToDelete(null)}
                style={{
                  padding: '10px 20px', background: 'var(--bg-elevated)', color: 'var(--text-primary)',
                  border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow-sm)', borderRadius: '4px', cursor: 'pointer', fontFamily: "'DM Mono', monospace", fontWeight: 600
                }}
              >
                Cancel
              </button>
              <button
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
          background: 'rgba(200,255,200,0.7)', backdropFilter: 'blur(8px)', gap: '16px', color: 'var(--text-primary)'
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
                borderTopColor: '#22c55e',
                borderRadius: '50%',
                animation: 'spin 0.8s cubic-bezier(0.68, -0.55, 0.265, 1.55) infinite',
                zIndex: 1,
              }}
            />
            <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
          <div style={{ fontFamily: "'DM Mono', monospace", fontWeight: 600, fontSize: '14px', letterSpacing: '0.05em', background: 'var(--bg-card)', padding: '6px 16px', border: '3px solid var(--border)', borderRadius: '4px', boxShadow: 'var(--brutal-shadow)' }}>
            DELETING INCOME...
          </div>
        </div>
      )}

      {sortedDates.map((date) => {
        const dayIncomes = grouped[date];
        const dayTotal = dayIncomes.reduce((s, i) => s + i.amount, 0);

        const d = new Date(date + 'T00:00:00');
        const formattedDate = new Intl.DateTimeFormat('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }).format(d);

        return (
          <div
            key={date}
            style={{
              background: 'var(--bg-card)',
              border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
              borderRadius: '4px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '16px 16px 12px',
                borderBottom: '3px solid var(--border)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 600,
                  color: 'var(--text-secondary)',
                  letterSpacing: '0.02em',
                }}
              >
                {formattedDate}
              </div>
              <div
                style={{
                  fontSize: '12px',
                  background: 'var(--bg-elevated)',
                  border: '3px solid var(--border)', boxShadow: 'var(--brutal-shadow)',
                  padding: '3px 10px',
                  borderRadius: '20px',
                }}
              >
                {dayIncomes.length} items
              </div>
            </div>

            <div
              style={{
                padding: '10px 16px',
                background: 'var(--bg-elevated)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                borderBottom: '3px solid var(--border)',
              }}
            >
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                Daily Total
              </span>
              <span
                style={{
                  fontSize: '14px',
                  fontFamily: "'DM Mono', monospace",
                  color: '#22c55e',
                }}
              >
                {formatAmount(dayTotal)}
              </span>
            </div>

            {dayIncomes.map((income, i) => (
              <div
                key={income.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '14px 16px', flexWrap: 'wrap', columnGap: '12px', rowGap: '8px',
                  borderBottom:
                    i < dayIncomes.length - 1
                      ? '3px solid var(--border)'
                      : 'none',
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
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginBottom: '4px',
                    }}
                  >
                    <CategoryBadge categoryName={income.category} categories={categories} size="sm" />
                    <span
                      style={{
                        fontSize: '13px',
                        color: income.title ? 'var(--text-primary)' : 'var(--text-muted)',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                        fontStyle: income.title ? 'normal' : 'italic',
                      }}
                    >
                      {income.title || 'Untitled'}
                    </span>
                  </div>
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <span
                    style={{
                      fontSize: '14px',
                      fontFamily: "'DM Mono', monospace",
                      color: '#22c55e',
                      letterSpacing: '-0.02em',
                    }}
                  >
                    {formatAmount(income.amount)}
                  </span>

                  <button
                    onClick={() => triggerDelete(income.id, income.title)}
                    disabled={deletingId === income.id}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: deletingId === income.id ? 'default' : 'pointer',
                      color: 'var(--text-muted)',
                      fontSize: '14px',
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
                    aria-label="Delete income"
                  >
                    {deletingId === income.id ? '...' : '×'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}