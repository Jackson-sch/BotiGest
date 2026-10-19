import * as React from 'react';

export default function Loading() {
  return (
    <main className="flex-1 w-full p-4 sm:p-6 space-y-6">
      <div className="space-y-2">
        <div className="h-8 w-64 rounded-xl bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="h-4 w-96 rounded-lg bg-black/5 dark:bg-white/5 animate-pulse" />
      </div>

      {/* Metric Cards Skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-2xl apple-glass border border-black/[0.04] dark:border-white/[0.06] p-4 flex flex-col justify-between"
          >
            <div className="h-3.5 w-24 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
            <div className="h-7 w-32 rounded bg-black/15 dark:bg-white/15 animate-pulse" />
            <div className="h-3 w-20 rounded bg-black/5 dark:bg-white/5 animate-pulse" />
          </div>
        ))}
      </div>

      {/* Table / Content Skeleton */}
      <div className="h-80 rounded-3xl apple-glass border border-black/[0.04] dark:border-white/[0.06] p-6 space-y-4">
        <div className="h-6 w-48 rounded bg-black/10 dark:bg-white/10 animate-pulse" />
        <div className="space-y-3 pt-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-10 w-full rounded-xl bg-black/5 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      </div>
    </main>
  );
}
