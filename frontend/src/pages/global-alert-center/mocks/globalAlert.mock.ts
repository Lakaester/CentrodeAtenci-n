import type { CriticalAlertDTO, ActiveIncidentDTO, InfrastructureAlertDTO, QueueAlertDTO, ElectronicBillingAlertDTO, DeploymentAlertDTO, SlaBreachDTO, SystemNotificationDTO, GlobalAlertSummaryDTO, AlertSeverity, AlertStatus, IncidentPriority } from "../dto/globalAlert.dto";
const n = Date.now(); const ago = (m: number) => new Date(n - m * 60000).toISOString();
const P = "production" as const; const C = "critical" as const; const H = "high" as const; const M = "medium" as const; const L = "low" as const;
const O = "open" as const; const A = "acknowledged" as const; const R = "resolved" as const; const S = "suppressed" as const;
const INF = "infrastructure" as const; const APP = "application" as const; const SYS = "system" as const;

export const MOCK_CRITICAL: CriticalAlertDTO[] = Array.from({ length: 20 }, (_, i) => ({
  id: `CA-${String(i + 1).padStart(3, "0")}`, title: ["Payment Gateway Down", "DB Replication Lag", "Auth Service Failing", "High Latency Checkout", "DNS Resolution Failures", "Memory Leak Detected", "SSL Certificate Expiring", "Disk Space Critical", "CPU Overload", "Network Partition", "Container CrashLoop", "API Rate Limiting", "Search Index Corrupted", "Cache Cluster Unhealthy", "Backup Job Failed", "K8s Node NotReady", "Log Shipping Stopped", "Monitoring Alert Storm", "Webhook Delivery Failed", "Secret Rotation Failed"][i],
  description: `Alert description ${i + 1}`, severity: [C, C, H, H, C, H, M, C, H, C, H, M, H, C, H, C, M, L, H, M][i],
  source: [INF, INF, APP, APP, INF, APP, SYS, INF, INF, INF, INF, APP, APP, INF, SYS, INF, SYS, SYS, APP, SYS][i],
  environment: P, status: [O, A, O, A, O, A, R, O, A, O, A, R, O, O, A, O, R, S, O, A][i],
  detectedAt: ago(i * 5 + 1), acknowledgedAt: i % 2 === 0 ? ago(i * 5) : null, resolvedAt: i % 3 === 0 ? ago(i * 3) : null, owner: ["Maria", "Carlos", "Ana", "Jorge", "Sofia", "Diego", "Maria", "Carlos", "Ana", "Jorge", "Sofia", "Diego", "Maria", "Carlos", "Ana", "Jorge", "Sofia", "Diego", "Maria", "Carlos"][i],
}));

export const MOCK_INCIDENTS: ActiveIncidentDTO[] = Array.from({ length: 15 }, (_, i) => ({
  id: `INC-${String(i + 1).padStart(3, "0")}`, title: ["Payment Outage", "Checkout Latency", "Auth Degradation", "DB Sync Issue", "SMS Delivery Failed", "Search Unavailable", "Cache Warmup Failure", "Export Stalled", "Backup Missed", "SSL Renewal Pending", "DNS Propagation", "K8s Node Drain", "Log Index Full", "Monitoring Gap", "Secret Expired"][i],
  service: ["payment-service", "order-service", "auth-service", "sync-service", "notification-service", "search-service", "cache-service", "export-service", "backup-service", "gateway", "dns-service", "kubernetes", "logging-service", "monitoring", "security-service"][i],
  priority: ["P1", "P1", "P2", "P2", "P3", "P3", "P3", "P4", "P4", "P2", "P1", "P2", "P3", "P4", "P2"][i] as IncidentPriority,
  environment: P, status: [O, O, A, A, A, O, R, R, R, O, O, A, R, S, A][i] as AlertStatus,
  detectedAt: ago(i * 8 + 2), lead: ["Maria", "Carlos", "Ana", "Jorge", "Sofia", "Diego", "Maria", "Carlos", "Ana", "Jorge", "Sofia", "Diego", "Maria", "Carlos", "Ana"][i], affectedCustomers: Math.floor(Math.random() * 500) + 10,
}));

export const MOCK_INFRA_ALERTS: InfrastructureAlertDTO[] = Array.from({ length: 25 }, (_, i) => ({
  id: `IA-${String(i + 1).padStart(3, "0")}`, service: ["api-gateway", "auth-service", "order-service", "payment-service", "cache-service", "db-primary", "search-service", "file-service", "notification-service", "billing-service"][i % 10],
  metric: ["cpu", "memory", "latency", "error-rate", "disk", "connections", "throughput", "disk-io", "network", "swap"][i % 10],
  severity: [C, H, M, L, C, H, M, L, H, M][i % 10] as AlertSeverity,
  environment: P, status: [O, A, R, S][i % 4] as AlertStatus,
  value: Math.floor(Math.random() * 100), threshold: 80, detectedAt: ago(i * 3 + 1),
}));

