import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { FilterStatus } from "./types";

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  status?: FilterStatus;
  className?: string;
}

export function FilterSearch({ value, onChange, placeholder = "Buscar...", status = "idle", className }: Props) {
  return (
    <div className={cn("relative", className)}>
      <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-black-25" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={status === "disabled"}
        className={cn(
          "w-full rounded-lg border border-black-10 bg-white py-1.5 pl-8 pr-7 text-xs text-black-85 outline-none placeholder:text-black-25 focus:border-[#0B3B5C] focus:ring-1 focus:ring-[#0B3B5C]/20",
          status === "disabled" && "cursor-not-allowed bg-black-5 text-black-10",
        )}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-black-25 hover:text-black-45"
          aria-label="Limpiar búsqueda"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}
