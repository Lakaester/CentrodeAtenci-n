import type { MicroserviceDTO, ApiHealthDTO, FeatureFlagDTO, DeploymentDTO, QueueDTO, LicenseDTO, FolioDTO, RegionDTO, InfrastructureSummaryDTO } from "../dto/infrastructure.dto";

const n = Date.now();
const ago = (min: number) => new Date(n - min * 60000).toISOString();
const N = "healthy" as const; const W = "warning" as const; const C = "critical" as const; const M = "maintenance" as const;
const PROD = "production" as const; const STG = "staging" as const; const QA = "qa" as const; const DEV = "development" as const;

export const MOCK_MICROSERVICES: MicroserviceDTO[] = [
  { id: "ms-001", name: "api-gateway",         status: N, version: "v4.0.1",  uptime: 10080, latency: 12,  cpuUsage: 45,  memoryUsage: 62, region: "pe-lim", lastDeployment: ago(120),   lastHeartbeat: ago(1) },
  { id: "ms-002", name: "auth-service",        status: N, version: "v3.12.4", uptime: 10080, latency: 8,   cpuUsage: 32,  memoryUsage: 48, region: "pe-lim", lastDeployment: ago(240),   lastHeartbeat: ago(1) },
  { id: "ms-003", name: "order-service",       status: N, version: "v3.13.0", uptime: 7200,  latency: 25,  cpuUsage: 68,  memoryUsage: 74, region: "pe-lim", lastDeployment: ago(60),    lastHeartbeat: ago(1) },
  { id: "ms-004", name: "payment-service",     status: N, version: "v3.12.4", uptime: 10080, latency: 18,  cpuUsage: 52,  memoryUsage: 58, region: "pe-lim", lastDeployment: ago(360),   lastHeartbeat: ago(1) },
  { id: "ms-005", name: "notification-service", status: W, version: "v3.10.2", uptime: 4320,  latency: 45,  cpuUsage: 82,  memoryUsage: 88, region: "pe-lim", lastDeployment: ago(480),   lastHeartbeat: ago(2) },
  { id: "ms-006", name: "inventory-service",   status: N, version: "v3.11.0", uptime: 10080, latency: 15,  cpuUsage: 38,  memoryUsage: 44, region: "pe-aqp", lastDeployment: ago(720),   lastHeartbeat: ago(1) },
  { id: "ms-007", name: "user-service",        status: N, version: "v3.12.4", uptime: 10080, latency: 10,  cpuUsage: 28,  memoryUsage: 36, region: "pe-aqp", lastDeployment: ago(1440),  lastHeartbeat: ago(1) },
  { id: "ms-008", name: "reporting-service",   status: C, version: "v2.9.1",  uptime: 360,   latency: 120, cpuUsage: 95,  memoryUsage: 92, region: "pe-cus", lastDeployment: ago(180),   lastHeartbeat: ago(5) },
  { id: "ms-009", name: "search-service",      status: N, version: "v3.10.2", uptime: 10080, latency: 22,  cpuUsage: 41,  memoryUsage: 46, region: "pe-cus", lastDeployment: ago(960),   lastHeartbeat: ago(1) },
  { id: "ms-010", name: "cache-service",       status: N, version: "v3.13.0", uptime: 10080, latency: 3,   cpuUsage: 22,  memoryUsage: 34, region: "pe-trj", lastDeployment: ago(480),   lastHeartbeat: ago(1) },
  { id: "ms-011", name: "file-service",        status: M, version: "v3.11.0", uptime: 0,     latency: 0,   cpuUsage: 0,   memoryUsage: 0,  region: "pe-trj", lastDeployment: ago(60),    lastHeartbeat: ago(10) },
  { id: "ms-012", name: "billing-service",     status: N, version: "v4.0.1",  uptime: 5040,  latency: 16,  cpuUsage: 48,  memoryUsage: 52, region: "cl-scl", lastDeployment: ago(240),   lastHeartbeat: ago(1) },
  { id: "ms-013", name: "analytics-service",   status: W, version: "v3.10.2", uptime: 2880,  latency: 55,  cpuUsage: 78,  memoryUsage: 82, region: "cl-vap", lastDeployment: ago(360),   lastHeartbeat: ago(3) },
  { id: "ms-014", name: "sync-service",        status: N, version: "v3.12.4", uptime: 10080, latency: 20,  cpuUsage: 35,  memoryUsage: 40, region: "co-bog", lastDeployment: ago(720),   lastHeartbeat: ago(1) },
  { id: "ms-015", name: "export-service",      status: N, version: "v3.11.0", uptime: 7200,  latency: 30,  cpuUsage: 44,  memoryUsage: 50, region: "mx-cdmx", lastDeployment: ago(1440),  lastHeartbeat: ago(1) },
];

