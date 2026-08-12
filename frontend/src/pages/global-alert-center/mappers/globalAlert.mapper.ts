import { SEVERITY_CONFIG, STATUS_CONFIG, SOURCE_CONFIG, PRIORITY_CONFIG, NOTIFICATION_CONFIG } from "../registry/globalAlert.registry";
import type { CriticalAlertDTO, ActiveIncidentDTO, InfrastructureAlertDTO, QueueAlertDTO, ElectronicBillingAlertDTO, DeploymentAlertDTO, SlaBreachDTO, SystemNotificationDTO, GlobalAlertSummaryDTO } from "../dto/globalAlert.dto";

export interface SummaryUI { criticalAlerts: number; activeIncidents: number; infrastructureAlerts: number; queueAlerts: number; billingAlerts: number; deploymentAlerts: number; slaBreaches: number; systemNotifications: number; }
export interface CriticalAlertUI { id: string; title: string; severity: string; severityColor: string; source: string; sourceColor: string; status: string; statusColor: string; owner: string; }
export interface IncidentUI { id: string; title: string; service: string; priority: string; priorityColor: string; status: string; statusColor: string; lead: string; customers: number; }
export interface InfraAlertUI { id: string; service: string; metric: string; severity: string; severityColor: string; value: number; threshold: number; }
export interface QueueAlertUI { id: string; queue: string; metric: string; severity: string; severityColor: string; currentValue: number; threshold: number; }
export interface BillingAlertUI { id: string; country: string; documentType: string; severity: string; severityColor: string; errorCode: string; }
export interface DeployAlertUI { id: string; service: string; version: string; severity: string; severityColor: string; reason: string; }
export interface SlaUI { id: string; ticketId: string; customer: string; severity: string; severityColor: string; minutesOverdue: number; }
export interface NotificationUI { id: string; title: string; message: string; type: string; typeColor: string; source: string; read: boolean; }

export function mapSummary(dto: GlobalAlertSummaryDTO): SummaryUI { return dto; }

export function mapCriticalAlert(dto: CriticalAlertDTO): CriticalAlertUI { const sc = SEVERITY_CONFIG[dto.severity]; const sc2 = SOURCE_CONFIG[dto.source]; const stc = STATUS_CONFIG[dto.status]; return { id: dto.id, title: dto.title, severity: sc.label, severityColor: sc.color, source: sc2.label, sourceColor: sc2.color, status: stc.label, statusColor: stc.color, owner: dto.owner }; }
export function mapCriticalAlerts(dtos: CriticalAlertDTO[]): CriticalAlertUI[] { return dtos.map(mapCriticalAlert); }
export function mapIncident(dto: ActiveIncidentDTO): IncidentUI { const pc = PRIORITY_CONFIG[dto.priority]; const stc = STATUS_CONFIG[dto.status]; return { id: dto.id, title: dto.title, service: dto.service, priority: pc.label, priorityColor: pc.color, status: stc.label, statusColor: stc.color, lead: dto.lead, customers: dto.affectedCustomers }; }
export function mapIncidents(dtos: ActiveIncidentDTO[]): IncidentUI[] { return dtos.map(mapIncident); }
export function mapInfraAlert(dto: InfrastructureAlertDTO): InfraAlertUI { const sc = SEVERITY_CONFIG[dto.severity]; return { id: dto.id, service: dto.service, metric: dto.metric, severity: sc.label, severityColor: sc.color, value: dto.value, threshold: dto.threshold }; }
export function mapInfraAlerts(dtos: InfrastructureAlertDTO[]): InfraAlertUI[] { return dtos.map(mapInfraAlert); }
export function mapQueueAlert(dto: QueueAlertDTO): QueueAlertUI { const sc = SEVERITY_CONFIG[dto.severity]; return { id: dto.id, queue: dto.queue, metric: dto.metric, severity: sc.label, severityColor: sc.color, currentValue: dto.currentValue, threshold: dto.threshold }; }
export function mapQueueAlerts(dtos: QueueAlertDTO[]): QueueAlertUI[] { return dtos.map(mapQueueAlert); }
export function mapBillingAlert(dto: ElectronicBillingAlertDTO): BillingAlertUI { const sc = SEVERITY_CONFIG[dto.severity]; return { id: dto.id, country: dto.country, documentType: dto.documentType, severity: sc.label, severityColor: sc.color, errorCode: dto.errorCode }; }
export function mapBillingAlerts(dtos: ElectronicBillingAlertDTO[]): BillingAlertUI[] { return dtos.map(mapBillingAlert); }
export function mapDeployAlert(dto: DeploymentAlertDTO): DeployAlertUI { const sc = SEVERITY_CONFIG[dto.severity]; return { id: dto.id, service: dto.service, version: dto.version, severity: sc.label, severityColor: sc.color, reason: dto.reason }; }
export function mapDeployAlerts(dtos: DeploymentAlertDTO[]): DeployAlertUI[] { return dtos.map(mapDeployAlert); }
export function mapSla(dto: SlaBreachDTO): SlaUI { const sc = SEVERITY_CONFIG[dto.severity]; return { id: dto.id, ticketId: dto.ticketId, customer: dto.customer, severity: sc.label, severityColor: sc.color, minutesOverdue: dto.minutesOverdue }; }
export function mapSlas(dtos: SlaBreachDTO[]): SlaUI[] { return dtos.map(mapSla); }
export function mapNotification(dto: SystemNotificationDTO): NotificationUI { const nc = NOTIFICATION_CONFIG[dto.type]; return { id: dto.id, title: dto.title, message: dto.message, type: nc.label, typeColor: nc.color, source: dto.source, read: dto.read }; }
export function mapNotifications(dtos: SystemNotificationDTO[]): NotificationUI[] { return dtos.map(mapNotification); }
