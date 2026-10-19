import * as React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { Card } from '@/components/ui/card';

export function MetricCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-4 flex items-center justify-between apple-glass">
          <div className="space-y-2 flex-1">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-2.5 w-20" />
          </div>
          <Skeleton className="h-10 w-10 rounded-xl" />
        </Card>
      ))}
    </div>
  );
}

export function TableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <Card className="p-0 overflow-hidden apple-glass">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <Skeleton className="h-8 w-64 rounded-xl" />
        <Skeleton className="h-8 w-32 rounded-xl" />
      </div>
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 flex items-center justify-between gap-4">
            <div className="space-y-1.5 flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-5 w-16" />
          </div>
        ))}
      </div>
    </Card>
  );
}

export function InventarioSkeleton() {
  return (
    <div className="space-y-6">
      <MetricCardsSkeleton count={4} />
      <TableSkeleton rows={6} />
    </div>
  );
}

export function VentasSkeleton() {
  return (
    <div className="space-y-6">
      <MetricCardsSkeleton count={4} />
      <TableSkeleton rows={7} />
    </div>
  );
}

export function ComprasSkeleton() {
  return (
    <div className="space-y-6">
      <MetricCardsSkeleton count={4} />
      <TableSkeleton rows={5} />
    </div>
  );
}

export function CajaSkeleton() {
  return (
    <div className="space-y-6">
      <MetricCardsSkeleton count={4} />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="p-6 lg:col-span-1 space-y-4 apple-glass">
          <Skeleton className="h-5 w-36" />
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
        </Card>
        <Card className="p-6 lg:col-span-2 space-y-4 apple-glass">
          <Skeleton className="h-5 w-48" />
          <TableSkeleton rows={4} />
        </Card>
      </div>
    </div>
  );
}

export function ControladosSkeleton() {
  return (
    <div className="space-y-6">
      <MetricCardsSkeleton count={3} />
      <TableSkeleton rows={6} />
    </div>
  );
}

export function PosSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-5rem)]">
      <div className="lg:col-span-8 flex flex-col gap-4">
        <Skeleton className="h-12 w-full rounded-2xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 flex-1">
          {Array.from({ length: 8 }).map((_, i) => (
            <Card key={i} className="p-4 apple-glass space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-2/3" />
              <Skeleton className="h-6 w-1/2 mt-4" />
            </Card>
          ))}
        </div>
      </div>
      <div className="lg:col-span-4">
        <Card className="h-full p-6 apple-glass space-y-4">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-10 w-full" />
          <div className="space-y-3 flex-1 pt-4">
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
          </div>
          <Skeleton className="h-14 w-full rounded-2xl" />
        </Card>
      </div>
    </div>
  );
}
