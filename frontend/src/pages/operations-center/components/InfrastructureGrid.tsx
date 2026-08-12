import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { MicroservicesWidget } from "./widgets/MicroservicesWidget";
import { ApiHealthWidget } from "./widgets/ApiHealthWidget";
import { FeatureFlagsWidget } from "./widgets/FeatureFlagsWidget";
import { DeploymentsWidget } from "./widgets/DeploymentsWidget";
import { QueuesWidget } from "./widgets/QueuesWidget";
import { LicensesWidget } from "./widgets/LicensesWidget";
import { FoliosWidget } from "./widgets/FoliosWidget";
import { RegionsWidget } from "./widgets/RegionsWidget";
import type { MicroserviceUI, ApiHealthUI, FeatureFlagUI, DeploymentUI, QueueUI, LicenseUI, FolioUI, RegionUI } from "../mappers/infrastructure.mapper";
import type { HealthState } from "../hooks/useInfrastructureHealth";

interface Props {
  state: HealthState;
  microservices: MicroserviceUI[]; apis: ApiHealthUI[]; featureFlags: FeatureFlagUI[];
  deployments: DeploymentUI[]; queues: QueueUI[]; licenses: LicenseUI[];
  folios: FolioUI[]; regions: RegionUI[];
}

export function InfrastructureGrid({ state, microservices, apis, featureFlags, deployments, queues, licenses, folios, regions }: Props) {
  return (
    <DashboardGrid cols={4}>
      <MicroservicesWidget items={microservices} state={state} />
      <ApiHealthWidget items={apis} state={state} />
      <FeatureFlagsWidget items={featureFlags} state={state} />
      <DeploymentsWidget items={deployments} state={state} />
      <QueuesWidget items={queues} state={state} />
      <LicensesWidget items={licenses} state={state} />
      <FoliosWidget items={folios} state={state} />
      <RegionsWidget items={regions} state={state} />
    </DashboardGrid>
  );
}
