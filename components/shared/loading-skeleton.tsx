import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function CardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-5 w-40" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4 mt-2" />
      </CardContent>
    </Card>
  );
}

export function StatCardSkeleton() {
  return (
    <Card>
      <CardContent>
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-14 mt-1.5" />
      </CardContent>
    </Card>
  );
}

function ChartCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-48 w-full rounded" />
      </CardContent>
    </Card>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      <Skeleton className="h-9 w-full" />
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-11 w-full" />
      ))}
    </div>
  );
}

/** Generic fallback — 3 stat cards + 1 content card */
export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <StatCardSkeleton />
        <StatCardSkeleton />
        <StatCardSkeleton />
      </div>
      <CardSkeleton />
    </div>
  );
}

/** Search bar + table rows */
export function ListPageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      <div className="flex gap-3">
        <Skeleton className="h-8 w-[240px]" />
        <Skeleton className="h-8 flex-1" />
      </div>
      <TableSkeleton rows={rows} />
    </div>
  );
}

/** Grid of compact cards (candidates list) */
export function CardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-4 w-28 mb-3" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from({ length: count }).map((_, i) => (
            <Card key={i}>
              <CardContent className="px-3 py-2 flex items-center gap-2.5">
                <Skeleton className="w-7 h-7 rounded-sm shrink-0" />
                <div className="flex-1 space-y-1">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 5 stat cards + bar + search + table (candidate detail) */
export function DetailWithStatsSkeleton() {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-3 w-full rounded-full" />
      <div className="flex gap-3">
        <Skeleton className="h-8 w-[180px]" />
        <Skeleton className="h-8 flex-1" />
      </div>
      <TableSkeleton rows={6} />
    </div>
  );
}

/** N stat cards + content card (campaign, transport, registrations) */
export function StatsPageSkeleton({ statCount = 4 }: { statCount?: number }) {
  return (
    <div className="space-y-6">
      <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(statCount, 4)} gap-3`}>
        {Array.from({ length: statCount }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>
      <Skeleton className="h-8 w-full" />
      <CardSkeleton />
    </div>
  );
}

/** Stat cards + chart cards (dashboard pages) */
export function DashboardSkeleton({ statCount = 4 }: { statCount?: number }) {
  return (
    <div className="space-y-6">
      {statCount > 0 && (
        <div className={`grid grid-cols-2 sm:grid-cols-${Math.min(statCount, 4)} gap-3`}>
          {Array.from({ length: statCount }).map((_, i) => (
            <StatCardSkeleton key={i} />
          ))}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCardSkeleton />
        <ChartCardSkeleton />
      </div>
    </div>
  );
}

/** Select + card grid (voting ballot box list) */
export function VotingPageSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-full sm:w-[280px]" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
