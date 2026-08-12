import type { ReleaseDTO, DeploymentDTO, EnvironmentDTO, PipelineDTO, VersionDTO, RollbackDTO, DeploymentQueueDTO, ReleaseCalendarDTO, ReleaseSummaryDTO } from "../dto/release.dto";

const n = Date.now(); const ago = (m: number) => new Date(n - m * 60000).toISOString();
const P = "production" as const; const S = "staging" as const; const Q = "qa" as const; const D = "development" as const;
const COMP = "completed" as const; const FAIL = "failed" as const; const IP = "in_progress" as const; const PLAN = "planned" as const; const CANC = "cancelled" as const;

export const MOCK_RELEASES: ReleaseDTO[] = [
  { id: "REL-001", name: "Payment Gateway v4",       version: "v4.0.1",  status: COMP, environment: P, manager: "María López",  createdAt: ago(1440), completedAt: ago(1380), description: "Payment gateway upgrade" },
  { id: "REL-002", name: "Checkout Optimize",         version: "v3.13.0", status: COMP, environment: P, manager: "Carlos Ruiz", createdAt: ago(2880), completedAt: ago(2820), description: "Checkout flow optimization" },
  { id: "REL-003", name: "Auth Service Update",       version: "v3.12.4", status: FAIL, environment: P, manager: "Ana Martínez", createdAt: ago(720), completedAt: null, description: "Auth token rotation" },
  { id: "REL-004", name: "Notification Hotfix",       version: "v3.10.2", status: IP,   environment: S, manager: "Jorge Castillo", createdAt: ago(120), completedAt: null, description: "SMS provider fix" },
  { id: "REL-005", name: "Search Index Rebuild",      version: "v3.10.3", status: PLAN, environment: S, manager: "Sofía Vega",   createdAt: ago(60), completedAt: null, description: "Search index update" },
  { id: "REL-006", name: "DB Migration v2",           version: "v2.1.0",  status: COMP, environment: P, manager: "Jorge Castillo", createdAt: ago(4320), completedAt: ago(4260), description: "Database migration" },
  { id: "REL-007", name: "API Gateway Hotfix",        version: "v4.0.2",  status: IP,   environment: Q, manager: "María López",  createdAt: ago(240), completedAt: null, description: "Rate limiting fix" },
  { id: "REL-008", name: "Redis Upgrade",             version: "v3.13.1", status: PLAN, environment: D, manager: "Carlos Ruiz", createdAt: ago(30), completedAt: null, description: "Redis cluster upgrade" },
  { id: "REL-009", name: "Reporting Service v3",      version: "v3.0.0",  status: FAIL, environment: S, manager: "Ana Martínez", createdAt: ago(960), completedAt: null, description: "Reporting overhaul" },
  { id: "REL-010", name: "Billing System Update",     version: "v4.0.1",  status: COMP, environment: P, manager: "Carlos Ruiz", createdAt: ago(5760), completedAt: ago(5700), description: "Billing improvements" },
  { id: "REL-011", name: "Cache Layer Optimization",   version: "v3.13.2", status: IP,   environment: S, manager: "Jorge Castillo", createdAt: ago(360), completedAt: null, description: "Cache optimizations" },
  { id: "REL-012", name: "Monitoring Upgrade",         version: "v2.2.0",  status: PLAN, environment: P, manager: "Diego Ramos", createdAt: ago(15), completedAt: null, description: "Monitoring stack upgrade" },
  { id: "REL-013", name: "Security Patch Jan",        version: "v1.0.1",  status: COMP, environment: P, manager: "Sofía Vega",   createdAt: ago(10080), completedAt: ago(10020), description: "Security patches" },
  { id: "REL-014", name: "File Service Update",       version: "v3.11.1", status: COMP, environment: P, manager: "Diego Ramos", createdAt: ago(7200), completedAt: ago(7140), description: "File upload improvements" },
  { id: "REL-015", name: "Staging Environment Reset",  version: "v3.12.5", status: COMP, environment: S, manager: "Sofía Vega",   createdAt: ago(1440), completedAt: ago(1380), description: "Staging cleanup" },
  { id: "REL-016", name: "Analytics Pipeline v2",     version: "v2.0.0",  status: FAIL, environment: Q, manager: "Jorge Castillo", createdAt: ago(480), completedAt: null, description: "Analytics upgrade" },
  { id: "REL-017", name: "Webhook Service Update",     version: "v3.10.3", status: CANC, environment: D, manager: "Carlos Ruiz", createdAt: ago(240), completedAt: ago(200), description: "Webhook improvements cancelled" },
  { id: "REL-018", name: "K8s Node Update",            version: "v1.24.5", status: PLAN, environment: S, manager: "Jorge Castillo", createdAt: ago(45), completedAt: null, description: "Kubernetes node update" },
  { id: "REL-019", name: "Backup Service Migration",   version: "v2.0.1",  status: IP,   environment: P, manager: "Diego Ramos", createdAt: ago(180), completedAt: null, description: "Backup migration" },
  { id: "REL-020", name: "Logging Stack Update",       version: "v7.15.0", status: COMP, environment: P, manager: "Sofía Vega",   createdAt: ago(4320), completedAt: ago(4260), description: "ELK stack update" },
  { id: "REL-021", name: "CDN Config Change",          version: "v1.0.0",  status: COMP, environment: P, manager: "María López",  createdAt: ago(2160), completedAt: ago(2100), description: "CDN configuration" },
  { id: "REL-022", name: "Search v4 Beta",             version: "v4.0.0",  status: IP,   environment: Q, manager: "Sofía Vega",   createdAt: ago(600), completedAt: null, description: "Search version 4 beta" },
  { id: "REL-023", name: "Export Service Fix",         version: "v3.11.2", status: CANC, environment: D, manager: "Diego Ramos", createdAt: ago(120), completedAt: ago(90), description: "Export fix cancelled" },
  { id: "REL-024", name: "SMS Provider Migration",     version: "v3.10.3", status: PLAN, environment: S, manager: "Carlos Ruiz", createdAt: ago(10), completedAt: null, description: "SMS provider migration" },
  { id: "REL-025", name: "Rate Limiter Config",        version: "v1.1.0",  status: COMP, environment: P, manager: "María López",  createdAt: ago(1440), completedAt: ago(1390), description: "Rate limiter configuration" },
];

