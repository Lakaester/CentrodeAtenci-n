import { useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface ChipProps {
  label: string;
  count?: number;
  children: ReactNode;
}

export function Chip({ label, count, children }: ChipProps) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm transition-colors",
          count
            ? "border-primary bg-primary/10 text-primary"
            : "border-border bg-surface text-muted hover:text-text",
        )}
      >
        {label}
        {count ? ` (${count})` : ""}
        <ChevronDown size={14} />
      </button>
      {open ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute left-0 z-20 mt-1 w-64 rounded-xl border border-border bg-surface p-3 ">
            {children}
          </div>
        </>
      ) : null}
    </div>
  );
}

interface MultiSelectProps {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
}

export function MultiSelect({ options, selected, onToggle }: MultiSelectProps) {
  return (
    <div className="max-h-60 space-y-1 overflow-y-auto">
      {options.length === 0 ? <p className="text-xs text-muted">Sin opciones</p> : null}
      {options.map((o) => (
        <label
          key={o}
          className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1 text-sm hover:bg-bg"
        >
          <input type="checkbox" checked={selected.includes(o)} onChange={() => onToggle(o)} />
          <span className="truncate text-text">{o}</span>
        </label>
      ))}
    </div>
  );
}

export { FilterChip } from "./FilterChipBase";

