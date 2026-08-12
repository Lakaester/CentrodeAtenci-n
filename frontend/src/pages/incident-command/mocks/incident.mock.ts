import type { IncidentDTO, AffectedServiceDTO, AffectedCustomerDTO, IncidentTimelineDTO, EscalationDTO, WarRoomDTO, CommunicationDTO, IncidentActionDTO, IncidentSummaryDTO } from "../dto/incident.dto";

const n = Date.now();
const ago = (m: number) => new Date(n - m * 60000).toISOString();
const C = "critical" as const; const H = "high" as const; const M = "medium" as const; const L = "low" as const;
const PROD = "production" as const; const STG = "staging" as const;

export const MOCK_INCIDENTS: IncidentDTO[] = [
  { id: "INC-001", title: "Payment Gateway Outage",       description: "Payment API returning 503 errors. Users unable to complete transactions.", severity: C, status: "investigating", environment: PROD, service: "payment-service", region: "pe-lim", detectedAt: ago(15), acknowledgedAt: ago(12), resolvedAt: null, mtta: 3, mttr: null, lead: "María López", warRoomId: "WR-001" },
  { id: "INC-002", title: "High Latency on Checkout",     description: "Checkout flow taking >30s. Impacting all regions.", severity: H, status: "identified", environment: PROD, service: "order-service", region: "pe-lim", detectedAt: ago(45), acknowledgedAt: ago(42), resolvedAt: null, mtta: 3, mttr: null, lead: "Carlos Ruiz", warRoomId: "WR-001" },
  { id: "INC-003", title: "Database Replication Lag",     description: "Secondary DB replica >5min behind primary. Risk of stale reads.", severity: H, status: "monitoring", environment: PROD, service: "database-primary", region: "pe-lim", detectedAt: ago(120), acknowledgedAt: ago(115), resolvedAt: null, mtta: 5, mttr: null, lead: "Jorge Castillo", warRoomId: "WR-002" },
  { id: "INC-004", title: "Auth Service Degraded",        description: "Login failures increasing by 300%. Intermittent 401 errors.", severity: C, status: "open", environment: PROD, service: "auth-service", region: "pe-lim", detectedAt: ago(5), acknowledgedAt: null, resolvedAt: null, mtta: null, mttr: null, lead: "Ana Martínez", warRoomId: null },
  { id: "INC-005", title: "SMS Delivery Failing",         description: "WhatsApp/SMS provider returning errors. Notifications delayed.", severity: M, status: "resolved", environment: PROD, service: "notification-service", region: "pe-lim", detectedAt: ago(240), acknowledgedAt: ago(238), resolvedAt: ago(180), mtta: 2, mttr: 60, lead: "Sofía Vega", warRoomId: null },
  { id: "INC-006", title: "CDN Cache Purge Failed",       description: "Static assets serving stale versions. Users seeing outdated UI.", severity: M, status: "resolved", environment: PROD, service: "cdn-service", region: "cl-scl", detectedAt: ago(360), acknowledgedAt: ago(355), resolvedAt: ago(300), mtta: 5, mttr: 60, lead: "Diego Ramos", warRoomId: null },
  { id: "INC-007", title: "API Rate Limiting Issues",     description: "Rate limiter blocking legitimate traffic. False positives on gateway.", severity: H, status: "identified", environment: PROD, service: "api-gateway", region: "pe-lim", detectedAt: ago(60), acknowledgedAt: ago(57), resolvedAt: null, mtta: 3, mttr: null, lead: "Carlos Ruiz", warRoomId: "WR-001" },
  { id: "INC-008", title: "Search Index Outdated",        description: "Search results not reflecting recent data. Index rebuild stalled.", severity: M, status: "monitoring", environment: PROD, service: "search-service", region: "pe-cus", detectedAt: ago(180), acknowledgedAt: ago(178), resolvedAt: null, mtta: 2, mttr: null, lead: "Jorge Castillo", warRoomId: null },
  { id: "INC-009", title: "Backup Job Failure",           description: "Automated backup not completing. Last successful backup 12h ago.", severity: H, status: "investigating", environment: PROD, service: "backup-service", region: "pe-aqp", detectedAt: ago(30), acknowledgedAt: ago(28), resolvedAt: null, mtta: 2, mttr: null, lead: "María López", warRoomId: null },
  { id: "INC-010", title: "Memory Leak on Cache Nodes",   description: "Redis cluster memory utilization at 92%. Rolling restart needed.", severity: H, status: "identified", environment: PROD, service: "cache-service", region: "pe-trj", detectedAt: ago(90), acknowledgedAt: ago(88), resolvedAt: null, mtta: 2, mttr: null, lead: "Jorge Castillo", warRoomId: null },
  { id: "INC-011", title: "SSL Certificate Expiring",     description: "Wildcard cert expires in 48h. Renewal not triggered.", severity: H, status: "open", environment: PROD, service: "api-gateway", region: "pe-lim", detectedAt: ago(10), acknowledgedAt: null, resolvedAt: null, mtta: null, mttr: null, lead: "Diego Ramos", warRoomId: null },
  { id: "INC-012", title: "Staging Environment Down",      description: "Staging cluster unreachable. CI/CD pipeline blocked.", severity: M, status: "resolved", environment: STG, service: "kubernetes-cluster", region: "pe-lim", detectedAt: ago(480), acknowledgedAt: ago(475), resolvedAt: ago(420), mtta: 5, mttr: 60, lead: "Sofía Vega", warRoomId: null },
  { id: "INC-013", title: "Invoice Generation Failed",    description: "Batch invoice job failing with null pointer. 5k invoices pending.", severity: H, status: "identified", environment: PROD, service: "billing-service", region: "cl-scl", detectedAt: ago(100), acknowledgedAt: ago(97), resolvedAt: null, mtta: 3, mttr: null, lead: "Ana Martínez", warRoomId: "WR-003" },
  { id: "INC-014", title: "Webhook Delivery Degraded",    description: "Webhook success rate dropped to 60%. Retry queue growing.", severity: M, status: "monitoring", environment: PROD, service: "notification-service", region: "pe-lim", detectedAt: ago(200), acknowledgedAt: ago(198), resolvedAt: null, mtta: 2, mttr: null, lead: "Carlos Ruiz", warRoomId: null },
  { id: "INC-015", title: "DNS Resolution Failures",      description: "Multiple regions reporting DNS timeouts. Route53 health check failing.", severity: C, status: "open", environment: PROD, service: "dns-service", region: "mx-cdmx", detectedAt: ago(3), acknowledgedAt: null, resolvedAt: null, mtta: null, mttr: null, lead: "María López", warRoomId: null },
  { id: "INC-016", title: "File Upload Broken",           description: "File service returning 413 errors for files >5MB.", severity: M, status: "resolved", environment: PROD, service: "file-service", region: "pe-trj", detectedAt: ago(600), acknowledgedAt: ago(597), resolvedAt: ago(540), mtta: 3, mttr: 60, lead: "Jorge Castillo", warRoomId: null },
  { id: "INC-017", title: "Monitoring Alert Storm",       description: "Prometheus alerts firing incorrectly. Noise ratio >80%.", severity: L, status: "resolved", environment: PROD, service: "monitoring-service", region: "pe-lim", detectedAt: ago(1440), acknowledgedAt: ago(1435), resolvedAt: ago(1380), mtta: 5, mttr: 60, lead: "Diego Ramos", warRoomId: null },
  { id: "INC-018", title: "Customer Data Export Failed",  description: "Scheduled export job failing. Impacting BI dashboards.", severity: M, status: "investigating", environment: PROD, service: "reporting-service", region: "pe-cus", detectedAt: ago(35), acknowledgedAt: ago(33), resolvedAt: null, mtta: 2, mttr: null, lead: "Ana Martínez", warRoomId: null },
  { id: "INC-019", title: "Kubernetes Node Failure",      description: "Worker node in pe-aks-01 unhealthy. Pods rescheduling.", severity: H, status: "monitoring", environment: PROD, service: "kubernetes-cluster", region: "co-bog", detectedAt: ago(75), acknowledgedAt: ago(72), resolvedAt: null, mtta: 3, mttr: null, lead: "Jorge Castillo", warRoomId: "WR-004" },
  { id: "INC-020", title: "Log Shipping Delayed",         description: "ELK stack not receiving logs from 3 services. Debugging impaired.", severity: L, status: "open", environment: PROD, service: "logging-service", region: "pe-lim", detectedAt: ago(20), acknowledgedAt: null, resolvedAt: null, mtta: null, mttr: null, lead: "Sofía Vega", warRoomId: null },
];

