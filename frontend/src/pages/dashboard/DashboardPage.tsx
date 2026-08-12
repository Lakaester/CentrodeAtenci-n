import { useState, useEffect, useCallback, useMemo } from "react";
import { DashboardShell } from "./components/DashboardShell";
import { DashboardGrid } from "./components/DashboardGrid";
import { DashboardSection } from "./components/DashboardSection";
import { SkeletonGrid } from "./components/SkeletonCard";
import { DashboardErrorBoundary } from "./components/DashboardErrorBoundary";
import { KpiGrid } from "@/components/kpi/KpiGrid";
import { ChartContainer, ChartGrid } from "@/components/charts";
import { DashboardFilterBar } from "@/components/filters/DashboardFilterBar";
import type { FilterConfig, FilterState } from "@/components/filters/types";
import { DashboardWidget } from "@/components/widgets";
import { useFilters } from "@/contexts/FilterContext";
import { useDashboard } from "./hooks/useDashboard";
import type { DashboardFilters } from "@/lib/filters";

const DEFAULTS: DashboardFilters = {};

function useDraftFilters(appliedFilters: DashboardFilters) {
  const [draft, setDraft] = useState<DashboardFilters>(appliedFilters);

  const updateDraft = useCallback((id: string, value: string | string[] | undefined) => {
    setDraft((prev) => {
      const next = { ...prev } as Record<string, unknown>;
      if (value === undefined || (Array.isArray(value) && value.length === 0)) {
        delete next[id];
      } else {
        next[id] = value;
      }
      return next as DashboardFilters;
    });
  }, []);

  const resetDraft = useCallback(() => {
    setDraft({ ...DEFAULTS });
  }, []);

  return { draft, updateDraft, resetDraft };
}

function DashboardHeader() {
  const [greeting, setGreeting] = useState("");
  useEffect(() => {
    const h = new Date().getHours();
    setGreeting(h < 12 ? "Buenos dias" : h < 18 ? "Buenas tardes" : "Buenas noches");
  }, []);
  const today = new Intl.DateTimeFormat("es-MX", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date());

  return (
    <div>
      <h1 className="text-base font-semibold text-black-85">
        {greeting}
      </h1>
      <p className="text-[10px] text-black-25 mt-0.5">{today}</p>
    </div>
  );
}

function DashboardContent() {
  const { state, kpiItems, error } = useDashboard();
  const { filters: appliedFilters, setFilters, clear: clearApplied } = useFilters();
  const { draft, updateDraft, resetDraft } = useDraftFilters(appliedFilters);

  const filterConfigs: FilterConfig[] = [
    { id: "fecha", label: "Periodo", type: "date-range" },
  ];

  const isDirty = useMemo(() => {
    return JSON.stringify(draft) !== JSON.stringify(appliedFilters);
  }, [draft, appliedFilters]);

  const hasAnyFilter = useMemo(() => {
    return Object.values(appliedFilters).some(
      (v) => v !== undefined && (Array.isArray(v) ? v.length > 0 : v !== ""),
    );
  }, [appliedFilters]);

  const handleApply = useCallback(() => {
    setFilters({ ...draft });
  }, [draft, setFilters]);

  const handleClear = useCallback(() => {
    resetDraft();
    clearApplied();
  }, [resetDraft, clearApplied]);

  if (state === "loading") return <SkeletonGrid count={6} cols={3} />;

  return (
    <div className="space-y-5">
      <DashboardFilterBar
        configs={filterConfigs}
        values={draft as unknown as FilterState}
        onChange={(id, value) => updateDraft(id, value)}
        onApply={handleApply}
        onClear={handleClear}
        dirty={isDirty}
        activeCount={hasAnyFilter ? 1 : 0}
      />

      <DashboardSection title="Indicadores clave">
        <KpiGrid
          items={kpiItems}
          cols={4}
          isEmpty={state === "empty"}
          error={state === "error" ? error : null}
        />
      </DashboardSection>

      <DashboardSection title="Tendencias y distribucion">
        <ChartGrid cols={3}>
          <ChartContainer title="Tendencia diaria" isEmpty>
            <div />
          </ChartContainer>
          <ChartContainer title="Distribucion por estado" isEmpty>
            <div />
          </ChartContainer>
          <ChartContainer title="Carga por hora" isEmpty>
            <div />
          </ChartContainer>
        </ChartGrid>
      </DashboardSection>

      <DashboardSection title="Widgets">
        <DashboardGrid cols={3}>
          <DashboardWidget title="Casos prioritarios" state="empty" />
          <DashboardWidget title="Actividad reciente" state="empty" />
          <DashboardWidget title="Acceso rapido" state="empty" />
        </DashboardGrid>
      </DashboardSection>
    </div>
  );
}

export function DashboardPage() {
  return (
    <DashboardErrorBoundary>
      <DashboardShell header={<DashboardHeader />}>
        <DashboardContent />
      </DashboardShell>
    </DashboardErrorBoundary>
  );
}