export const MOCK_DEPLOYMENTS: DeploymentDTO[] = Array.from({ length: 40 }, (_, i) => ({
  id: `DEP-${String(i + 1).padStart(3, "0")}`,
  releaseId: `REL-${String((i % 25) + 1).padStart(3, "0")}`,
  service: ["api-gateway", "auth-service", "order-service", "payment-service", "notification-service", "search-service", "cache-service", "billing-service", "file-service", "reporting-service"][i % 10],
  version: `v${(i % 4) + 3}.${(i % 13)}.${(i % 5)}`,
  environment: [P, S, Q, D][i % 4],
  status: (["success", "success", "success", "failed", "rollback"] as const)[i % 5],
  startedAt: ago(i * 60 + 10),
  finishedAt: i % 5 !== 3 ? ago(i * 60 + 5) : null,
  duration: i % 5 !== 3 ? (i % 20) + 3 : null,
}));

export const MOCK_ENVIRONMENTS: EnvironmentDTO[] = [
  { id: "env-001", name: "Production Lima",     type: P, region: "pe-lim", currentVersion: "v4.0.1",  status: "healthy",  lastDeployment: ago(120) },
  { id: "env-002", name: "Production Santiago", type: P, region: "cl-scl", currentVersion: "v3.13.0", status: "healthy",  lastDeployment: ago(240) },
  { id: "env-003", name: "Production Bogotá",   type: P, region: "co-bog", currentVersion: "v3.12.4", status: "degraded", lastDeployment: ago(360) },
  { id: "env-004", name: "Staging Lima",        type: S, region: "pe-lim", currentVersion: "v3.13.0", status: "healthy",  lastDeployment: ago(60) },
  { id: "env-005", name: "Staging Santiago",    type: S, region: "cl-scl", currentVersion: "v3.13.0", status: "degraded", lastDeployment: ago(120) },
  { id: "env-006", name: "QA Cluster 1",         type: Q, region: "pe-lim", currentVersion: "v3.14.0", status: "healthy",  lastDeployment: ago(30) },
  { id: "env-007", name: "QA Cluster 2",         type: Q, region: "pe-aqp", currentVersion: "v3.14.0", status: "healthy",  lastDeployment: ago(45) },
  { id: "env-008", name: "Dev Lima",             type: D, region: "pe-lim", currentVersion: "v3.15.0", status: "healthy",  lastDeployment: ago(10) },
  { id: "env-009", name: "Dev Arequipa",         type: D, region: "pe-aqp", currentVersion: "v3.15.0", status: "down",     lastDeployment: ago(120) },
  { id: "env-010", name: "Production CDMX",      type: P, region: "mx-cdmx", currentVersion: "v3.12.4", status: "healthy", lastDeployment: ago(480) },
  { id: "env-011", name: "Staging Bogotá",       type: S, region: "co-bog", currentVersion: "v3.13.0", status: "healthy", lastDeployment: ago(180) },
  { id: "env-012", name: "Production Cusco",     type: P, region: "pe-cus", currentVersion: "v3.11.0", status: "degraded", lastDeployment: ago(720) },
];

