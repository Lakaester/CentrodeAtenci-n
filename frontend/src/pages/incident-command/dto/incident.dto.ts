export type IncidentSeverity = "critical" | "high" | "medium" | "low";
export type IncidentStatus = "open" | "investigating" | "identified" | "monitoring" | "resolved";
export type Environment = "production" | "staging" | "qa" | "development";
export type CommunicationChannel = "email" | "slack" | "teams" | "whatsapp" | "statuspage";
export type EscalationLevel = "L1" | "L2" | "L3" | "Engineering" | "Executive";

export interface IncidentSummaryDTO {
  activeIncidents: number; criticalIncidents: number;
  affectedServices: number; affectedCustomers: number;
  averageMTTA: number; averageMTTR: number;
  openEscalations: number; activeWarRooms: number;
}

export interface IncidentDTO {
  id: string; title: string; description: string;
  severity: IncidentSeverity; status: IncidentStatus;
  environment: Environment; service: string;
  region: string; detectedAt: string; acknowledgedAt: string | null;
  resolvedAt: string | null; mtta: number | null; mttr: number | null;
  lead: string; warRoomId: string | null;
}

export interface AffectedServiceDTO {
  id: string; incidentId: string; name: string;
  status: "healthy" | "degraded" | "down"; impact: string;
  since: string; restoredAt: string | null;
}

export interface AffectedCustomerDTO {
  id: string; incidentId: string; name: string;
  segment: string; tickets: number; impact: string;
}

export interface IncidentTimelineDTO {
  id: string; incidentId: string; timestamp: string;
  eventType: string; title: string; description: string;
  actor: string; actorRole: string;
}

export interface EscalationDTO {
  id: string; incidentId: string; level: EscalationLevel;
  escalatedTo: string; escalatedBy: string;
  reason: string; createdAt: string; resolvedAt: string | null;
}

export interface CommunicationDTO {
  id: string; incidentId: string; channel: CommunicationChannel;
  subject: string; sentTo: string; sentAt: string;
  status: "sent" | "pending" | "failed";
}

export interface WarRoomDTO {
  id: string; incidentId: string; name: string;
  status: "active" | "standby" | "closed";
  leader: string; members: number; startedAt: string;
  lastActivity: string;
}

export interface IncidentActionDTO {
  id: string; incidentId: string; description: string;
  owner: string; priority: "critical" | "high" | "medium" | "low";
  status: "pending" | "in-progress" | "completed" | "cancelled";
  dueAt: string | null; completedAt: string | null;
}
