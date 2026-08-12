/** Contexto GLOBAL de filtros: compartido por todas las pestañas. */
import { createContext, useContext, useState, type ReactNode } from "react";
import type { DashboardFilters } from "@/lib/filters";

function nowLocalISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day} ${hh}:${mm}`;
}

const DEFAULTS: DashboardFilters = {
  fechaHoraInicio: `${nowLocalISO().slice(0, 10)} 00:00`,
  fechaHoraFin: nowLocalISO(),
};

interface FilterCtx {
  filters: DashboardFilters;
  setFilters: (f: DashboardFilters) => void;
  clear: () => void;
}

const FilterContext = createContext<FilterCtx | undefined>(undefined);

export function FilterProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<DashboardFilters>(DEFAULTS);
  const clear = () => setFilters({ ...DEFAULTS });
  return (
    <FilterContext.Provider value={{ filters, setFilters, clear }}>
      {children}
    </FilterContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useFilters() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error("useFilters debe usarse dentro de FilterProvider");
  return ctx;
}
