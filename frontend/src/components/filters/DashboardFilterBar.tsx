import { FilterChip } from "./FilterChipBase";
import { FilterBadge } from "./FilterBadge";
import { FilterActions } from "./FilterActions";
import { FilterContainer } from "./FilterContainer";
import type { FilterConfig, FilterState, FilterStatus } from "./types";

interface Props {
  configs: FilterConfig[];
  values: FilterState;
  onChange: (id: string, value: string | string[] | undefined) => void;
  onApply: () => void;
  onClear: () => void;
  dirty?: boolean;
  status?: FilterStatus;
  activeCount?: number;
}

export function DashboardFilterBar({
  configs,
  values,
  onChange,
  onApply,
  onClear,
  dirty = false,
  status = "idle",
  activeCount = 0,
}: Props) {
  return (
    <FilterContainer inline>
      {configs.map((cfg) => (
        <FilterChip
          key={cfg.id}
          label={cfg.label}
          count={Array.isArray(values[cfg.id]) ? (values[cfg.id] as string[]).length : values[cfg.id] ? 1 : 0}
          active={!!values[cfg.id]}
          status={status}
        >
          {cfg.type === "search" && (
            <input
              type="text"
              value={(values[cfg.id] as string) ?? ""}
              onChange={(e) => onChange(cfg.id, e.target.value || undefined)}
              placeholder={cfg.placeholder}
              className="w-full rounded-lg border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85 outline-none"
            />
          )}
          {cfg.type === "multi" && cfg.options && (
            <div className="max-h-48 space-y-0.5 overflow-y-auto">
              {cfg.options.map((opt) => {
                const selected = Array.isArray(values[cfg.id]) && (values[cfg.id] as string[]).includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className="flex cursor-pointer items-center gap-2 rounded-lg px-2 py-1.5 text-xs hover:bg-black-5"
                  >
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => {
                        const cur = (values[cfg.id] as string[]) ?? [];
                        const next = selected ? cur.filter((v) => v !== opt.value) : [...cur, opt.value];
                        onChange(cfg.id, next.length ? next : undefined);
                      }}
                      className="accent-primary"
                    />
                    <span className="text-black-65">{opt.label}</span>
                  </label>
                );
              })}
            </div>
          )}
          {cfg.type === "date-range" && (
            <div className="flex flex-col gap-2">
              <input
                type="date"
                value={Array.isArray(values[cfg.id]) ? (values[cfg.id] as string[])[0] ?? "" : ""}
                onChange={(e) => {
                  const cur = (Array.isArray(values[cfg.id]) ? values[cfg.id] : []) as string[];
                  const next: string[] = [e.target.value, cur[1]].filter(Boolean);
                  onChange(cfg.id, next.length ? next : undefined);
                }}
                className="w-full rounded-lg border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85 outline-none"
              />
              <input
                type="date"
                value={Array.isArray(values[cfg.id]) ? (values[cfg.id] as string[])[1] ?? "" : ""}
                onChange={(e) => {
                  const cur = (Array.isArray(values[cfg.id]) ? values[cfg.id] : []) as string[];
                  const next: string[] = [cur[0], e.target.value].filter(Boolean);
                  onChange(cfg.id, next.length ? next : undefined);
                }}
                className="w-full rounded-lg border border-black-10 bg-white px-2 py-1.5 text-xs text-black-85 outline-none"
              />
            </div>
          )}
        </FilterChip>
      ))}
      <FilterBadge count={activeCount} />
      <div className="ml-auto flex items-center gap-2">
        <FilterActions
          onApply={onApply}
          onClear={onClear}
          dirty={dirty}
          status={status}
        />
      </div>
    </FilterContainer>
  );
}