export const MOCK_SERVICES: AffectedServiceDTO[] = [
  { id: "SV-001", incidentId: "INC-001", name: "Payment API",       status: "down",    impact: "All payments failing",   since: ago(15), restoredAt: null },
  { id: "SV-002", incidentId: "INC-001", name: "Payment Gateway",   status: "down",    impact: "3rd party connection lost", since: ago(15), restoredAt: null },
  { id: "SV-003", incidentId: "INC-002", name: "Checkout Service",  status: "degraded", impact: "Latency >30s",            since: ago(45), restoredAt: null },
  { id: "SV-004", incidentId: "INC-003", name: "PostgreSQL Replica",status: "degraded", impact: "Replication lag 5min",    since: ago(120), restoredAt: null },
  { id: "SV-005", incidentId: "INC-004", name: "Auth Service",      status: "degraded", impact: "401 errors increasing",   since: ago(5),  restoredAt: null },
  { id: "SV-006", incidentId: "INC-005", name: "SMS Provider",     status: "healthy",  impact: "Restored",                since: ago(240), restoredAt: ago(180) },
  { id: "SV-007", incidentId: "INC-006", name: "CDN Edge",         status: "healthy",  impact: "Cache purged",           since: ago(360), restoredAt: ago(300) },
  { id: "SV-008", incidentId: "INC-007", name: "API Gateway",      status: "degraded", impact: "Rate limiting false positives", since: ago(60), restoredAt: null },
  { id: "SV-009", incidentId: "INC-008", name: "Elasticsearch",    status: "degraded", impact: "Index rebuild stalled",   since: ago(180), restoredAt: null },
  { id: "SV-010", incidentId: "INC-010", name: "Redis Cluster",    status: "degraded", impact: "Memory 92%",              since: ago(90), restoredAt: null },
  { id: "SV-011", incidentId: "INC-013", name: "Billing API",      status: "degraded", impact: "Invoice job failing",     since: ago(100), restoredAt: null },
  { id: "SV-012", incidentId: "INC-014", name: "Webhook Endpoint", status: "degraded", impact: "60% success rate",        since: ago(200), restoredAt: null },
  { id: "SV-013", incidentId: "INC-015", name: "DNS Resolver",     status: "down",    impact: "Timeouts in CDMX",        since: ago(3),  restoredAt: null },
  { id: "SV-014", incidentId: "INC-019", name: "AKS Worker Node",  status: "degraded", impact: "Node unhealthy",          since: ago(75), restoredAt: null },
  { id: "SV-015", incidentId: "INC-020", name: "Log Shipper",      status: "down",    impact: "Logs not reaching ELK",   since: ago(20), restoredAt: null },
];

