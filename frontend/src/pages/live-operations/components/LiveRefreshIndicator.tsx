import { cn } from "@/lib/utils";

interface Props {
  lastUpdate: string | null;
  loading?: boolean;
  onRefresh?: () => void;
  className?: string;
}

export function LiveRefreshIndicator({ lastUpdate, loading, onRefresh, className }: Props) {
  return (
    <div className={cn("flex items-center gap-2 text-[10px] text-black-25", className)} aria-live="polite" aria-atomic="true">
      {loading && (
        <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-success-50" />
      )}
      <span>
        {loading
          ? "Actualizando..."
          : lastUpdate
            ? `Última actualización: ${lastUpdate}`
            : "Sin actualizar"}
      </span>
      {onRefresh && (
        <button
          type="button"
          onClick={onRefresh}
          className="rounded-md border border-black-10 px-2 py-0.5 text-[10px] text-black-45 transition-colors hover:bg-black-5"
        >
          Refrescar
        </button>
      )}
    </div>
  );
}
