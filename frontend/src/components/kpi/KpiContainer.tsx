import { cn } from "@/lib/utils";
import { KpiCard } from "./KpiCard";
import type { KpiData, KpiSize } from "./types";

interface Props {
  items: KpiData[];
  size?: KpiSize;
  isLoading?: boolean;
  isEmpty?: boolean;
  emptyMessage?: string;
  error?: string | null;
  onRetry?: () => void;
  className?: string;
}

export function KpiContainer({
  items,
  size = "md",
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
          "flex flex-col items-center justify-center gap-2 rounded-xl border border-rose-200 bg-danger-5 p-6 text-center",
          className,
        )}
      >
        <p className="text-xs font-medium text-danger">Error al cargar indicadores</p>
        <p className="text-xs text-danger">{error}</p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-1 rounded-md bg-danger px-3 py-1 text-xs font-medium text-white hover:bg-danger-85"
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
          "flex flex-col items-center justify-center rounded-xl border border-dashed border-black-10 bg-white/50 p-6 text-center",
          className,
        )}
      >
        <p className="text-xs text-black-25">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <>
      {items.map((item) => (
        <KpiCard key={item.id} data={item} size={size} />
      ))}
    </>
  );
}
