import { STATUS_CONFIG, ENVIRONMENT_CONFIG, DEPLOYMENT_STATUS_CONFIG, QUEUE_STATUS_CONFIG } from "../registry/infrastructure.registry";
import type {
  InfrastructureSummaryDTO, MicroserviceDTO, ApiHealthDTO, FeatureFlagDTO,
  DeploymentDTO, QueueDTO, LicenseDTO, FolioDTO, RegionDTO,
} from "../dto/infrastructure.dto";

export interface SummaryUI {
  totalMicroservices: number; healthyApis: number; featureFlags: number;
  deploymentsToday: number; activeQueues: number; activeLicenses: number;
  foliosAvailable: number; globalUptime: string;
}

export interface MicroserviceUI {
  id: string; name: string; status: string; statusColor: string;
  version: string; uptime: string; latency: number; cpuUsage: number;
  memoryUsage: number; region: string;
}

export interface ApiHealthUI {
  id: string; name: string; endpoint: string; status: string; statusColor: string;
  responseTime: number; availability: number;
}

export interface FeatureFlagUI {
  id: string; name: string; environment: string; envColor: string;
  enabled: boolean; rolloutPercentage: number; owner: string;
}

export interface DeploymentUI {
  id: string; service: string; version: string; environment: string; envColor: string;
  status: string; statusColor: string; duration: string | null;
}

export interface QueueUI {
  id: string; name: string; pendingMessages: number; processingMessages: number;
  failedMessages: number; avgProcessingTime: number; status: string; statusColor: string;
}

export interface LicenseUI {
  id: string; customer: string; licenseType: string;
  expirationDate: string; status: string; daysRemaining: number;
}

export interface FolioUI {
  id: string; company: string; available: number; used: number;
  remaining: number; status: string; statusColor: string;
}

export interface RegionUI {
  id: string; country: string; region: string; status: string; statusColor: string; activeServices: number;
}

function fmtUptime(min: number): string {
  const d = Math.floor(min / 1440);
  const h = Math.floor((min % 1440) / 60);
  return d > 0 ? `${d}d ${h}h` : `${h}h`;
}

function fmtDur(min: number | null): string {
  if (min == null) return "—";
  return min < 60 ? `${min} min` : `${Math.floor(min / 60)}h ${min % 60}m`;
}

export function mapSummary(dto: InfrastructureSummaryDTO): SummaryUI {
  return { ...dto, globalUptime: fmtUptime(dto.globalUptime) };
}

export function mapMicroservice(dto: MicroserviceDTO): MicroserviceUI {
  const sc = STATUS_CONFIG[dto.status];
  return { ...dto, status: sc.label, statusColor: sc.color, uptime: fmtUptime(dto.uptime) };
}

export function mapMicroservices(dtos: MicroserviceDTO[]): MicroserviceUI[] {
  return dtos.map(mapMicroservice);
}

export function mapApiHealth(dto: ApiHealthDTO): ApiHealthUI {
  const sc = STATUS_CONFIG[dto.status];
  return { ...dto, status: sc.label, statusColor: sc.color };
}

export function mapApis(dtos: ApiHealthDTO[]): ApiHealthUI[] {
  return dtos.map(mapApiHealth);
}

export function mapFeatureFlag(dto: FeatureFlagDTO): FeatureFlagUI {
  const ec = ENVIRONMENT_CONFIG[dto.environment];
  return { ...dto, environment: ec.label, envColor: ec.color };
}

export function mapFeatureFlags(dtos: FeatureFlagDTO[]): FeatureFlagUI[] {
  return dtos.map(mapFeatureFlag);
}

export function mapDeployment(dto: DeploymentDTO): DeploymentUI {
  const ec = ENVIRONMENT_CONFIG[dto.environment];
  const dc = DEPLOYMENT_STATUS_CONFIG[dto.status];
  return { ...dto, environment: ec.label, envColor: ec.color, status: dc.label, statusColor: dc.color, duration: fmtDur(dto.duration) };
}

export function mapDeployments(dtos: DeploymentDTO[]): DeploymentUI[] {
  return dtos.map(mapDeployment);
}

export function mapQueue(dto: QueueDTO): QueueUI {
  const qc = QUEUE_STATUS_CONFIG[dto.status];
  return { ...dto, status: qc.label, statusColor: qc.color };
}

export function mapQueues(dtos: QueueDTO[]): QueueUI[] {
  return dtos.map(mapQueue);
}

export function mapLicense(dto: LicenseDTO): LicenseUI {
  return { ...dto, status: dto.status };
}

export function mapLicenses(dtos: LicenseDTO[]): LicenseUI[] {
  return dtos.map(mapLicense);
}

export function mapFolio(dto: FolioDTO): FolioUI {
  const sc = STATUS_CONFIG[dto.status];
  return { ...dto, status: sc.label, statusColor: sc.color };
}

export function mapFolios(dtos: FolioDTO[]): FolioUI[] {
  return dtos.map(mapFolio);
}

export function mapRegion(dto: RegionDTO): RegionUI {
  const sc = STATUS_CONFIG[dto.status];
  return { ...dto, status: sc.label, statusColor: sc.color };
}

export function mapRegions(dtos: RegionDTO[]): RegionUI[] {
  return dtos.map(mapRegion);
}