export const MOCK_APIS: ApiHealthDTO[] = [
  { id: "api-001", name: "REST Gateway",           endpoint: "/api/v4",    status: N, responseTime: 45,  availability: 99.95, lastCheck: ago(1) },
  { id: "api-002", name: "Auth API",               endpoint: "/auth",      status: N, responseTime: 22,  availability: 99.99, lastCheck: ago(1) },
  { id: "api-003", name: "Orders API",             endpoint: "/orders",    status: N, responseTime: 68,  availability: 99.87, lastCheck: ago(1) },
  { id: "api-004", name: "Payments API",           endpoint: "/payments",  status: N, responseTime: 35,  availability: 99.92, lastCheck: ago(1) },
  { id: "api-005", name: "Notifications API",      endpoint: "/notify",    status: W, responseTime: 120, availability: 98.50, lastCheck: ago(2) },
  { id: "api-006", name: "Inventory API",          endpoint: "/inventory", status: N, responseTime: 30,  availability: 99.97, lastCheck: ago(1) },
  { id: "api-007", name: "Users API",              endpoint: "/users",     status: N, responseTime: 18,  availability: 99.99, lastCheck: ago(1) },
  { id: "api-008", name: "Reporting API",          endpoint: "/reports",   status: C, responseTime: 350, availability: 85.20, lastCheck: ago(5) },
  { id: "api-009", name: "Search API",             endpoint: "/search",    status: N, responseTime: 55,  availability: 99.90, lastCheck: ago(1) },
  { id: "api-010", name: "Billing API",            endpoint: "/billing",   status: N, responseTime: 40,  availability: 99.93, lastCheck: ago(1) },
];

