import { cn } from "@/lib/utils";

interface Props {
  children: React.ReactNode;
  className?: string;
  cols?: 2 | 3 | 4;
}

const COLS: Record<2 | 3 | 4, string> = {
  2: "grid-cols-1 sm:grid-cols-2",
  3: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4",
};

export function DashboardGrid({ children, className, cols = 3 }: Props) {
  return (
    <div className={cn("grid gap-4", COLS[cols], className)}>
      {children}
    </div>
  );
}
