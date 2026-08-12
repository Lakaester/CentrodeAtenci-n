import { cn } from "@/lib/utils";
import type { FilterStatus } from "./types";

interface Props {
  onApply: () => void;
  onClear?: () => void;
  dirty?: boolean;
  status?: FilterStatus;
  applyLabel?: string;
  clearLabel?: string;
  className?: string;
}

export function FilterActions({
  onApply,
  onClear,
  dirty = false,
  status = "idle",
  applyLabel = "Aplicar",
  clearLabel = "Limpiar",
  className,
}: Props) {
  const isDisabled = status === "disabled" || status === "loading";

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {onClear && (
        <button
          type="button"
          onClick={onClear}
          disabled={isDisabled}
          className="h-9 rounded border border-black-10 bg-white px-3 text-xs font-medium text-black-45 transition-colors hover:bg-black-5 hover:text-black-85 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {clearLabel}
        </button>
      )}
      <button
        type="button"
        onClick={onApply}
        disabled={!dirty || isDisabled}
        className={cn(
          "h-9 rounded px-4 text-xs font-semibold text-white transition-colors",
          dirty
            ? "bg-primary hover:bg-primary-85"
            : "cursor-not-allowed bg-primary/40",
        )}
      >
        {status === "loading" ? "Aplicando..." : applyLabel}
      </button>
    </div>
  );
}