export const MOCK_FEATURE_FLAGS: FeatureFlagDTO[] = [
  { id: "ff-001", name: "new-checkout",        environment: PROD, enabled: true,  rolloutPercentage: 100, owner: "Product",     lastUpdated: ago(1440)  },
  { id: "ff-002", name: "dark-mode",           environment: PROD, enabled: true,  rolloutPercentage: 50,  owner: "UX",          lastUpdated: ago(720)   },
  { id: "ff-003", name: "ai-recommendations",  environment: PROD, enabled: false, rolloutPercentage: 0,   owner: "ML Team",     lastUpdated: ago(240)   },
  { id: "ff-004", name: "multi-language",       environment: STG,  enabled: true,  rolloutPercentage: 100, owner: "Product",     lastUpdated: ago(480)   },
  { id: "ff-005", name: "biometric-auth",       environment: QA,   enabled: true,  rolloutPercentage: 100, owner: "Security",    lastUpdated: ago(360)   },
  { id: "ff-006", name: "chat-support",         environment: STG,  enabled: true,  rolloutPercentage: 25,  owner: "Support",     lastUpdated: ago(120)   },
  { id: "ff-007", name: "real-time-tracking",   environment: DEV,  enabled: true,  rolloutPercentage: 100, owner: "Engineering", lastUpdated: ago(60)    },
  { id: "ff-008", name: "voice-commands",       environment: DEV,  enabled: false, rolloutPercentage: 0,   owner: "Engineering", lastUpdated: ago(30)    },
  { id: "ff-009", name: "new-dashboard",         environment: PROD, enabled: true,  rolloutPercentage: 100, owner: "Product",     lastUpdated: ago(2880)  },
  { id: "ff-010", name: "auto-scaling",         environment: PROD, enabled: true,  rolloutPercentage: 100, owner: "DevOps",      lastUpdated: ago(4320)  },
  { id: "ff-011", name: "webhook-integration",  environment: PROD, enabled: false, rolloutPercentage: 0,   owner: "Engineering", lastUpdated: ago(1440)  },
  { id: "ff-012", name: "payment-2fa",          environment: STG,  enabled: true,  rolloutPercentage: 100, owner: "Security",    lastUpdated: ago(240)   },
  { id: "ff-013", name: "sso-login",            environment: PROD, enabled: true,  rolloutPercentage: 100, owner: "Security",    lastUpdated: ago(7200)  },
  { id: "ff-014", name: "batch-processing",     environment: QA,   enabled: true,  rolloutPercentage: 100, owner: "Engineering", lastUpdated: ago(180)   },
  { id: "ff-015", name: "push-notifications",   environment: PROD, enabled: true,  rolloutPercentage: 75,  owner: "Mobile",      lastUpdated: ago(360)   },
  { id: "ff-016", name: "offline-mode",         environment: DEV,  enabled: false, rolloutPercentage: 0,   owner: "Engineering", lastUpdated: ago(120)   },
  { id: "ff-017", name: "facial-recognition",   environment: QA,   enabled: false, rolloutPercentage: 0,   owner: "Security",    lastUpdated: ago(60)    },
  { id: "ff-018", name: "live-chat",            environment: PROD, enabled: true,  rolloutPercentage: 100, owner: "Support",     lastUpdated: ago(1440)  },
  { id: "ff-019", name: "export-csv",           environment: PROD, enabled: true,  rolloutPercentage: 100, owner: "Product",     lastUpdated: ago(2160)  },
  { id: "ff-020", name: "scheduler-service",    environment: PROD, enabled: true,  rolloutPercentage: 50,  owner: "Engineering", lastUpdated: ago(480)   },
];

export const MOCK_DEPLOYMENTS: DeploymentDTO[] = [
  { id: "dep-001", service: "api-gateway",        version: "v4.0.1",  environment: PROD, status: "success",     startedAt: ago(120),  finishedAt: ago(118),  duration: 2   },
  { id: "dep-002", service: "order-service",      version: "v3.13.0", environment: PROD, status: "success",     startedAt: ago(60),   finishedAt: ago(57),   duration: 3   },
  { id: "dep-003", service: "payment-service",    version: "v3.12.4", environment: STG,  status: "success",     startedAt: ago(240),  finishedAt: ago(235),  duration: 5   },
  { id: "dep-004", service: "notification-service", version: "v3.10.2", environment: PROD, status: "failed",  startedAt: ago(30),   finishedAt: ago(30),   duration: 0   },
  { id: "dep-005", service: "reporting-service",  version: "v2.9.1",  environment: PROD, status: "in-progress", startedAt: ago(5),    finishedAt: null,       duration: null},
  { id: "dep-006", service: "auth-service",       version: "v3.12.4", environment: QA,   status: "success",     startedAt: ago(360),  finishedAt: ago(354),  duration: 6   },
  { id: "dep-007", service: "file-service",       version: "v3.11.0", environment: PROD, status: "rolled-back", startedAt: ago(60),   finishedAt: ago(55),   duration: 5   },
  { id: "dep-008", service: "billing-service",    version: "v4.0.1",  environment: PROD, status: "success",     startedAt: ago(240),  finishedAt: ago(236),  duration: 4   },
  { id: "dep-009", service: "analytics-service",  version: "v3.10.2", environment: DEV,  status: "success",     startedAt: ago(180),  finishedAt: ago(170),  duration: 10  },
  { id: "dep-010", service: "sync-service",       version: "v3.12.4", environment: PROD, status: "success",     startedAt: ago(720),  finishedAt: ago(715),  duration: 5   },
  { id: "dep-011", service: "search-service",     version: "v3.10.2", environment: STG,  status: "success",     startedAt: ago(480),  finishedAt: ago(475),  duration: 5   },
  { id: "dep-012", service: "cache-service",      version: "v3.13.0", environment: PROD, status: "success",     startedAt: ago(480),  finishedAt: ago(478),  duration: 2   },
];

