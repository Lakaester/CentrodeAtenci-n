import { useEffect, useMemo, useRef, useState } from "react";
import { CalendarDays, Check, ChevronDown, RotateCcw, Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { GerencialResponse } from "../dto/dashboard.dto";

export interface DashboardDraft {
  periodo?: [string, string];
  canal?: string[];
  pais?: string[];
  asesor?: string[];
  categoria?: string[];
  subcategoria?: string[];
  dominio?: string[];
  estado?: string[];
  search?: string;
}

interface Props {
  options: GerencialResponse["opciones"];
  value: DashboardDraft;
  onChange: (next: DashboardDraft) => void;
  onApply: () => void;
  onClear: () => void;
  onPreset: (preset: "hoy" | "7d" | "30d" | "90d" | "mes" | "mesAnterior") => void;
  dirty: boolean;
  activeCount: number;
  isFetching: boolean;
}

const PRESETS: { id: "hoy" | "7d" | "30d" | "90d" | "mes" | "mesAnterior"; label: string }[] = [
  { id: "hoy", label: "Hoy" },
  { id: "7d", label: "7 días" },
  { id: "30d", label: "30 días" },
  { id: "90d", label: "90 días" },
  { id: "mes", label: "Este mes" },
  { id: "mesAnterior", label: "Mes anterior" },
];

function MultiSelect({
  label,
  options,
  value,
  onChange,
  labelFor,
}: {
  label: string;
  options: string[];
  value?: string[];
  onChange: (next: string[] | undefined) => void;
  labelFor?: (v: string) => string;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const selected = value ?? [];
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? options.filter((o) => o.toLowerCase().includes(q)) : options;
    return base.slice(0, 250);
  }, [options, query]);

  const toggle = (opt: string) => {
    const next = selected.includes(opt) ? selected.filter((v) => v !== opt) : [...selected, opt];
    onChange(next.length ? next : undefined);
  };

  return (
    <div ref={ref} className="relative">
      <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-black-45">
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex h-9 w-full items-center justify-between gap-2 rounded-lg border bg-white px-2.5 text-left text-[11px] transition-colors",
          selected.length
            ? "border-primary/50 text-primary"
            : "border-black-10 text-black-45 hover:border-black-25",
        )}
        aria-expanded={open}
      >
        <span className="truncate">
          {selected.length === 0
            ? "Todos"
            : selected.length === 1
              ? (labelFor?.(selected[0]) ?? selected[0])
              : `${selected.length} seleccionados`}
        </span>
        <ChevronDown size={13} className={cn("shrink-0 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 z-40 mt-1 w-64 rounded-xl border border-black-10 bg-white p-2 shadow-xl">
          <div className="relative mb-1.5">
            <Search size={13} className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-black-25" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={`Buscar ${label.toLowerCase()}…`}
              className="h-8 w-full rounded-md border border-black-10 pl-7 pr-2 text-[11px] outline-none focus:border-primary"
            />
          </div>
          <div className="max-h-56 space-y-0.5 overflow-y-auto">
            {filtered.map((opt) => {
              const active = selected.includes(opt);
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => toggle(opt)}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[11px]",
                    active ? "bg-primary-5 text-primary" : "text-black-85 hover:bg-light",
                  )}
                >
                  <span
                    className={cn(
                      "grid h-3.5 w-3.5 shrink-0 place-items-center rounded border",
                      active ? "border-primary bg-primary text-white" : "border-black-25 bg-white",
                    )}
                  >
                    {active && <Check size={10} />}
                  </span>
                  <span className="truncate">{labelFor?.(opt) ?? opt}</span>
                </button>
              );
            })}
            {filtered.length === 0 && <p className="px-2 py-3 text-center text-[11px] text-black-25">Sin opciones</p>}
          </div>
          <div className="mt-1.5 flex items-center justify-between border-t border-black-5 pt-1.5">
            <button
              type="button"
              onClick={() => onChange(undefined)}
              className="text-[10px] font-medium text-black-45 hover:text-black-85"
            >
              Quitar selección
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-md bg-primary px-2.5 py-1 text-[10px] font-semibold text-white hover:bg-primary-85"
            >
              Listo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export function FilterPanel({
  options,
  value,
  onChange,
  onApply,
  onClear,
  onPreset,
  dirty,
  activeCount,
  isFetching,
}: Props) {
  const set = <K extends keyof DashboardDraft>(key: K, v: DashboardDraft[K]) => {
    onChange({ ...value, [key]: v });
  };

  const estadoLabel = (v: string) =>
    ({
      cerrado: "Cerrado",
      resuelto: "Resuelto",
      abierto: "Abierto",
      pendiente: "Pendiente",
      sin_mapear: "Sin estado válido",
    })[v] ?? v;

  const chips: { key: keyof DashboardDraft; label: string }[] = [];
  if (value.canal?.length) chips.push({ key: "canal", label: `Canal: ${value.canal.join(", ")}` });
  if (value.pais?.length) chips.push({ key: "pais", label: `País: ${value.pais.join(", ")}` });
  if (value.asesor?.length) chips.push({ key: "asesor", label: `Asesor: ${value.asesor.join(", ")}` });
  if (value.categoria?.length) chips.push({ key: "categoria", label: `Categoría: ${value.categoria.join(", ")}` });
  if (value.subcategoria?.length) chips.push({ key: "subcategoria", label: `Subcategoría: ${value.subcategoria.join(", ")}` });
  if (value.dominio?.length) chips.push({ key: "dominio", label: `Cliente/dominio: ${value.dominio.join(", ")}` });
  if (value.estado?.length) chips.push({ key: "estado", label: `Estado: ${value.estado.map(estadoLabel).join(", ")}` });
  if (value.search) chips.push({ key: "search", label: `Búsqueda: ${value.search}` });

  return (
    <div className="rounded-2xl border border-black-10 bg-white p-4 shadow-[0_1px_2px_rgba(76,91,95,0.04)]">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="mr-1 inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-black-45">
            <CalendarDays size={13} /> Periodo
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPreset(p.id)}
              className="rounded-full border border-black-10 px-2.5 py-1 text-[10px] font-medium text-black-45 transition-colors hover:border-primary/50 hover:bg-primary-5 hover:text-primary"
            >
              {p.label}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          {isFetching && (
            <span className="inline-flex items-center gap-1 text-[10px] font-medium text-primary">
              <span className="h-2 w-2 animate-pulse rounded-full bg-primary" /> Actualizando…
            </span>
          )}
          {activeCount > 0 && (
            <span className="rounded-full bg-primary-5 px-2.5 py-1 text-[10px] font-semibold text-primary">
              {activeCount} filtro{activeCount === 1 ? "" : "s"} activo{activeCount === 1 ? "" : "s"}
            </span>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-black-45">
            Desde
          </label>
          <input
            type="date"
            value={value.periodo?.[0] ?? ""}
            onChange={(e) => {
              const start = e.target.value;
              const end = value.periodo?.[1] ?? "";
              set("periodo", start || end ? [start, end] : undefined);
            }}
            className="h-9 w-full rounded-lg border border-black-10 bg-white px-2 text-[11px] text-black-85 outline-none focus:border-primary"
          />
        </div>
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-black-45">
            Hasta
          </label>
          <input
            type="date"
            value={value.periodo?.[1] ?? ""}
            onChange={(e) => {
              const start = value.periodo?.[0] ?? "";
              const end = e.target.value;
              set("periodo", start || end ? [start, end] : undefined);
            }}
            className="h-9 w-full rounded-lg border border-black-10 bg-white px-2 text-[11px] text-black-85 outline-none focus:border-primary"
          />
        </div>
        <MultiSelect label="Canal" options={options.canal} value={value.canal} onChange={(v) => set("canal", v)} />
        <MultiSelect label="País" options={options.pais} value={value.pais} onChange={(v) => set("pais", v)} />
        <MultiSelect label="Asesor" options={options.asesor} value={value.asesor} onChange={(v) => set("asesor", v)} />
        <MultiSelect label="Categoría" options={options.categoria} value={value.categoria} onChange={(v) => set("categoria", v)} />
        <MultiSelect label="Subcategoría" options={options.subcategoria} value={value.subcategoria} onChange={(v) => set("subcategoria", v)} />
        <MultiSelect label="Cliente / dominio" options={options.dominio} value={value.dominio} onChange={(v) => set("dominio", v)} />
        <MultiSelect label="Estado" options={options.estado} value={value.estado} onChange={(v) => set("estado", v)} labelFor={estadoLabel} />
        <div>
          <label className="mb-1 block text-[10px] font-semibold uppercase tracking-[0.08em] text-black-45">
            Buscar
          </label>
          <div className="relative">
            <Search size={13} className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-black-25" />
            <input
              value={value.search ?? ""}
              onChange={(e) => set("search", e.target.value || undefined)}
              placeholder="Ticket, contacto…"
              className="h-9 w-full rounded-lg border border-black-10 bg-white pl-7 pr-2 text-[11px] text-black-85 outline-none focus:border-primary"
            />
          </div>
        </div>
      </div>

      {chips.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-1.5">
          {chips.map((chip) => (
            <button
              key={chip.key}
              type="button"
              onClick={() => set(chip.key, undefined)}
              className="inline-flex max-w-full items-center gap-1 rounded-full border border-primary-25 bg-primary-5 px-2.5 py-1 text-[10px] font-medium text-primary hover:bg-primary-10"
            >
              <span className="truncate">{chip.label}</span>
              <X size={10} />
            </button>
          ))}
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 border-t border-black-5 pt-3">
        <p className="inline-flex items-center gap-1 text-[10px] text-black-25">
          <SlidersHorizontal size={12} /> Los filtros aplican a KPIs, gráficos, equipo, causas y alertas.
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onClear}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-black-10 bg-white px-3 text-[11px] font-medium text-black-45 hover:bg-light hover:text-black-85"
          >
            <RotateCcw size={13} /> Limpiar
          </button>
          <button
            type="button"
            onClick={onApply}
            disabled={!dirty}
            className={cn(
              "h-9 rounded-lg px-4 text-[11px] font-semibold text-white transition-colors",
              dirty ? "bg-primary hover:bg-primary-85" : "cursor-not-allowed bg-primary/40",
            )}
          >
            Aplicar filtros
          </button>
        </div>
      </div>
    </div>
  );
}
