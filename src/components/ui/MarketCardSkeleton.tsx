import { Skeleton } from '@/components/ui/skeleton';

const MarketCardSkeleton = () => (
  <div className="bg-bg-card border border-border-soft rounded-xl p-6 animate-pulse">
    {/* Topo: categoria + status */}
    <div className="flex items-center justify-between mb-4">
      <Skeleton className="h-6 w-20 bg-muted/30" />
      <Skeleton className="h-4 w-4 rounded-full bg-muted/30" />
    </div>
    
    {/* Título */}
    <Skeleton className="h-6 w-full mb-2 bg-muted/30" />
    <Skeleton className="h-6 w-3/4 mb-4 bg-muted/30" />
    
    {/* Opções/barras */}
    <div className="space-y-3 mb-6">
      <Skeleton className="h-8 w-full bg-muted/30" />
      <Skeleton className="h-8 w-full bg-muted/30" />
    </div>
    
    {/* Footer */}
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-4 w-12 bg-muted/30" />
        <Skeleton className="h-4 w-16 bg-muted/30" />
        <Skeleton className="h-4 w-14 bg-muted/30" />
      </div>
      <div className="flex gap-2">
        <Skeleton className="h-8 w-8 rounded bg-muted/30" />
        <Skeleton className="h-8 w-8 rounded bg-muted/30" />
      </div>
    </div>
  </div>
);

const MarketGridSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
    {Array.from({ length: 6 }).map((_, i) => (
      <MarketCardSkeleton key={i} />
    ))}
  </div>
);

export { MarketCardSkeleton, MarketGridSkeleton };