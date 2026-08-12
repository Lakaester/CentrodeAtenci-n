import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { ActiveIncidentsWidget } from "./widgets/ActiveIncidentsWidget";
import { CriticalServicesWidget } from "./widgets/CriticalServicesWidget";
import { AffectedCustomersWidget } from "./widgets/AffectedCustomersWidget";
import { IncidentTimelineWidget } from "./widgets/IncidentTimelineWidget";
import { EscalationsWidget } from "./widgets/EscalationsWidget";
import { WarRoomWidget } from "./widgets/WarRoomWidget";
import { CommunicationsWidget } from "./widgets/CommunicationsWidget";
import { IncidentActionsWidget } from "./widgets/IncidentActionsWidget";
import type { IncidentUI, AffectedServiceUI, AffectedCustomerUI, TimelineUI, EscalationUI, WarRoomUI, CommunicationUI, IncidentActionUI } from "../mappers/incident.mapper";
import type { IncidentState } from "../hooks/useIncidentCommand";

interface Props {
  state: IncidentState;
  incidents: IncidentUI[];
  affectedServices: AffectedServiceUI[];
  affectedCustomers: AffectedCustomerUI[];
  timeline: TimelineUI[];
  escalations: EscalationUI[];
  warRooms: WarRoomUI[];
  communications: CommunicationUI[];
  actions: IncidentActionUI[];
}

export function IncidentGrid({ state, incidents, affectedServices, affectedCustomers, timeline, escalations, warRooms, communications, actions }: Props) {
  return (
    <DashboardGrid cols={4}>
      <ActiveIncidentsWidget items={incidents} state={state} />
      <CriticalServicesWidget items={affectedServices} state={state} />
      <AffectedCustomersWidget items={affectedCustomers} state={state} />
      <IncidentTimelineWidget items={timeline} state={state} />
      <EscalationsWidget items={escalations} state={state} />
      <WarRoomWidget items={warRooms} state={state} />
      <CommunicationsWidget items={communications} state={state} />
      <IncidentActionsWidget items={actions} state={state} />
    </DashboardGrid>
  );
}