export const MOCK_PIPELINES: PipelineDTO[] = Array.from({ length: 18 }, (_, i) => ({
  id: `PIPE-${String(i + 1).padStart(3, "0")}`,
  name: ["Build & Test", "Deploy to Dev", "Integration Tests", "Deploy to QA", "Performance Tests", "Deploy to Staging", "Smoke Tests", "Deploy to Prod", "Rollback Pipeline"][i % 9],
  status: (["running", "waiting", "success", "failed", "paused", "success", "success", "success", "running"] as const)[i],
  branch: ["main", "develop", "release/v4", "hotfix/auth", "feature/search-v4"][i % 5],
  commitSha: `a1b2c${(i + 100).toString(16)}`,
  startedAt: ago(i * 120 + 5),
  duration: i % 4 === 0 ? null : (i % 30) + 5,
  triggeredBy: ["María López", "Carlos Ruiz", "Ana Martínez", "Jorge Castillo", "Sistema"][i % 5],
}));

export const MOCK_VERSIONS: VersionDTO[] = Array.from({ length: 30 }, (_, i) => ({
  id: `VER-${String(i + 1).padStart(3, "0")}`,
  service: ["api-gateway", "auth-service", "order-service", "payment-service", "notification-service", "cache-service", "search-service", "billing-service", "file-service", "reporting-service"][i % 10],
  version: `v${(i % 4) + 3}.${(i % 13)}.${(i % 5)}`,
  type: (["stable", "stable", "candidate", "beta", "hotfix"] as const)[i % 5],
  environment: [P, S, Q, D][i % 4],
  deployedAt: ago(i * 240 + 10),
  deployedBy: ["María López", "Carlos Ruiz", "Ana Martínez", "Jorge Castillo", "Sofía Vega", "Diego Ramos"][i % 6],
}));

export const MOCK_ROLLBACKS: RollbackDTO[] = Array.from({ length: 15 }, (_, i) => ({
  id: `RB-${String(i + 1).padStart(3, "0")}`,
  releaseId: `REL-${String((i % 10) + 1).padStart(3, "0")}`,
  service: ["api-gateway", "auth-service", "payment-service", "notification-service", "order-service"][i % 5],
  fromVersion: `v${(i % 4) + 3}.${(i % 13)}.${(i % 5)}`,
  toVersion: `v${(i % 4) + 3}.${(i % 13)}.${((i % 5) - 1 + 5) % 5}`,
  status: (["executed", "executed", "pending", "cancelled"] as const)[i % 4],
  reason: ["Performance regression", "Memory leak detected", "Incorrect config", "Breaking change", "Security vulnerability", "Data migration error", "API contract change", "Timeout increase", "Rollback test", "Dependency issue", "SSL cert mismatch", "DB schema conflict", "Rate limit too strict", "CORS configuration", "Logging level change"][i],
  executedAt: i % 2 === 0 ? ago(i * 120 + 5) : null,
  executedBy: ["María López", "Carlos Ruiz", "Ana Martínez", "Jorge Castillo", "Sofía Vega"][i % 5],
}));

export const MOCK_QUEUE: DeploymentQueueDTO[] = Array.from({ length: 20 }, (_, i) => ({
  id: `QUEUE-${String(i + 1).padStart(3, "0")}`,
  service: ["api-gateway", "auth-service", "order-service", "payment-service", "cache-service", "search-service", "billing-service", "file-service"][i % 8],
  version: `v${(i % 4) + 3}.${(i % 13)}.${(i % 5)}`,
  environment: [P, S, Q, D][i % 4],
  status: (["queued", "queued", "processing", "completed", "failed"] as const)[i % 5],
  enqueuedAt: ago(i * 30 + 2),
  startedAt: i % 3 === 0 ? ago(i * 30) : null,
}));

export const MOCK_CALENDAR: ReleaseCalendarDTO[] = Array.from({ length: 30 }, (_, i) => ({
  id: `CAL-${String(i + 1).padStart(3, "0")}`,
  title: ["Payment v4 Release", "Sprint 24 Deploy", "Security Freeze", "Platform Maintenance", "DB Migration", "Hotfix Release", "Weekly Release", "Emergency Patch", "Sprint 25 Deploy", "Quarterly Release"][i % 10],
  date: new Date(n + i * 86400000).toISOString().slice(0, 10),
  type: (["release", "release", "release", "freeze", "maintenance", "release", "release", "release", "release", "release"] as const)[i % 10],
  environment: [P, S, Q, D][i % 4],
  status: (["scheduled", "scheduled", "completed", "cancelled"] as const)[i % 4],
}));

export const MOCK_SUMMARY: ReleaseSummaryDTO = {
  totalReleases: 25, successfulDeployments: 28, failedDeployments: 8,
  pendingDeployments: 15, productionVersions: 12, rollbackEvents: 15,
  activePipelines: 4, averageDeploymentTime: 12,
};
