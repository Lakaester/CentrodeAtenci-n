import { DashboardShell } from "@/pages/dashboard/components/DashboardShell";
import { DashboardSection } from "@/pages/dashboard/components/DashboardSection";
import { DashboardErrorBoundary } from "@/pages/dashboard/components/DashboardErrorBoundary";
import { SkeletonGrid } from "@/pages/dashboard/components/SkeletonCard";
import { useElectronicBillingHealth } from "./hooks/useElectronicBillingHealth";
import { ElectronicBillingHealthHeader, ElectronicBillingHealthFilters, ElectronicBillingHealthOverview, ElectronicBillingHealthGrid } from "./components";

export function ElectronicBillingHealthPage() {
  const { state, lastUpdate, refresh, summary, sunat, documents, pending, rejected, certificates, licenses, throughputs, validations } = useElectronicBillingHealth();

  if (state === "loading") return (<DashboardErrorBoundary><DashboardShell header={<ElectronicBillingHealthHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}><SkeletonGrid count={8} cols={4} /></DashboardShell></DashboardErrorBoundary>);

  return (<DashboardErrorBoundary><DashboardShell header={<ElectronicBillingHealthHeader state={state} lastUpdate={lastUpdate} onRefresh={refresh} />}><div className="space-y-6"><ElectronicBillingHealthFilters /><DashboardSection title="Overview"><ElectronicBillingHealthOverview summary={summary} state={state} /></DashboardSection><DashboardSection title="Electronic Billing"><ElectronicBillingHealthGrid state={state} sunat={sunat} documents={documents} pending={pending} rejected={rejected} certificates={certificates} licenses={licenses} throughputs={throughputs} validations={validations} /></DashboardSection></div></DashboardShell></DashboardErrorBoundary>);
}
