import { cn } from "@/lib/utils";
import type { FilterConfig, FilterStatus } from "./types";
import { FilterSearch } from "./FilterSearch";

interface Props {
  config: FilterConfig;
  value: string | string[] | undefined;
  options?: string[];
  onChange: (value: string | string[] | undefined) => void;
  status?: FilterStatus;
  className?: string;
}

export function FilterItem({ config, value, options, onChange, status = "idle", className }: Props) {
  const isDisabled = status === "disabled";

  const handleSelect = (opt: string) => {
    if (Array.isArray(value)) {
      const next = value.includes(opt) ? value.filter((v) => v !== opt) : [...value, opt];
      onChange(next.length ? next : undefined);
    } else {
      onChange(value === opt ? undefined : opt);
    }
  };

  if (config.type === "search") {
    return (
      <FilterSearch
        value={(value as string) ?? ""}
        onChange={(v) => onChange(v || undefined)}
        placeholder={config.placeholder}
        status={status}
        className={className}
      />
    );
  }

  return (
    <div className={cn("space-y-1", className)}>
      {config.type === "date-range" && (
        <div className="flex gap-2">
          <input
            type="date"
            value={Array.isArray(value) ? value[0] ?? "" : ""}
            onChange={(e) => {
              const cur = (Array.isArray(value) ? value : []) as string[];
              const next: string[] = [e.target.value, cur[1]].filter(Boolean);
              onChange(next.length ? next : undefined);
            }}
            disabled={isDisabled}
            className="w-full rounded-lg border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85 outline-none focus:border-[#0B3B5C] disabled:bg-black-5 disabled:text-black-10"
          />
          <input
            type="date"
            value={Array.isArray(value) ? value[1] ?? "" : ""}
            onChange={(e) => {
              const cur = (Array.isArray(value) ? value : []) as string[];
              const next: string[] = [cur[0], e.target.value].filter(Boolean);
              onChange(next.length ? next : undefined);
            }}
            disabled={isDisabled}
            className="w-full rounded-lg border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85 outline-none focus:border-[#0B3B5C] disabled:bg-black-5 disabled:text-black-10"
          />
        </div>
      )}

      {config.type === "select" && options && (
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {options.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-black-25">Sin opciones</p>
          )}
          {options.map((opt) => {
            const selected = config.type === "multi"
              ? Array.isArray(value) && value.includes(opt)
              : value === opt;
            return (
              <button
                key={opt}
                type="button"
                disabled={isDisabled}
                onClick={() => handleSelect(opt)}
                className={cn(
                  "w-full rounded-lg px-2 py-1.5 text-left text-xs transition-colors",
                  selected
                    ? "bg-[#0B3B5C]/10 text-dark font-medium"
                    : "text-[#475569] hover:bg-black-5",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                {opt}
              </button>
            );
          })}
        </div>
      )}

      {config.type === "multi" && options && (
        <div className="max-h-48 space-y-0.5 overflow-y-auto">
          {options.length === 0 && (
            <p className="px-2 py-3 text-center text-xs text-black-25">Sin opciones</p>
          )}
          {options.map((opt) => {
            const checked = Array.isArray(value) && value.includes(opt);
            return (
              <label
                key={opt}
                className={cn(
                  "flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-black-5",
                  isDisabled && "cursor-not-allowed opacity-50",
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={isDisabled}
                  onChange={() => handleSelect(opt)}
                  className="accent-[#0B3B5C]"
                />
                <span className="text-[#475569]">{opt}</span>
              </label>
            );
          })}
        </div>
      )}
    </div>
  );
}
