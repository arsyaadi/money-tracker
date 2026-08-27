'use client';

export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={`bg-zinc-200/70 animate-pulse rounded-md ${className}`} />;
}

export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Hero Net Worth Card Skeleton */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-2.5 w-full sm:w-1/2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-10 sm:h-12 w-3/4 max-w-[280px]" />
          <Skeleton className="h-3 w-48 mt-0.5" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex-1 sm:w-36 flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="p-3.5 rounded-lg bg-zinc-50 border border-zinc-200 flex-1 sm:w-36 flex flex-col gap-2">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      </div>

      {/* 3 Action Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="bg-white border border-zinc-200 rounded-xl p-5 shadow-xs flex flex-col justify-between gap-4 h-28"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-4 rounded-full" />
            </div>
            <div className="flex flex-col gap-1.5">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-36" />
            </div>
          </div>
        ))}
      </div>

      {/* Recent Activity Table Skeleton */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-3.5 border-b border-zinc-200 bg-zinc-50/60 flex items-center justify-between">
          <Skeleton className="h-3.5 w-28" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="divide-y divide-zinc-100">
          {[0, 1, 2, 3, 4].map((i) => (
            <div key={i} className="p-3.5 sm:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Skeleton className="w-16 h-6 rounded-md" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-32 sm:w-48" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-4 w-24" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function AssetListSkeleton() {
  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      {/* Portfolio Valuation Skeleton */}
      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
        <div className="flex flex-col gap-2 w-full sm:w-1/2">
          <Skeleton className="h-3.5 w-32" />
          <Skeleton className="h-9 sm:h-11 w-64" />
          <Skeleton className="h-3 w-52 mt-0.5" />
        </div>
        <div className="px-4 py-2.5 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col gap-1 w-32">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-5 w-16" />
        </div>
      </div>

      {/* Holdings Table Skeleton */}
      <div className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
        <div className="px-6 py-3.5 border-b border-zinc-200 bg-zinc-50/70 flex items-center justify-between">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
        <div className="divide-y divide-zinc-100">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="p-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-36" />
                  <Skeleton className="h-2.5 w-20" />
                </div>
              </div>
              <Skeleton className="h-5 w-28" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export function LedgerSkeleton() {
  return (
    <div className="flex flex-col gap-5 w-full animate-in fade-in duration-200">
      {[0, 1].map((group) => (
        <div key={group} className="bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-xs">
          <div className="px-5 py-3 border-b border-zinc-100 bg-zinc-50/60 flex items-center justify-between">
            <Skeleton className="h-3.5 w-36" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-3 w-12" />
              <Skeleton className="h-4 w-24" />
            </div>
          </div>
          <div className="divide-y divide-zinc-100">
            {[0, 1, 2].map((i) => (
              <div key={i} className="p-3.5 sm:px-5 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Skeleton className="w-16 h-6 rounded-md" />
                  <Skeleton className="h-3.5 w-40" />
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function SummarySkeleton() {
  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-6 animate-in fade-in duration-200">
      <div className="flex flex-col gap-1.5">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-3.5 w-72" />
      </div>

      <div className="bg-white border border-zinc-200 rounded-xl p-6 sm:p-8 shadow-xs flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          <div className="flex flex-col gap-2">
            <Skeleton className="h-3 w-28" />
            <Skeleton className="h-10 sm:h-12 w-64" />
            <Skeleton className="h-3 w-44" />
          </div>
          <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 w-44 flex flex-col gap-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-1.5 w-full rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-36" />
          </div>
          <div className="p-4 rounded-lg bg-zinc-50 border border-zinc-200 flex flex-col gap-2">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-36" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[0, 1].map((i) => (
          <div key={i} className="bg-white border border-zinc-200 rounded-xl p-6 shadow-xs flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <Skeleton className="h-3.5 w-32" />
              <Skeleton className="h-4 w-20" />
            </div>
            <div className="flex flex-col sm:flex-row items-center gap-6 py-2">
              <div className="w-44 h-44 rounded-full border-[18px] border-zinc-200/70 animate-pulse flex items-center justify-center shrink-0">
                <Skeleton className="w-16 h-4 rounded-md" />
              </div>
              <div className="flex-1 w-full flex flex-col gap-2.5">
                {[0, 1, 2, 3].map((j) => (
                  <div key={j} className="flex items-center justify-between p-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="w-2.5 h-2.5 rounded-full" />
                      <Skeleton className="h-3.5 w-24" />
                    </div>
                    <Skeleton className="h-3.5 w-16" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
