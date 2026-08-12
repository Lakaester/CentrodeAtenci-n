import { useMemo } from "react";
import { DashboardWidget } from "@/components/widgets";
import type { LicenseUI } from "../../mappers/infrastructure.mapper";

interface Props { items: LicenseUI[]; state: "loading" | "empty" | "error" | "success" }

export function LicensesWidget({ items, state }: Props) {
  const agg = useMemo(() => ({
    active: items.filter((i) => i.status === "active").length,
    expiring: items.filter((i) => i.status === "expiring").length,
    expired: items.filter((i) => i.status === "expired").length,
  }), [items]);

  if (state === "error") return <DashboardWidget title="Licenses" subtitle="Licencias y suscripciones" state="error" />;
  if (state === "empty" || items.length === 0) return <DashboardWidget title="Licenses" subtitle="Licencias y suscripciones" state="empty" />;

  return (
    <DashboardWidget title="Licenses" subtitle="Licencias y suscripciones" state="success">
      <div className="flex gap-3 mb-3 text-[10px]">
        <span className="font-medium text-black-85">{items.length} licencias</span>
        <span className="text-success">{agg.active} activas</span>
        <span className="text-warning">{agg.expiring} por vencer</span>
        <span className="text-danger">{agg.expired} expiradas</span>
      </div>
      <div className="space-y-1 text-[10px]">
        {items.slice(0, 5).map((l) => (
          <div key={l.id} className="flex items-center gap-2 rounded bg-light px-2 py-1">
            <span className={`inline-flex items-center rounded px-1 py-0.5 text-[9px] font-medium ${
              l.status === "active" ? "text-success bg-success-5" : l.status === "expiring" ? "text-warning bg-warning-5" : "text-danger bg-danger-5"
            }`}>{l.status === "active" ? "Activa" : l.status === "expiring" ? "Por vencer" : "Expirada"}</span>
            <span className="flex-1 font-medium text-black-85 truncate">{l.customer}</span>
            <span className="text-black-25 text-[9px]">{l.licenseType}</span>
            <span className="text-black-45 w-14 text-right">{l.daysRemaining}d</span>
          </div>
        ))}
      </div>
    </DashboardWidget>
  );
}