export const MOCK_CUSTOMERS: AffectedCustomerDTO[] = Array.from({ length: 30 }, (_, i) => ({
  id: `CUST-${String(i + 1).padStart(3, "0")}`, incidentId: i < 10 ? "INC-001" : i < 20 ? "INC-002" : "INC-004",
  name: ["Restaurant.pe HQ", "Santiago Branch", "Bogotá Branch", "CDMX Branch", "Arequipa Branch", "Cusco Branch", "Trujillo Branch", "Valparaíso Branch", "Medellín Office", "Guadalajara Office", "Lima Norte", "Lima Sur", "Callao", "Miraflores", "San Isidro", "Los Olivos", "San Borja", "Surco", "La Molina", "Jesús María", "San Miguel", "Pueblo Libre", "Magdalena", "Lince", "Barranco", "Chorrillos", "San Juan de Lurigancho", "Comas", "Villa El Salvador", "San Martín de Porres"][i],
  segment: i < 10 ? "Enterprise" : i < 20 ? "Business" : "Standard",
  tickets: (i % 10 + 1) * 5,
  impact: i < 10 ? "Cannot process payments" : i < 20 ? "Checkout degraded" : "Login errors",
}));

export const MOCK_TIMELINES: IncidentTimelineDTO[] = Array.from({ length: 40 }, (_, i) => ({
  id: `TL-${String(i + 1).padStart(3, "0")}`,
  incidentId: ["INC-001", "INC-002", "INC-003", "INC-004", "INC-005"][i % 5],
  timestamp: ago(i * 3 + 1),
  eventType: ["detected", "acknowledged", "investigating", "identified", "escalated", "monitoring", "resolved", "note"][i % 8],
  title: ["Incident detected", "Incident acknowledged", "Investigation started", "Root cause identified", "Escalation triggered", "Monitoring active", "Incident resolved", "Update posted"][i % 8],
  description: `Timeline event ${i + 1} for incident tracking`,
  actor: ["Maria López", "Carlos Ruiz", "Ana Martínez", "Jorge Castillo", "Sistema", "Sofía Vega", "Diego Ramos", "María López"][i % 8],
  actorRole: ["Lead", "Engineer", "Engineer", "Engineer", "System", "Engineer", "Engineer", "Lead"][i % 8],
}));

