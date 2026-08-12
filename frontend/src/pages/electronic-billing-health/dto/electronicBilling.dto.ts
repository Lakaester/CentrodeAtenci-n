export type SunatStatus = "online" | "degraded" | "offline" | "maintenance";
export type DocumentStatus = "pending" | "processing" | "accepted" | "rejected";
export type CertificateStatus = "valid" | "expiring" | "expired";
export type LicenseStatus = "active" | "warning" | "expired";
export type ValidationSeverity = "info" | "warning" | "error" | "critical";
export type EnvironmentType = "production" | "staging" | "qa" | "development";

export interface ElectronicBillingSummaryDTO {
  sunatStatus: string; electronicDocuments: number; pendingDocuments: number;
  rejectedDocuments: number; certificatesOk: number; licensesActive: number;
  documentsPerMinute: number; validationErrors: number;
}

export interface SunatConnectivityDTO {
  id: string; country: string; endpoint: string; status: SunatStatus;
  environment: EnvironmentType; responseTime: number; lastCheck: string;
  availability: number;
}

export interface ElectronicDocumentDTO {
  id: string; documentType: string; series: string; number: string;
  status: DocumentStatus; environment: EnvironmentType; createdAt: string;
  sunatResponseTime: number; cdrCode: string | null;
}

export interface PendingDocumentDTO {
  id: string; documentType: string; series: string; number: string;
  queuedSince: string; retryCount: number; priority: "alta" | "media" | "baja";
}

export interface RejectedDocumentDTO {
  id: string; documentType: string; series: string; number: string;
  rejectedAt: string; errorCode: string; errorDescription: string;
  severity: ValidationSeverity;
}

export interface CertificateDTO {
  id: string; issuer: string; serialNumber: string; subject: string;
  status: CertificateStatus; issuedAt: string; expiresAt: string;
  daysRemaining: number; environment: EnvironmentType;
}

export interface LicenseDTO {
  id: string; customer: string; licenseType: string; status: LicenseStatus;
  activationDate: string; expirationDate: string; daysRemaining: number;
}

export interface BillingThroughputDTO {
  id: string; timestamp: string; documentsSent: number; documentsAccepted: number;
  documentsRejected: number; averageResponseTime: number;
}

export interface ValidationErrorDTO {
  id: string; documentType: string; series: string; number: string;
  errorCode: string; description: string; severity: ValidationSeverity;
  createdAt: string; resolved: boolean;
}