export const MOCK_QUEUES: QueueDTO[] = [
  { id: "q-001", name: "order-processing",   pendingMessages: 124,  processingMessages: 18,  failedMessages: 2,   avgProcessingTime: 320, status: "running" },
  { id: "q-002", name: "payment-confirmation", pendingMessages: 56,   processingMessages: 8,   failedMessages: 5,   avgProcessingTime: 180, status: "running" },
  { id: "q-003", name: "notification-delivery", pendingMessages: 342, processingMessages: 25,  failedMessages: 15,  avgProcessingTime: 45,  status: "degraded" },
  { id: "q-004", name: "email-sender",        pendingMessages: 89,   processingMessages: 12,  failedMessages: 1,   avgProcessingTime: 120, status: "running" },
  { id: "q-005", name: "report-generation",   pendingMessages: 12,   processingMessages: 3,   failedMessages: 0,   avgProcessingTime: 600, status: "running" },
  { id: "q-006", name: "data-sync",           pendingMessages: 210,  processingMessages: 6,   failedMessages: 8,   avgProcessingTime: 250, status: "degraded" },
  { id: "q-007", name: "file-processing",     pendingMessages: 45,   processingMessages: 5,   failedMessages: 1,   avgProcessingTime: 180, status: "paused" },
  { id: "q-008", name: "audit-log",           pendingMessages: 890,  processingMessages: 30,  failedMessages: 0,   avgProcessingTime: 15,  status: "running" },
  { id: "q-009", name: "webhook-delivery",    pendingMessages: 67,   processingMessages: 4,   failedMessages: 3,   avgProcessingTime: 90,  status: "running" },
  { id: "q-010", name: "backup-scheduler",    pendingMessages: 0,    processingMessages: 0,   failedMessages: 0,   avgProcessingTime: 0,   status: "paused" },
];

export const MOCK_LICENSES: LicenseDTO[] = [
  { id: "lic-001", customer: "Restaurant.pe HQ",     licenseType: "Enterprise", expirationDate: "2027-06-30", status: "active",   daysRemaining: 340 },
  { id: "lic-002", customer: "Restaurant.pe HQ",     licenseType: "Database",   expirationDate: "2026-12-31", status: "active",   daysRemaining: 160 },
  { id: "lic-003", customer: "Restaurant.pe HQ",     licenseType: "Monitoring", expirationDate: "2026-08-15", status: "active",   daysRemaining: 25  },
  { id: "lic-004", customer: "Santiago Branch",      licenseType: "Enterprise", expirationDate: "2026-09-30", status: "active",   daysRemaining: 70  },
  { id: "lic-005", customer: "Santiago Branch",      licenseType: "Analytics",  expirationDate: "2026-07-25", status: "expiring", daysRemaining: 4   },
  { id: "lic-006", customer: "Bogotá Branch",        licenseType: "Enterprise", expirationDate: "2027-01-31", status: "active",   daysRemaining: 190 },
  { id: "lic-007", customer: "Bogotá Branch",        licenseType: "Security",   expirationDate: "2026-07-01", status: "expired",  daysRemaining: -20 },
  { id: "lic-008", customer: "CDMX Branch",          licenseType: "Enterprise", expirationDate: "2026-11-30", status: "active",   daysRemaining: 130 },
  { id: "lic-009", customer: "CDMX Branch",          licenseType: "CRM",        expirationDate: "2026-08-01", status: "expiring", daysRemaining: 10  },
  { id: "lic-010", customer: "Restaurant.pe HQ",     licenseType: "Backup",     expirationDate: "2027-03-31", status: "active",   daysRemaining: 250 },
  { id: "lic-011", customer: "Arequipa Branch",      licenseType: "Enterprise", expirationDate: "2026-10-15", status: "active",   daysRemaining: 85  },
  { id: "lic-012", customer: "Arequipa Branch",      licenseType: "Email",      expirationDate: "2026-07-10", status: "expired",  daysRemaining: -11 },
  { id: "lic-013", customer: "Cusco Branch",         licenseType: "Enterprise", expirationDate: "2026-12-31", status: "active",   daysRemaining: 160 },
  { id: "lic-014", customer: "Cusco Branch",         licenseType: "SMS",        expirationDate: "2026-08-20", status: "expiring", daysRemaining: 30  },
  { id: "lic-015", customer: "Trujillo Branch",      licenseType: "Enterprise", expirationDate: "2027-04-30", status: "active",   daysRemaining: 280 },
];

