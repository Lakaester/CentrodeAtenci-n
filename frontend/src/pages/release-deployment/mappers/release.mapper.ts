import { RELEASE_STATUS_CONFIG, DEPLOYMENT_STATUS_CONFIG, ENVIRONMENT_CONFIG, PIPELINE_STATUS_CONFIG, VERSION_TYPE_CONFIG, ROLLBACK_STATUS_CONFIG } from "../registry/release.registry";
import type { ReleaseDTO, DeploymentDTO, EnvironmentDTO, PipelineDTO, VersionDTO, RollbackDTO, DeploymentQueueDTO, ReleaseCalendarDTO, ReleaseSummaryDTO } from "../dto/release.dto";

export interface SummaryUI { totalReleases: number; successfulDeployments: number; failedDeployments: number; pendingDeployments: number; productionVersions: number; rollbackEvents: number; activePipelines: number; averageDeploymentTime: string; }
export interface ReleaseUI { id: string; name: string; version: string; status: string; statusColor: string; environment: string; envColor: string; manager: string; }
export interface DeploymentUI { id: string; service: string; version: string; environment: string; envColor: string; status: string; statusColor: string; duration: string | null; }
export interface EnvironmentUI { id: string; name: string; type: string; typeColor: string; currentVersion: string; status: string; }
export interface PipelineUI { id: string; name: string; status: string; statusColor: string; branch: string; duration: string | null; triggeredBy: string; }
export interface VersionUI { id: string; service: string; version: string; type: string; typeColor: string; environment: string; envColor: string; }
export interface RollbackUI { id: string; service: string; fromVersion: string; toVersion: string; status: string; statusColor: string; reason: string; }
export interface QueueUI { id: string; service: string; version: string; environment: string; envColor: string; status: string; }
export interface CalendarUI { id: string; title: string; date: string; type: string; environment: string; envColor: string; status: string; }

function fmtMin(m: number | null): string { if (m == null) return "—"; return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h ${m % 60}m`; }

export function mapSummary(dto: ReleaseSummaryDTO): SummaryUI { return { ...dto, averageDeploymentTime: fmtMin(dto.averageDeploymentTime) }; }

export function mapRelease(dto: ReleaseDTO): ReleaseUI { const sc = RELEASE_STATUS_CONFIG[dto.status]; const ec = ENVIRONMENT_CONFIG[dto.environment]; return { id: dto.id, name: dto.name, version: dto.version, status: sc.label, statusColor: sc.color, environment: ec.label, envColor: ec.color, manager: dto.manager }; }
export function mapReleases(dtos: ReleaseDTO[]): ReleaseUI[] { return dtos.map(mapRelease); }
export function mapDeployment(dto: DeploymentDTO): DeploymentUI { const dc = DEPLOYMENT_STATUS_CONFIG[dto.status]; const ec = ENVIRONMENT_CONFIG[dto.environment]; return { id: dto.id, service: dto.service, version: dto.version, environment: ec.label, envColor: ec.color, status: dc.label, statusColor: dc.color, duration: fmtMin(dto.duration) }; }
export function mapDeployments(dtos: DeploymentDTO[]): DeploymentUI[] { return dtos.map(mapDeployment); }
export function mapEnvironment(dto: EnvironmentDTO): EnvironmentUI { const ec = ENVIRONMENT_CONFIG[dto.type]; return { id: dto.id, name: dto.name, type: ec.label, typeColor: ec.color, currentVersion: dto.currentVersion, status: dto.status }; }
export function mapEnvironments(dtos: EnvironmentDTO[]): EnvironmentUI[] { return dtos.map(mapEnvironment); }
export function mapPipeline(dto: PipelineDTO): PipelineUI { const pc = PIPELINE_STATUS_CONFIG[dto.status]; return { id: dto.id, name: dto.name, status: pc.label, statusColor: pc.color, branch: dto.branch, duration: fmtMin(dto.duration), triggeredBy: dto.triggeredBy }; }
export function mapPipelines(dtos: PipelineDTO[]): PipelineUI[] { return dtos.map(mapPipeline); }
export function mapVersion(dto: VersionDTO): VersionUI { const vc = VERSION_TYPE_CONFIG[dto.type]; const ec = ENVIRONMENT_CONFIG[dto.environment]; return { id: dto.id, service: dto.service, version: dto.version, type: vc.label, typeColor: vc.color, environment: ec.label, envColor: ec.color }; }
export function mapVersions(dtos: VersionDTO[]): VersionUI[] { return dtos.map(mapVersion); }
export function mapRollback(dto: RollbackDTO): RollbackUI { const rc = ROLLBACK_STATUS_CONFIG[dto.status]; return { id: dto.id, service: dto.service, fromVersion: dto.fromVersion, toVersion: dto.toVersion, status: rc.label, statusColor: rc.color, reason: dto.reason }; }
export function mapRollbacks(dtos: RollbackDTO[]): RollbackUI[] { return dtos.map(mapRollback); }
export function mapQueueItem(dto: DeploymentQueueDTO): QueueUI { const ec = ENVIRONMENT_CONFIG[dto.environment]; return { id: dto.id, service: dto.service, version: dto.version, environment: ec.label, envColor: ec.color, status: dto.status }; }
export function mapQueueItems(dtos: DeploymentQueueDTO[]): QueueUI[] { return dtos.map(mapQueueItem); }
export function mapCalendarEvent(dto: ReleaseCalendarDTO): CalendarUI { const ec = ENVIRONMENT_CONFIG[dto.environment]; return { id: dto.id, title: dto.title, date: dto.date, type: dto.type, environment: ec.label, envColor: ec.color, status: dto.status }; }
export function mapCalendarEvents(dtos: ReleaseCalendarDTO[]): CalendarUI[] { return dtos.map(mapCalendarEvent); }
