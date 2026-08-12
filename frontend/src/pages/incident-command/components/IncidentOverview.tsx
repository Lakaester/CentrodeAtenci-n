import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import type { SummaryUI } from "../mappers/incident.mapper";
import type { IncidentState } from "../hooks/useIncidentCommand";

interface Props { summary: SummaryUI | null; state: IncidentState }

const ITEMS: { key: keyof SummaryUI; label: string; color: string; suffix?: string }[] = [
  { key: "activeIncidents", label: "Active Incidents", color: "text-danger" },
  { key: "criticalIncidents", label: "Critical", color: "text-danger" },
  { key: "affectedServices", label: "Affected Services", color: "text-warning" },
  { key: "affectedCustomers", label: "Affected Customers", color: "text-warning" },
  { key: "averageMTTA", label: "MTTA", color: "text-black-85" },
  { key: "averageMTTR", label: "MTTR", color: "text-black-85" },
  { key: "openEscalations", label: "Escalations", color: "text-purple" },
  { key: "activeWarRooms", label: "War Rooms", color: "text-primary" },
];

export function IncidentOverview({ summary, state }: Props) {
  if (state !== "success" || !summary) return null;

  return (
    <DashboardGrid cols={4}>
      {ITEMS.map((item) => {
        const val = summary[item.key];
        return (
          <div key={item.key} className="rounded-lg border border-black-10 bg-white p-4 ">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${item.color}`}>
              {typeof val === "number" ? val.toLocaleString() : val}{item.suffix ?? ""}
            </p>
          </div>
        );
      })}
    </DashboardGrid>
  );
}
