import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-md bg-black-10", className)} />
  );
}

export function SkeletonCard() {
  return (
    <div className="space-y-2 rounded-lg border border-black-10 p-3">
      <Skeleton className="h-3 w-1/3" />
      <Skeleton className="h-4 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
    </div>
  );
}

export function SkeletonLine() {
  return (
    <div className="flex items-center gap-2">
      <Skeleton className="h-3 w-3 rounded-full" />
      <Skeleton className="h-3 flex-1" />
    </div>
  );
}
