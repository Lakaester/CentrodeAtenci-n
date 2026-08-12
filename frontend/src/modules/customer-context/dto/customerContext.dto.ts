import type { InboxChannel, InboxSubChannel } from "../../inbox/dto/inbox.dto";
import type { HealthResult } from "../registry/HealthEngine";

export interface CustomerContactDTO {
  name: string;
  email: string | null;
  phone: string | null;
  avatarUrl: string | null;
}

export interface CustomerDomainDTO {
  domain: string | null;
  country: string | null;
  since: string | null;
}

export interface CustomerHealthDTO {
  totalTickets: number;
  openTickets: number;
  avgResponseTime: number | null;
  slaCompliance: number | null;
  lastInteraction: string | null;
}

export interface CustomerProductDTO { id: string; name: string; status: string; }
export interface CustomerLicenseDTO { id: string; type: string; status: string; expiresAt: string | null; daysRemaining?: number; }
export interface CustomerRecentTicketDTO { id: string; subject: string; status: string; channel: string; createdAt: string; }
export interface CustomerActivityDTO { id: string; action: string; description: string; timestamp: string; actor: string; }
export interface CustomerDiagnosticDTO { id: string; problem: string; cause: string | null; resolution: string | null; }

export interface VersionInfo {
  installed: string;
  latest: string;
  status: "actualizado" | "desactualizado" | "critico";
  lastCheck: string;
}

export interface FeatureFlagInfo {
  name: string;
  enabled: boolean;
  environment: string;
}

export interface FolioInfo {
  available: number;
  used: number;
  remaining: number;
  consumptionPct: number;
  lowStock: boolean;
}

export interface QueueProcessInfo {
  name: string;
  pending: number;
  executed: number;
  errors: number;
  lastExecution: string | null;
}

export interface MicroserviceInfo {
  name: string;
  status: "healthy" | "degraded" | "down";
  uptime: string;
}

export interface LicenseInfo {
  type: string;
  status: string;
  expiresAt: string | null;
  daysRemaining?: number;
}

export interface CustomerContextDTO {
  ticketId: string;
  channel: InboxChannel;
  subChannel: InboxSubChannel;
  contact: CustomerContactDTO;
  domain: CustomerDomainDTO | null;
  assignedQueue: string | null;
  assignedUser: string | null;
  conversationWindow: { expiresAt: string | null; isExpired: boolean } | null;
  lastInteraction: string | null;
  health: CustomerHealthDTO | null;
  products: CustomerProductDTO[];
  licenses: LicenseInfo[];
  recentTickets: CustomerRecentTicketDTO[];
  activities: CustomerActivityDTO[];
  diagnostics: CustomerDiagnosticDTO[];
  healthScore: HealthResult | null;
  versions: VersionInfo | null;
  featureFlags: FeatureFlagInfo[] | null;
  folios: FolioInfo | null;
  queues: QueueProcessInfo[] | null;
  microservices: MicroserviceInfo[] | null;
  raw: unknown;
}
