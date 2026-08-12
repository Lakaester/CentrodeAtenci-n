import { useMemo } from "react";
import { useIncidentData } from "./useIncidentData";
import { mapSummary, mapIncidents, mapAffectedServices, mapAffectedCustomers, mapTimelines, mapEscalations, mapWarRooms, mapCommunications, mapActions } from "../mappers/incident.mapper";
import type { SummaryUI, IncidentUI, AffectedServiceUI, AffectedCustomerUI, TimelineUI, EscalationUI, WarRoomUI, CommunicationUI, IncidentActionUI } from "../mappers/incident.mapper";

export type IncidentState = "loading" | "error" | "success";

interface IncidentDataResult {
  state: IncidentState;
  lastUpdate: string | null;
  error: string | null;
  refresh: () => void;
  summary: SummaryUI | null;
  incidents: IncidentUI[];
  affectedServices: AffectedServiceUI[];
  affectedCustomers: AffectedCustomerUI[];
  timeline: TimelineUI[];
  escalations: EscalationUI[];
  warRooms: WarRoomUI[];
  communications: CommunicationUI[];
  actions: IncidentActionUI[];
}

export function useIncidentCommand(): IncidentDataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useIncidentData();

  const summary = useMemo(() => data ? mapSummary(data.summary) : null, [data]);
  const incidents = useMemo(() => data ? mapIncidents(data.incidents) : [], [data]);
  const affectedServices = useMemo(() => data ? mapAffectedServices(data.affectedServices) : [], [data]);
  const affectedCustomers = useMemo(() => data ? mapAffectedCustomers(data.affectedCustomers) : [], [data]);
  const timeline = useMemo(() => data ? mapTimelines(data.timeline) : [], [data]);
  const escalations = useMemo(() => data ? mapEscalations(data.escalations) : [], [data]);
  const warRooms = useMemo(() => data ? mapWarRooms(data.warRooms) : [], [data]);
  const communications = useMemo(() => data ? mapCommunications(data.communications) : [], [data]);
  const actions = useMemo(() => data ? mapActions(data.actions) : [], [data]);

  const state: IncidentState = isLoading ? "loading" : isError ? "error" : "success";
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : null;

  return { state, lastUpdate, error: error ?? null, refresh: refetch, summary, incidents, affectedServices, affectedCustomers, timeline, escalations, warRooms, communications, actions };
}
