import { useMemo } from "react";
import { useReleaseData } from "./useReleaseData";
import { mapSummary, mapReleases, mapDeployments, mapEnvironments, mapPipelines, mapVersions, mapRollbacks, mapQueueItems, mapCalendarEvents } from "../mappers/release.mapper";
import type { SummaryUI, ReleaseUI, DeploymentUI, EnvironmentUI, PipelineUI, VersionUI, RollbackUI, QueueUI, CalendarUI } from "../mappers/release.mapper";

export type ReleaseState = "loading" | "empty" | "error" | "success";

interface ReleaseDataResult {
  state: ReleaseState; lastUpdate: string | null; error: string | null; refresh: () => void;
  summary: SummaryUI | null; releases: ReleaseUI[]; deployments: DeploymentUI[];
  environments: EnvironmentUI[]; pipelines: PipelineUI[]; versions: VersionUI[];
  rollbacks: RollbackUI[]; queue: QueueUI[]; calendar: CalendarUI[];
}

export function useReleaseDeployment(): ReleaseDataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useReleaseData();
  const summary = useMemo(() => data ? mapSummary(data.summary) : null, [data]);
  const releases = useMemo(() => data ? mapReleases(data.releases) : [], [data]);
  const deployments = useMemo(() => data ? mapDeployments(data.deployments) : [], [data]);
  const environments = useMemo(() => data ? mapEnvironments(data.environments) : [], [data]);
  const pipelines = useMemo(() => data ? mapPipelines(data.pipelines) : [], [data]);
  const versions = useMemo(() => data ? mapVersions(data.versions) : [], [data]);
  const rollbacks = useMemo(() => data ? mapRollbacks(data.rollbacks) : [], [data]);
  const queue = useMemo(() => data ? mapQueueItems(data.queue) : [], [data]);
  const calendar = useMemo(() => data ? mapCalendarEvents(data.calendar) : [], [data]);

  const hasData = data && data.releases.length > 0;
  const state: ReleaseState = isLoading ? "loading" : isError ? "error" : hasData ? "success" : "empty";
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : null;

  return { state, lastUpdate, error: error ?? null, refresh: refetch, summary, releases, deployments, environments, pipelines, versions, rollbacks, queue, calendar };
}
