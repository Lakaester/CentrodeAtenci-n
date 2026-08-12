import { cn } from "@/lib/utils";

interface SkeletonCardProps {
  className?: string;
  lines?: number;
}

export function SkeletonCard({ className, lines = 3 }: SkeletonCardProps) {
  return (
    <div
      className={cn(
        "animate-pulse rounded-lg border border-black-10 bg-white p-4 ",
        className,
      )}
      aria-hidden="true"
    >
      <div className="mb-3 h-4 w-2/3 rounded bg-black-10" />
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "mb-2 h-3 rounded bg-black-10",
            i === lines - 1 ? "w-1/2" : "w-full",
          )}
        />
      ))}
    </div>
  );
}

interface SkeletonGridProps {
  count?: number;
  cols?: 2 | 3 | 4;
}

export function SkeletonGrid({ count = 6, cols = 3 }: SkeletonGridProps) {
  const colClass: Record<2 | 3 | 4, string> = {
    2: "grid-cols-1 sm:grid-cols-2",
    3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
    4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
  };
  return (
    <div className={cn("grid gap-4", colClass[cols])} role="status" aria-label="Cargando dashboard">
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
      <span className="sr-only">Cargando...</span>
    </div>
  );
}
