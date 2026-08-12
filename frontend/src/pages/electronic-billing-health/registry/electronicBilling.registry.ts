import type { SunatStatus, DocumentStatus, CertificateStatus, LicenseStatus, ValidationSeverity, EnvironmentType } from "../dto/electronicBilling.dto";

export const SUNAT_STATUS_CONFIG: Record<SunatStatus, { label: string; color: string; order: number }> = {
  online:      { label: "Online",      color: "text-success bg-success-5", order: 0 },
  degraded:    { label: "Degraded",    color: "text-warning bg-warning-5",     order: 1 },
  offline:     { label: "Offline",     color: "text-danger bg-danger-5",       order: 2 },
  maintenance: { label: "Maintenance", color: "text-primary bg-primary-5",       order: 3 },
};

export const DOCUMENT_STATUS_CONFIG: Record<DocumentStatus, { label: string; color: string }> = {
  pending:    { label: "Pending",    color: "text-warning bg-warning-5" },
  processing: { label: "Processing", color: "text-primary bg-primary-5" },
  accepted:   { label: "Accepted",   color: "text-success bg-success-5" },
  rejected:   { label: "Rejected",   color: "text-danger bg-danger-5" },
};

export const CERTIFICATE_STATUS_CONFIG: Record<CertificateStatus, { label: string; color: string }> = {
  valid:    { label: "Valid",    color: "text-success bg-success-5" },
  expiring: { label: "Expiring", color: "text-warning bg-warning-5" },
  expired:  { label: "Expired",  color: "text-danger bg-danger-5" },
};

export const LICENSE_STATUS_CONFIG: Record<LicenseStatus, { label: string; color: string }> = {
  active:  { label: "Active",  color: "text-success bg-success-5" },
  warning: { label: "Warning", color: "text-warning bg-warning-5" },
  expired: { label: "Expired", color: "text-danger bg-danger-5" },
};

export const VALIDATION_SEVERITY_CONFIG: Record<ValidationSeverity, { label: string; color: string; order: number }> = {
  info:     { label: "Info",     color: "text-primary bg-primary-5",         order: 0 },
  warning:  { label: "Warning",  color: "text-warning bg-warning-5",       order: 1 },
  error:    { label: "Error",    color: "text-danger bg-danger-5",         order: 2 },
  critical: { label: "Critical", color: "text-white bg-danger",           order: 3 },
};

export const ENVIRONMENT_CONFIG: Record<EnvironmentType, { label: string; color: string }> = {
  production:  { label: "Production",  color: "text-danger bg-danger-5" },
  staging:     { label: "Staging",     color: "text-warning bg-warning-5" },
  qa:          { label: "QA",          color: "text-primary bg-primary-5" },
  development: { label: "Development", color: "text-black-45 bg-black-5" },
};
