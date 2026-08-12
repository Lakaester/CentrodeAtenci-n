import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import type { SummaryUI } from "../mappers/electronicBilling.mapper";
import type { BillingState } from "../hooks/useElectronicBillingHealth";

interface Props { summary: SummaryUI | null; state: BillingState }

const ITEMS: { key: keyof SummaryUI; label: string; color: string; suffix?: string }[] = [
  { key: "sunatStatus", label: "SUNAT Status", color: "text-black-85" },
  { key: "electronicDocuments", label: "Electronic Documents", color: "text-black-85" },
  { key: "pendingDocuments", label: "Pending Documents", color: "text-warning" },
  { key: "rejectedDocuments", label: "Rejected Documents", color: "text-danger" },
  { key: "certificatesOk", label: "Certificates OK", color: "text-success" },
  { key: "licensesActive", label: "Licenses Active", color: "text-success" },
  { key: "documentsPerMinute", label: "Documents/min", color: "text-primary" },
  { key: "validationErrors", label: "Validation Errors", color: "text-danger" },
];

export function ElectronicBillingHealthOverview({ summary, state }: Props) {
  if (state !== "success" || !summary) return null;
  return (
    <DashboardGrid cols={4}>
      {ITEMS.map((item) => {
        const val = summary[item.key];
        return (
          <div key={item.key} className="rounded-lg border border-black-10 bg-white p-4 ">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-black-45">{item.label}</p>
            <p className={`mt-1 text-2xl font-bold tracking-tight ${item.color}`}>{typeof val === "number" ? val.toLocaleString() : val}{item.suffix ?? ""}</p>
          </div>
        );
      })}
    </DashboardGrid>
  );
}
