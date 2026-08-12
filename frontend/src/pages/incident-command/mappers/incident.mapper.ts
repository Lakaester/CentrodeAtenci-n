import { SEVERITY_CONFIG, STATUS_CONFIG, ENVIRONMENT_CONFIG, CHANNEL_CONFIG, ESCALATION_CONFIG } from "../registry/incident.registry";
import type { IncidentDTO, AffectedServiceDTO, AffectedCustomerDTO, IncidentTimelineDTO, EscalationDTO, WarRoomDTO, CommunicationDTO, IncidentActionDTO, IncidentSummaryDTO } from "../dto/incident.dto";

export interface IncidentUI { id: string; title: string; severity: string; severityColor: string; severityOrder: number; status: string; statusColor: string; environment: string; envColor: string; service: string; region: string; detectedAt: string; lead: string; warRoomId: string | null; mtta: string | null; mttr: string | null; }
export interface AffectedServiceUI { id: string; name: string; status: string; impact: string; }
export interface AffectedCustomerUI { id: string; name: string; segment: string; tickets: number; impact: string; }
export interface TimelineUI { id: string; timestamp: string; eventType: string; title: string; description: string; actor: string; }
export interface EscalationUI { id: string; level: string; escalatedTo: string; escalatedBy: string; reason: string; }
export interface CommunicationUI { id: string; channel: string; channelIcon: string; subject: string; sentTo: string; status: string; }
export interface WarRoomUI { id: string; name: string; status: string; leader: string; members: number; }
export interface IncidentActionUI { id: string; description: string; owner: string; priority: string; status: string; }
export interface SummaryUI { activeIncidents: number; criticalIncidents: number; affectedServices: number; affectedCustomers: number; averageMTTA: string; averageMTTR: string; openEscalations: number; activeWarRooms: number; }

function fmtMin(m: number | null): string { if (m == null) return "—"; return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; }

export function mapSummary(dto: IncidentSummaryDTO): SummaryUI { return { ...dto, averageMTTA: fmtMin(dto.averageMTTA), averageMTTR: fmtMin(dto.averageMTTR) }; }

export function mapIncident(dto: IncidentDTO): IncidentUI {
  const sc = SEVERITY_CONFIG[dto.severity]; const stc = STATUS_CONFIG[dto.status]; const ec = ENVIRONMENT_CONFIG[dto.environment];
  return { id: dto.id, title: dto.title, severity: sc.label, severityColor: sc.color, severityOrder: sc.order, status: stc.label, statusColor: stc.color, environment: ec.label, envColor: ec.color, service: dto.service, region: dto.region, detectedAt: dto.detectedAt, lead: dto.lead, warRoomId: dto.warRoomId, mtta: fmtMin(dto.mtta), mttr: fmtMin(dto.mttr) };
}
export function mapIncidents(dtos: IncidentDTO[]): IncidentUI[] { return dtos.map(mapIncident); }
export function mapAffectedService(dto: AffectedServiceDTO): AffectedServiceUI { return { id: dto.id, name: dto.name, status: dto.status, impact: dto.impact }; }
export function mapAffectedServices(dtos: AffectedServiceDTO[]): AffectedServiceUI[] { return dtos.map(mapAffectedService); }
export function mapAffectedCustomer(dto: AffectedCustomerDTO): AffectedCustomerUI { return { id: dto.id, name: dto.name, segment: dto.segment, tickets: dto.tickets, impact: dto.impact }; }
export function mapAffectedCustomers(dtos: AffectedCustomerDTO[]): AffectedCustomerUI[] { return dtos.map(mapAffectedCustomer); }
export function mapTimeline(dto: IncidentTimelineDTO): TimelineUI { return { id: dto.id, timestamp: dto.timestamp, eventType: dto.eventType, title: dto.title, description: dto.description, actor: dto.actor }; }
export function mapTimelines(dtos: IncidentTimelineDTO[]): TimelineUI[] { return dtos.map(mapTimeline); }
export function mapEscalation(dto: EscalationDTO): EscalationUI { const ec = ESCALATION_CONFIG[dto.level]; return { id: dto.id, level: ec.label, escalatedTo: dto.escalatedTo, escalatedBy: dto.escalatedBy, reason: dto.reason }; }
export function mapEscalations(dtos: EscalationDTO[]): EscalationUI[] { return dtos.map(mapEscalation); }
export function mapWarRoom(dto: WarRoomDTO): WarRoomUI { return { id: dto.id, name: dto.name, status: dto.status, leader: dto.leader, members: dto.members }; }
export function mapWarRooms(dtos: WarRoomDTO[]): WarRoomUI[] { return dtos.map(mapWarRoom); }
export function mapCommunication(dto: CommunicationDTO): CommunicationUI { const cc = CHANNEL_CONFIG[dto.channel]; return { id: dto.id, channel: cc.label, channelIcon: cc.icon, subject: dto.subject, sentTo: dto.sentTo, status: dto.status }; }
export function mapCommunications(dtos: CommunicationDTO[]): CommunicationUI[] { return dtos.map(mapCommunication); }
export function mapAction(dto: IncidentActionDTO): IncidentActionUI { return { id: dto.id, description: dto.description, owner: dto.owner, priority: dto.priority, status: dto.status }; }
export function mapActions(dtos: IncidentActionDTO[]): IncidentActionUI[] { return dtos.map(mapAction); }
