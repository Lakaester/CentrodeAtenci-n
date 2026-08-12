import { cn } from "@/lib/utils";
import { Activity } from "lucide-react";
import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { KpiCard } from "./KpiCard";
import type { KpiData, KpiSize } from "./types";

interface Props {
  items: KpiData[];
  size?: KpiSize;
  cols?: 2 | 3 | 4;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function KpiGrid({
  items,
  size = "md",
  cols = 4,
  isLoading,
  isEmpty,
  emptyMessage = "No hay indicadores disponibles",
  error,
  onRetry,
  className,
}: Props) {
  if (error) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-danger-10 bg-danger-5 p-6 text-center",
          className,
        )}
      >
        <p className="text-xs font-semibold text-danger">Error al cargar indicadores</p>
        <p className="text-[10px] text-danger">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 rounded bg-primary px-3 py-1.5 text-xs font-medium text-white hover:bg-primary-85"
          >
            Reintentar
          </button>
        )}
      </div>
    );
  }

  if (isEmpty || (!isLoading && items.length === 0)) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center gap-2 rounded-lg border border-black-5 bg-white p-6 text-center",
          className,
        )}
      >
        <Activity size={24} className="text-black-10" />
        <p className="text-xs text-black-25">{emptyMessage}</p>
        <p className="text-[10px] text-black-10">Los indicadores apareceran cuando haya datos</p>
      </div>
    );
  }

  return (
    <DashboardGrid cols={cols} className={className}>
      {items.map((item) => (
        <KpiCard key={item.id} data={item} size={size} />
      ))}
    </DashboardGrid>
  );
}