export const MOCK_ESCALATIONS: EscalationDTO[] = [
  { id: "ESC-001", incidentId: "INC-001", level: "L1", escalatedTo: "María López",     escalatedBy: "Sistema",   reason: "Critical incident detected",     createdAt: ago(14), resolvedAt: ago(12) },
  { id: "ESC-002", incidentId: "INC-001", level: "L2", escalatedTo: "Jorge Castillo",   escalatedBy: "María López", reason: "Root cause not identified",   createdAt: ago(10), resolvedAt: ago(8) },
  { id: "ESC-003", incidentId: "INC-001", level: "Engineering", escalatedTo: "Engineering Lead", escalatedBy: "Jorge Castillo", reason: "Database migration required", createdAt: ago(7),  resolvedAt: null },
  { id: "ESC-004", incidentId: "INC-002", level: "L1", escalatedTo: "Carlos Ruiz",     escalatedBy: "Sistema",   reason: "High latency alert",           createdAt: ago(44), resolvedAt: ago(42) },
  { id: "ESC-005", incidentId: "INC-002", level: "L2", escalatedTo: "Ana Martínez",     escalatedBy: "Carlos Ruiz", reason: "Query optimization needed",     createdAt: ago(40), resolvedAt: ago(35) },
  { id: "ESC-006", incidentId: "INC-003", level: "Engineering", escalatedTo: "Jorge Castillo", escalatedBy: "Sistema", reason: "Replication lag critical",     createdAt: ago(118), resolvedAt: ago(115) },
  { id: "ESC-007", incidentId: "INC-004", level: "L1", escalatedTo: "Ana Martínez",     escalatedBy: "Sistema",   reason: "Auth failure spike",           createdAt: ago(4),  resolvedAt: null },
  { id: "ESC-008", incidentId: "INC-004", level: "L2", escalatedTo: "Engineering Lead", escalatedBy: "Ana Martínez", reason: "Auth token validation issue",    createdAt: ago(3),  resolvedAt: null },
  { id: "ESC-009", incidentId: "INC-007", level: "L1", escalatedTo: "Carlos Ruiz",     escalatedBy: "Sistema",   reason: "Gateway errors detected",      createdAt: ago(59), resolvedAt: ago(57) },
  { id: "ESC-010", incidentId: "INC-009", level: "L1", escalatedTo: "María López",     escalatedBy: "Sistema",   reason: "Backup job failure",           createdAt: ago(29), resolvedAt: ago(28) },
  { id: "ESC-011", incidentId: "INC-011", level: "L1", escalatedTo: "Diego Ramos",     escalatedBy: "Sistema",   reason: "SSL cert expiring",            createdAt: ago(9),  resolvedAt: null },
  { id: "ESC-012", incidentId: "INC-013", level: "L1", escalatedTo: "Ana Martínez",     escalatedBy: "Sistema",   reason: "Invoice generation failing",   createdAt: ago(99), resolvedAt: ago(97) },
  { id: "ESC-013", incidentId: "INC-015", level: "Executive", escalatedTo: "CTO",            escalatedBy: "María López", reason: "DNS outage affecting CDMX",    createdAt: ago(2),  resolvedAt: null },
  { id: "ESC-014", incidentId: "INC-019", level: "L2", escalatedTo: "Jorge Castillo",   escalatedBy: "Sistema",   reason: "K8s node failure",             createdAt: ago(74), resolvedAt: ago(72) },
  { id: "ESC-015", incidentId: "INC-019", level: "Engineering", escalatedTo: "Platform Lead", escalatedBy: "Jorge Castillo", reason: "Node replacement needed",     createdAt: ago(70), resolvedAt: null },
];

