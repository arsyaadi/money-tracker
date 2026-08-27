'use client';

import { CategoryData } from '@/lib/types';

interface CategoryBadgeProps {
  categoryName: string;
  categories: CategoryData[];
  size?: 'sm' | 'md';
}

export function CategoryBadge({ categoryName, categories, size = 'md' }: CategoryBadgeProps) {
  const match = categories.find((c) => c.name.toLowerCase() === categoryName.toLowerCase());

  const icon = match?.icon || '📌';

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-label font-medium tracking-tight rounded-md border border-zinc-200/80 bg-zinc-50 text-zinc-700 select-none ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <span className={size === 'sm' ? 'text-xs' : 'text-sm'}>{icon}</span>
      <span className="truncate">{categoryName}</span>
    </span>
  );
}