export const MOCK_FOLIOS: FolioDTO[] = [
  { id: "fol-001", company: "Restaurant.pe HQ",   available: 50000, used: 23400, remaining: 26600, status: N },
  { id: "fol-002", company: "Santiago Branch",     available: 20000, used: 12500, remaining: 7500,  status: W },
  { id: "fol-003", company: "Bogotá Branch",       available: 15000, used: 8100,  remaining: 6900,  status: W },
  { id: "fol-004", company: "CDMX Branch",         available: 25000, used: 19800, remaining: 5200,  status: C },
  { id: "fol-005", company: "Arequipa Branch",     available: 8000,  used: 3200,  remaining: 4800,  status: N },
  { id: "fol-006", company: "Cusco Branch",        available: 5000,  used: 2100,  remaining: 2900,  status: N },
  { id: "fol-007", company: "Trujillo Branch",     available: 6000,  used: 3400,  remaining: 2600,  status: W },
  { id: "fol-008", company: "Valparaíso Branch",   available: 4000,  used: 2800,  remaining: 1200,  status: C },
  { id: "fol-009", company: "Restaurant.pe HQ",   available: 100000, used: 0,     remaining: 100000, status: N },
  { id: "fol-010", company: "Restaurant.pe HQ",   available: 75000, used: 62000, remaining: 13000, status: W },
];

export const MOCK_REGIONS: RegionDTO[] = [
  { id: "rgn-001", country: "Perú",     region: "Lima",       status: N, activeServices: 11 },
  { id: "rgn-002", country: "Perú",     region: "Arequipa",   status: N, activeServices: 4  },
  { id: "rgn-003", country: "Perú",     region: "Cusco",      status: W, activeServices: 3  },
  { id: "rgn-004", country: "Perú",     region: "Trujillo",   status: M, activeServices: 2  },
  { id: "rgn-005", country: "Chile",    region: "Santiago",   status: N, activeServices: 5  },
  { id: "rgn-006", country: "Chile",    region: "Valparaíso", status: W, activeServices: 2  },
  { id: "rgn-007", country: "Colombia", region: "Bogotá",     status: N, activeServices: 3  },
  { id: "rgn-008", country: "México",   region: "CDMX",       status: N, activeServices: 4  },
];

export const MOCK_SUMMARY: InfrastructureSummaryDTO = {
  totalMicroservices: 15,
  healthyApis: 8,
  featureFlags: 20,
  deploymentsToday: 3,
  activeQueues: 8,
  activeLicenses: 10,
  foliosAvailable: 176700,
  globalUptime: 10080,
};