export const MOCK_WAR_ROOMS: WarRoomDTO[] = [
  { id: "WR-001", incidentId: "INC-001", name: "Payment Outage",     status: "active",  leader: "María López",  members: 6,  startedAt: ago(14),  lastActivity: ago(1) },
  { id: "WR-002", incidentId: "INC-003", name: "DB Replication",     status: "active",  leader: "Jorge Castillo", members: 4,  startedAt: ago(118), lastActivity: ago(2) },
  { id: "WR-003", incidentId: "INC-013", name: "Invoice Crisis",     status: "active",  leader: "Ana Martínez",  members: 3,  startedAt: ago(98),  lastActivity: ago(5) },
  { id: "WR-004", incidentId: "INC-019", name: "K8s Node Recovery",  status: "active",  leader: "Jorge Castillo", members: 3,  startedAt: ago(73),  lastActivity: ago(3) },
  { id: "WR-005", incidentId: "INC-002", name: "Checkout Latency",   status: "standby", leader: "Carlos Ruiz",   members: 4,  startedAt: ago(43),  lastActivity: ago(30) },
  { id: "WR-006", incidentId: "INC-004", name: "Auth Crisis",        status: "standby", leader: "Ana Martínez",  members: 3,  startedAt: ago(4),   lastActivity: ago(3) },
  { id: "WR-007", incidentId: "INC-005", name: "SMS Recovery",      status: "closed",  leader: "Sofía Vega",    members: 2,  startedAt: ago(238), lastActivity: ago(180) },
  { id: "WR-008", incidentId: "INC-006", name: "CDN Restoration",   status: "closed",  leader: "Diego Ramos",   members: 2,  startedAt: ago(358), lastActivity: ago(300) },
];

export const MOCK_COMMUNICATIONS: CommunicationDTO[] = Array.from({ length: 35 }, (_, i) => ({
  id: `COM-${String(i + 1).padStart(3, "0")}`,
  incidentId: ["INC-001", "INC-002", "INC-003", "INC-004", "INC-005"][i % 5],
  channel: (["slack", "email", "teams", "statuspage", "whatsapp"] as const)[i % 5],
  subject: `Update: ${["Payment Outage", "Checkout Latency", "DB Replication", "Auth Crisis", "SMS Recovery"][i % 5]} - ${["Initial notification", "Progress update", "Status report", "Resolution notice", "Follow-up"][i % 5]}`,
  sentTo: ["#incidents", "executive@restaurant.pe", "Operations Team", "status.restaurant.pe", "+51999000101"][i % 5],
  sentAt: ago(i * 2 + 1),
  status: (["sent", "sent", "sent", "pending", "failed"] as const)[i % 5],
}));

export const MOCK_ACTIONS: IncidentActionDTO[] = Array.from({ length: 25 }, (_, i) => ({
  id: `ACT-${String(i + 1).padStart(3, "0")}`,
  incidentId: ["INC-001", "INC-002", "INC-003", "INC-004", "INC-005"][i % 5],
  description: ["Investigate payment logs", "Check slow query plan", "Verify DB replication status", "Review auth token rotation", "Audit notification provider", "Scale up payment nodes", "Optimize checkout query", "Rebuild DB replica", "Update auth middleware", "Switch to backup provider", "Deploy hotfix", "Run DB migration", "Update rate limiter config", "Patch redis cluster", "Renew SSL certificate", "Restart log shipper", "Fix invoice job", "Reset webhook retry queue", "Update DNS records", "Replace K8s node", "Verify monitoring alert rules", "Purge CDN cache", "Update search index mapping", "Scale down staging", "Generate postmortem"][i],
  owner: ["María López", "Carlos Ruiz", "Jorge Castillo", "Ana Martínez", "Sofía Vega", "Diego Ramos", "María López", "Jorge Castillo", "Ana Martínez", "Carlos Ruiz", "María López", "Jorge Castillo", "Carlos Ruiz", "Jorge Castillo", "Diego Ramos", "Sofía Vega", "Ana Martínez", "Carlos Ruiz", "María López", "Jorge Castillo", "Diego Ramos", "Sofía Vega", "Jorge Castillo", "Diego Ramos", "María López"][i],
  priority: i < 10 ? "critical" : i < 18 ? "high" : "medium",
  status: i < 5 ? "completed" : i < 15 ? "in-progress" : "pending",
  dueAt: i < 20 ? ago(-120) : null,
  completedAt: i < 5 ? ago(30) : null,
}));

export const MOCK_SUMMARY: IncidentSummaryDTO = {
  activeIncidents: 12,
  criticalIncidents: 3,
  affectedServices: 15,
  affectedCustomers: 30,
  averageMTTA: 3,
  averageMTTR: 60,
  openEscalations: 7,
  activeWarRooms: 4,
};
