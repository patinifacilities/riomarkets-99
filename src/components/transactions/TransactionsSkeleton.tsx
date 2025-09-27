import { Skeleton } from '@/components/ui/skeleton';
import { useIsMobile } from '@/hooks/use-mobile';

interface TransactionsSkeletonProps {
  rows?: number;
}

const TransactionsSkeleton = ({ rows = 6 }: TransactionsSkeletonProps) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return (
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 rounded-lg border border-border bg-card animate-pulse">
            {/* Title line */}
            <div className="flex items-start justify-between mb-2">
              <Skeleton className="h-5 flex-1 mr-2" style={{ width: `${60 + Math.random() * 30}%` }} />
              <Skeleton className="h-8 w-8 rounded flex-shrink-0" />
            </div>
            
            {/* Date • Type • Status line */}
            <div className="flex items-center gap-2 mb-3">
              <Skeleton className="h-4 w-24" />
              <div className="w-1 h-1 bg-muted rounded-full opacity-50" />
              <Skeleton className="h-5 w-16" />
              <div className="w-1 h-1 bg-muted rounded-full opacity-50" />
              <Skeleton className="h-5 w-20" />
            </div>
            
            {/* Value line */}
            <div className="flex items-center justify-between">
              <Skeleton className="h-3 w-8" />
              <Skeleton className="h-6 w-32" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Desktop table skeleton
  return (
    <div className="border border-border rounded-lg overflow-hidden bg-card">
      {/* Table header */}
      <div className="border-b border-border p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-8">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-5 w-12" />
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-12" />
          </div>
        </div>
      </div>
      
      {/* Table rows */}
      <div className="divide-y divide-border">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="p-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-8 flex-1">
                <Skeleton className="h-4 w-24" />
                <div className="max-w-[200px] flex-1">
                  <Skeleton className="h-4 w-full mb-1" />
                  <Skeleton className="h-3 w-16" />
                </div>
                <Skeleton className="h-5 w-16" />
                <Skeleton className="h-4 w-20" />
                <Skeleton className="h-5 w-20" />
                <Skeleton className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TransactionsSkeleton;