import { cn } from "@/lib/utils";
import { KpiHeader } from "./KpiHeader";
import { KpiValue } from "./KpiValue";
import { KpiTrend } from "./KpiTrend";
import { KpiStatus } from "./KpiStatus";
import { KPI_SIZE_CLASSES } from "./constants";
import type { KpiData, KpiSize } from "./types";

interface Props {
  data: KpiData;
  size?: KpiSize;
  className?: string;
}

export function KpiCard({ data, size = "md", className }: Props) {
  const { title, value, unit, subtitle, icon, trend, status, href, loading, error } = data;

  if (loading) {
    return (
      <div
        className={cn(
          "animate-pulse rounded-lg border border-black-5 bg-white overflow-hidden",
          KPI_SIZE_CLASSES[size],
          className,
        )}
        aria-label="Cargando KPI"
      >
        <div className="h-[3px] bg-black-5" />
        <div className={cn(KPI_SIZE_CLASSES[size])}>
          <div className="mb-3 h-3 w-2/3 rounded bg-black-5" />
          <div className="mb-2 h-7 w-1/2 rounded bg-black-5" />
          <div className="h-4 w-1/3 rounded bg-black-5" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "rounded-lg border border-danger-10 bg-danger-5 overflow-hidden",
          KPI_SIZE_CLASSES[size],
          className,
        )}
      >
        <div className="h-[3px] bg-danger" />
        <div className={cn(KPI_SIZE_CLASSES[size])}>
          <p className="text-xs font-semibold text-danger">Error</p>
          <p className="mt-1 text-xs text-danger">{error}</p>
        </div>
      </div>
    );
  }

  const Wrapper = href ? "a" : "div";

  return (
    <Wrapper
      {...(href ? { href } : {})}
      className={cn(
        "rounded-lg border border-black-5 bg-white overflow-hidden",
        href && "cursor-pointer hover:border-black-10 transition-colors",
        className,
      )}
    >
      <div className="h-[3px] bg-primary" />
      <div className={cn(KPI_SIZE_CLASSES[size])}>
        <KpiHeader title={title} icon={icon} />
        <div className="mt-2">
          <KpiValue value={value} unit={unit} size={size} />
        </div>
        {subtitle && (
          <p className="mt-0.5 text-[10px] text-black-25">{subtitle}</p>
        )}
        {(trend || status) && (
          <div className="mt-3 flex items-center gap-3">
            {trend && <KpiTrend trend={trend} />}
            {status && <KpiStatus variant={status.variant} label={status.label} />}
          </div>
        )}
      </div>
    </Wrapper>
  );
}
