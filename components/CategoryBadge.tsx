'use client';

import { CategoryData } from '@/lib/types';

interface CategoryBadgeProps {
  categoryName: string;
  categories: CategoryData[];
  size?: 'sm' | 'md';
}

export function CategoryBadge({ categoryName, categories, size = 'md' }: CategoryBadgeProps) {
  // Find dynamic config or fallback to a default
  const match = categories.find(c => c.name === categoryName);
  
  const color = match?.color || '#000000';
  const icon = match?.icon || '📌';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '5px',
        padding: size === 'sm' ? '2px 8px' : '4px 10px',
        borderRadius: '20px',
        fontSize: size === 'sm' ? '11px' : '12px',
        fontFamily: "'DM Mono', monospace",
        fontWeight: 500,
        letterSpacing: '0.02em',
        color,
        background: `${color}18`,
        border: `1px solid ${color}30`,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ fontSize: size === 'sm' ? '11px' : '13px' }}>{icon}</span>
      {categoryName}
    </span>
  );
}
