import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILTER_INACTIVE_COLOR, FILTER_ACTIVE_COLOR, FILTER_DISABLED_COLOR } from "./constants";
import type { FilterStatus } from "./types";

interface Props {
  label: string;
  count?: number;
  active?: boolean;
  status?: FilterStatus;
  children: ReactNode;
}

export function FilterChip({ label, count, active, status = "idle", children }: Props) {
  const [open, setOpen] = useState(false);

  const colorClass = status === "disabled"
    ? FILTER_DISABLED_COLOR
    : active || (count && count > 0)
      ? FILTER_ACTIVE_COLOR
      : FILTER_INACTIVE_COLOR;

  return (
    <div className="relative">
      <button
        type="button"
        disabled={status === "disabled"}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
          colorClass,
        )}
      >
        {label}
        {count ? ` (${count})` : null}
        <ChevronDown size={14} className={cn("transition-transform", open && "rotate-180")} />
      </button>
      {open && status !== "disabled" && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-1 w-64 rounded-xl border border-black-10 bg-white p-3 ">
            {children}
          </div>
        </>
      )}
    </div>
  );
}
