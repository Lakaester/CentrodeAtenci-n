import type { IncidentSummaryDTO, IncidentDTO, AffectedServiceDTO, AffectedCustomerDTO, IncidentTimelineDTO, EscalationDTO, WarRoomDTO, CommunicationDTO, IncidentActionDTO } from "../dto/incident.dto";

export interface IncidentProvider {
  getSummary(): Promise<IncidentSummaryDTO>;
  getIncidents(): Promise<IncidentDTO[]>;
  getAffectedServices(): Promise<AffectedServiceDTO[]>;
  getAffectedCustomers(): Promise<AffectedCustomerDTO[]>;
  getTimeline(): Promise<IncidentTimelineDTO[]>;
  getEscalations(): Promise<EscalationDTO[]>;
  getWarRooms(): Promise<WarRoomDTO[]>;
  getCommunications(): Promise<CommunicationDTO[]>;
  getActions(): Promise<IncidentActionDTO[]>;
}
