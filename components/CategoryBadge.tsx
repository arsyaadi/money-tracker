'use client';

import { Tag } from 'lucide-react';
import { CategoryData } from '@/lib/types';

interface CategoryBadgeProps {
  categoryName: string;
  categories: CategoryData[];
  size?: 'sm' | 'md';
}

export function CategoryBadge({ categoryName, size = 'md' }: CategoryBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-label font-medium tracking-tight rounded-md border border-zinc-200 bg-zinc-50 text-zinc-700 select-none ${
        size === 'sm' ? 'px-2 py-0.5 text-[11px]' : 'px-2.5 py-1 text-xs'
      }`}
    >
      <Tag className={size === 'sm' ? 'w-3 h-3 text-zinc-500' : 'w-3.5 h-3.5 text-zinc-500'} />
      <span className="truncate">{categoryName}</span>
    </span>
  );
}
