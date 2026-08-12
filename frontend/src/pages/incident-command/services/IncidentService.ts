import type { IncidentProvider } from "../providers/IncidentProvider";
import type { IncidentSummaryDTO, IncidentDTO, AffectedServiceDTO, AffectedCustomerDTO, IncidentTimelineDTO, EscalationDTO, WarRoomDTO, CommunicationDTO, IncidentActionDTO } from "../dto/incident.dto";

export interface IncidentData {
  summary: IncidentSummaryDTO;
  incidents: IncidentDTO[];
  affectedServices: AffectedServiceDTO[];
  affectedCustomers: AffectedCustomerDTO[];
  timeline: IncidentTimelineDTO[];
  escalations: EscalationDTO[];
  warRooms: WarRoomDTO[];
  communications: CommunicationDTO[];
  actions: IncidentActionDTO[];
}

export class IncidentService {
  constructor(private provider: IncidentProvider) {}

  async fetchAll(): Promise<IncidentData> {
    const [summary, incidents, affectedServices, affectedCustomers, timeline, escalations, warRooms, communications, actions] = await Promise.all([
      this.provider.getSummary(),
      this.provider.getIncidents(),
      this.provider.getAffectedServices(),
      this.provider.getAffectedCustomers(),
      this.provider.getTimeline(),
      this.provider.getEscalations(),
      this.provider.getWarRooms(),
      this.provider.getCommunications(),
      this.provider.getActions(),
    ]);

    return { summary, incidents, affectedServices, affectedCustomers, timeline, escalations, warRooms, communications, actions };
  }
}