export const MOCK_QUEUE_ALERTS: QueueAlertDTO[] = Array.from({ length: 20 }, (_, i) => ({
  id: `QA-${String(i + 1).padStart(3, "0")}`, queue: ["order-processing", "payment-confirmation", "notification-delivery", "email-sender", "data-sync", "file-processing", "webhook-delivery", "audit-log"][i % 8],
  metric: ["backlog", "latency", "failure-rate", "throughput", "age"][i % 5],
  severity: [C, H, M, L][i % 4] as AlertSeverity, status: [O, A, R, S][i % 4] as AlertStatus,
  currentValue: Math.floor(Math.random() * 1000), threshold: 500, detectedAt: ago(i * 4 + 1),
}));

export const MOCK_BILLING_ALERTS: ElectronicBillingAlertDTO[] = Array.from({ length: 20 }, (_, i) => ({
  id: `BA-${String(i + 1).padStart(3, "0")}`, country: ["Peru", "Chile", "Colombia", "Mexico"][i % 4],
  documentType: ["INVOICE", "CREDIT_NOTE", "DEBIT_NOTE", "RECEIPT"][i % 4],
  severity: [C, H, M, L][i % 4] as AlertSeverity, environment: P, status: [O, A, R, S][i % 4] as AlertStatus,
  errorCode: ["2000", "2011", "2335", "2407", "3022", "4015", "5020", "6033"][i % 8], detectedAt: ago(i * 6 + 2),
}));

export const MOCK_DEPLOY_ALERTS: DeploymentAlertDTO[] = Array.from({ length: 15 }, (_, i) => ({
  id: `DA-${String(i + 1).padStart(3, "0")}`, service: ["api-gateway", "auth-service", "order-service", "payment-service", "notification-service", "search-service", "cache-service", "billing-service", "file-service", "reporting-service"][i % 10],
  version: `v${(i % 4) + 3}.${(i % 13)}.${(i % 5)}`, environment: P,
  severity: [C, H, M, L][i % 4] as AlertSeverity, status: [O, A, R, S][i % 4] as AlertStatus,
  reason: ["Rollback required", "Health check failed", "Migration error", "Config mismatch", "Dependency failure", "Timeout exceeded", "Memory leak", "DB schema conflict", "SSL error", "Permission denied", "Artifact not found", "Deploy timeout", "Insufficient resources", "Network error", "Invalid manifest"][i],
  detectedAt: ago(i * 10 + 3),
}));

export const MOCK_SLA: SlaBreachDTO[] = Array.from({ length: 18 }, (_, i) => ({
  id: `SLA-${String(i + 1).padStart(3, "0")}`, ticketId: `TKT-${String(1000 + i)}`, customer: ["Restaurant.pe HQ", "Santiago Branch", "Bogota Branch", "CDMX Branch", "Arequipa Branch", "Cusco Branch", "Trujillo Branch", "Valparaiso Branch"][i % 8],
  severity: [C, H, M, L][i % 4] as AlertSeverity, environment: P, status: [O, A, R, S][i % 4] as AlertStatus,
  minutesOverdue: (i + 1) * 15, detectedAt: ago(i * 12 + 4),
}));

export const MOCK_NOTIFICATIONS: SystemNotificationDTO[] = Array.from({ length: 30 }, (_, i) => ({
  id: `NOTIF-${String(i + 1).padStart(3, "0")}`, title: ["Deployment completed", "Certificate renewed", "Backup finished", "License expiring", "Maintenance scheduled", "Update available", "Report generated", "Audit completed", "Config changed", "User invited"][i % 10],
  message: `Notification message ${i + 1}`, type: (["info", "success", "warning", "error"] as const)[i % 4],
  source: ["System", "Security", "Operations", "Billing", "Infrastructure", "Platform"][i % 6],
  createdAt: ago(i * 2 + 1), read: i % 3 !== 0,
}));

export const MOCK_SUMMARY: GlobalAlertSummaryDTO = {
  criticalAlerts: 20, activeIncidents: 15, infrastructureAlerts: 25,
  queueAlerts: 20, billingAlerts: 20, deploymentAlerts: 15,
  slaBreaches: 18, systemNotifications: 30,
};

