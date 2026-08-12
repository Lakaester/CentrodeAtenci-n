import { cn } from "@/lib/utils";
import { X } from "lucide-react";
import type { FilterStatus } from "./types";

interface Props {
  count: number;
  status?: FilterStatus;
  onClear?: () => void;
  className?: string;
}

const STATUS_COLORS: Record<string, string> = {
  idle: "bg-black-5 text-black-45",
  loading: "bg-black-5 text-black-45 animate-pulse",
  error: "bg-danger-5 text-danger",
  disabled: "bg-black-5 text-black-10",
};

export function FilterBadge({ count, status = "idle", onClear, className }: Props) {
  if (count === 0) return null;

  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", STATUS_COLORS[status], className)}>
      {count} filtro{count !== 1 ? "s" : ""} activo{count !== 1 ? "s" : ""}
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          className="ml-0.5 rounded-full p-0.5 hover:bg-black/10"
          aria-label="Limpiar filtros"
        >
          <X size={12} />
        </button>
      )}
    </span>
  );
}
