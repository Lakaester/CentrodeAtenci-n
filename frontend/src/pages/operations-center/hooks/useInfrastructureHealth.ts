import { useMemo } from "react";
import { useInfrastructureData } from "./useInfrastructureData";
import { mapSummary, mapMicroservices, mapApis, mapFeatureFlags, mapDeployments, mapQueues, mapLicenses, mapFolios, mapRegions } from "../mappers/infrastructure.mapper";
import type { SummaryUI, MicroserviceUI, ApiHealthUI, FeatureFlagUI, DeploymentUI, QueueUI, LicenseUI, FolioUI, RegionUI } from "../mappers/infrastructure.mapper";

export type HealthState = "loading" | "error" | "success";

interface HealthData {
  state: HealthState;
  lastUpdate: string | null;
  error: string | null;
  refresh: () => void;
  summary: SummaryUI | null;
  microservices: MicroserviceUI[];
  apis: ApiHealthUI[];
  featureFlags: FeatureFlagUI[];
  deployments: DeploymentUI[];
  queues: QueueUI[];
  licenses: LicenseUI[];
  folios: FolioUI[];
  regions: RegionUI[];
}

export function useInfrastructureHealth(): HealthData {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useInfrastructureData();

  const summary = useMemo(() => data ? mapSummary(data.summary) : null, [data]);
  const microservices = useMemo(() => data ? mapMicroservices(data.microservices) : [], [data]);
  const apis = useMemo(() => data ? mapApis(data.apis) : [], [data]);
  const featureFlags = useMemo(() => data ? mapFeatureFlags(data.featureFlags) : [], [data]);
  const deployments = useMemo(() => data ? mapDeployments(data.deployments) : [], [data]);
  const queues = useMemo(() => data ? mapQueues(data.queues) : [], [data]);
  const licenses = useMemo(() => data ? mapLicenses(data.licenses) : [], [data]);
  const folios = useMemo(() => data ? mapFolios(data.folios) : [], [data]);
  const regions = useMemo(() => data ? mapRegions(data.regions) : [], [data]);

  const state: HealthState = isLoading ? "loading" : isError ? "error" : "success";
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : null;

  return { state, lastUpdate, error: error ?? null, refresh: refetch, summary, microservices, apis, featureFlags, deployments, queues, licenses, folios, regions };
}
