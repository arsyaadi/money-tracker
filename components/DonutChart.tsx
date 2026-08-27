'use client';

import { useState, useMemo } from 'react';

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

interface DonutChartProps {
  data: DonutSegment[];
  total: number;
  formatValue: (val: number) => string;
  showBalances?: boolean;
  emptyLabel?: string;
  accentType?: 'expense' | 'income';
}

const EXPENSE_PALETTE = [
  '#e11d48', // rose-600
  '#f43f5e', // rose-500
  '#fb7185', // rose-400
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#8b5cf6', // violet-500
  '#64748b', // slate-500
  '#a1a1aa', // zinc-400
];

const INCOME_PALETTE = [
  '#16a34a', // green-600
  '#22c55e', // green-500
  '#10b981', // emerald-500
  '#14b8a6', // teal-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#64748b', // slate-500
  '#a1a1aa', // zinc-400
];

export function getPaletteColor(index: number, type: 'expense' | 'income' = 'expense'): string {
  const palette = type === 'expense' ? EXPENSE_PALETTE : INCOME_PALETTE;
  return palette[index % palette.length];
}

function computeSlices(validData: DonutSegment[], total: number, circumference: number) {
  let runningPercent = 0;
  return validData.map((slice) => {
    const pct = total > 0 ? slice.value / total : 0;
    const strokeDasharray = `${pct * circumference} ${circumference}`;
    const strokeDashoffset = -runningPercent * circumference;
    runningPercent += pct;
    return {
      ...slice,
      pct,
      strokeDasharray,
      strokeDashoffset,
    };
  });
}

export function DonutChart({
  data,
  total,
  formatValue,
  showBalances = true,
  emptyLabel = 'No data',
  accentType = 'expense',
}: DonutChartProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  const validData = useMemo(() => data.filter((d) => d.value > 0), [data]);

  // SVG Donut geometry
  const size = 180;
  const strokeWidth = 24;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Precompute slices with pure immutable helper
  const slices = useMemo(
    () => computeSlices(validData, total, circumference),
    [validData, total, circumference]
  );

  if (validData.length === 0 || total <= 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-xs text-zinc-400 gap-2">
        <div className="w-24 h-24 rounded-full border-4 border-dashed border-zinc-200 flex items-center justify-center text-[11px] font-medium">
          0%
        </div>
        <p>{emptyLabel}</p>
      </div>
    );
  }

  const activeItem = hoveredIdx !== null ? validData[hoveredIdx] : null;
  const displayLabel = activeItem ? activeItem.name : 'Total';
  const displayValue = activeItem ? activeItem.value : total;
  const displayPercent = activeItem && total > 0 ? (activeItem.value / total) * 100 : 100;

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
      {/* SVG Donut */}
      <div className="relative w-44 h-44 shrink-0 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90 origin-center"
        >
          {/* Background Track Circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#f4f4f5"
            strokeWidth={strokeWidth}
          />

          {/* Slices */}
          {slices.map((slice, idx) => {
            const isHovered = hoveredIdx === idx;

            return (
              <circle
                key={slice.name}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={slice.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={slice.strokeDasharray}
                strokeDashoffset={slice.strokeDashoffset}
                className="transition-all duration-200 cursor-pointer"
                onMouseEnter={() => setHoveredIdx(idx)}
                onMouseLeave={() => setHoveredIdx(null)}
              />
            );
          })}
        </svg>

        {/* Center Donut Hole Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none p-4">
          <span className="text-[10px] uppercase font-semibold tracking-wider text-zinc-500 truncate max-w-[100px]">
            {displayLabel}
          </span>
          <span className="text-sm font-bold font-mono text-zinc-900 tabular-nums truncate max-w-[110px]">
            {showBalances ? formatValue(displayValue) : '••••••'}
          </span>
          <span
            className={`text-[10px] font-mono font-bold mt-0.5 ${
              accentType === 'expense' ? 'text-rose-600' : 'text-emerald-600'
            }`}
          >
            {displayPercent.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Legend & Breakdown list */}
      <div className="flex-1 w-full flex flex-col gap-2 max-h-56 overflow-y-auto pr-1">
        {validData.map((item, idx) => {
          const pct = total > 0 ? (item.value / total) * 100 : 0;
          const isHovered = hoveredIdx === idx;

          return (
            <div
              key={item.name}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className={`p-2 rounded-lg flex items-center justify-between gap-3 text-xs transition-colors cursor-pointer ${
                isHovered ? 'bg-zinc-100/90' : 'hover:bg-zinc-50'
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-2.5 h-2.5 rounded-full shrink-0"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-medium text-zinc-800 truncate font-sans">{item.name}</span>
              </div>

              <div className="flex items-center gap-2 font-mono shrink-0">
                <span className="text-[11px] text-zinc-400">{pct.toFixed(1)}%</span>
                <span className="font-bold text-zinc-900 tabular-nums">
                  {showBalances ? formatValue(item.value) : '••••••'}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
