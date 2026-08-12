import type { SunatConnectivityDTO, ElectronicDocumentDTO, PendingDocumentDTO, RejectedDocumentDTO, CertificateDTO, LicenseDTO, BillingThroughputDTO, ValidationErrorDTO, ElectronicBillingSummaryDTO } from "../dto/electronicBilling.dto";
const n = Date.now(); const ago = (m: number) => new Date(n - m * 60000).toISOString();
const P = "production" as const; const S = "staging" as const; const Q = "qa" as const; const D = "development" as const; const ON = "online" as const; const DG = "degraded" as const; const OFF = "offline" as const; const MT = "maintenance" as const;

export const MOCK_SUNAT: SunatConnectivityDTO[] = [
  { id: "sun-001", country: "Perú", endpoint: "https://e-factura.sunat.gob.pe",   status: ON, environment: P, responseTime: 450,  lastCheck: ago(1), availability: 99.8 },
  { id: "sun-002", country: "Perú", endpoint: "https://api-cpe.sunat.gob.pe",      status: DG, environment: P, responseTime: 1200, lastCheck: ago(2), availability: 97.5 },
  { id: "sun-003", country: "Perú", endpoint: "https://e-factura.sunat.gob.pe",   status: ON, environment: S, responseTime: 380,  lastCheck: ago(3), availability: 99.9 },
  { id: "sun-004", country: "Chile", endpoint: "https://palena.sii.cl",            status: ON, environment: P, responseTime: 280,  lastCheck: ago(1), availability: 99.95 },
  { id: "sun-005", country: "Chile", endpoint: "https://maullin.sii.cl",           status: DG, environment: P, responseTime: 890,  lastCheck: ago(5), availability: 96.8 },
  { id: "sun-006", country: "Colombia", endpoint: "https://facturaelectronica.dian.gov.co", status: ON, environment: P, responseTime: 320, lastCheck: ago(1), availability: 99.7 },
  { id: "sun-007", country: "México", endpoint: "https://cfdi.sat.gob.mx",         status: ON, environment: P, responseTime: 510,  lastCheck: ago(1), availability: 99.6 },
  { id: "sun-008", country: "México", endpoint: "https://cfdi.sat.gob.mx",        status: OFF, environment: P, responseTime: 0,    lastCheck: ago(10), availability: 85.0 },
  { id: "sun-009", country: "Perú", endpoint: "https://e-consult.sunat.gob.pe",    status: ON, environment: S, responseTime: 200,  lastCheck: ago(2), availability: 100.0 },
  { id: "sun-010", country: "Colombia", endpoint: "https://fe.dian.gov.co",        status: MT, environment: S, responseTime: 0,    lastCheck: ago(30), availability: 90.0 },
  { id: "sun-011", country: "Perú", endpoint: "https://e-factura.sunat.gob.pe",   status: ON, environment: Q, responseTime: 150,  lastCheck: ago(1), availability: 100.0 },
  { id: "sun-012", country: "Chile", endpoint: "https://palena.sii.cl",           status: ON, environment: Q, responseTime: 180,  lastCheck: ago(2), availability: 100.0 },
  { id: "sun-013", country: "Perú", endpoint: "https://api-cpe.sunat.gob.pe",      status: DG, environment: Q, responseTime: 750,  lastCheck: ago(3), availability: 98.0 },
  { id: "sun-014", country: "Perú", endpoint: "https://e-factura.sunat.gob.pe",   status: ON, environment: D, responseTime: 100,  lastCheck: ago(1), availability: 100.0 },
  { id: "sun-015", country: "Colombia", endpoint: "https://fe.dian.gov.co",        status: ON, environment: D, responseTime: 120,  lastCheck: ago(1), availability: 100.0 },
  { id: "sun-016", country: "México", endpoint: "https://cfdi.sat.gob.mx",        status: ON, environment: D, responseTime: 200,  lastCheck: ago(2), availability: 100.0 },
  { id: "sun-017", country: "Chile", endpoint: "https://sheriff.sii.cl",           status: ON, environment: P, responseTime: 350,  lastCheck: ago(1), availability: 99.8 },
  { id: "sun-018", country: "Perú", endpoint: "https://e-factura.sunat.gob.pe",   status: ON, environment: P, responseTime: 310,  lastCheck: ago(1), availability: 99.9 },
  { id: "sun-019", country: "México", endpoint: "https://cfdi.sat.gob.mx",        status: DG, environment: S, responseTime: 650,  lastCheck: ago(5), availability: 97.0 },
  { id: "sun-020", country: "Colombia", endpoint: "https://facturaelectronica.dian.gov.co", status: ON, environment: P, responseTime: 290, lastCheck: ago(1), availability: 99.85 },
];

export const MOCK_DOCUMENTS: ElectronicDocumentDTO[] = Array.from({ length: 50 }, (_, i) => ({
  id: `DOC-${String(i + 1).padStart(3, "0")}`, documentType: ["INVOICE", "CREDIT_NOTE", "DEBIT_NOTE", "RECEIPT", "PERCEPTION"][i % 5],
  series: `F${String((i % 10) + 1).padStart(3, "0")}`, number: String(1000000 + i * 12 + i),
  status: (["pending", "processing", "accepted", "rejected"] as const)[i % 4],
  environment: [P, S, P, P][i % 4], createdAt: ago(i * 10 + 2), sunatResponseTime: Math.floor(Math.random() * 800) + 100,
  cdrCode: i % 4 === 0 ? String(1000 + i) : null,
}));

export const MOCK_PENDING: PendingDocumentDTO[] = Array.from({ length: 25 }, (_, i) => ({
  id: `PEND-${String(i + 1).padStart(3, "0")}`, documentType: ["INVOICE", "CREDIT_NOTE", "RECEIPT"][i % 3],
  series: `F${String((i % 10) + 1).padStart(3, "0")}`, number: String(2000000 + i * 15),
  queuedSince: ago(i * 20 + 5), retryCount: i % 4, priority: (["alta", "media", "baja"] as const)[i % 3],
}));

export const MOCK_REJECTED: RejectedDocumentDTO[] = Array.from({ length: 20 }, (_, i) => ({
  id: `REJ-${String(i + 1).padStart(3, "0")}`, documentType: ["INVOICE", "CREDIT_NOTE", "DEBIT_NOTE", "RECEIPT"][i % 4],
  series: `F${String((i % 10) + 1).padStart(3, "0")}`, number: String(3000000 + i * 20),
  rejectedAt: ago(i * 30 + 5), errorCode: ["2000", "2011", "2335", "2407", "3022", "4015", "5020", "6033", "7041", "8005"][i % 10],
  errorDescription: ["RUC no existe", "Monto total inválido", "Fecha de emisión fuera de rango", "Serie no autorizada", "Cliente no identificado", "CMP no registrado", "Dato inconsistente", "Firma digital inválida", "XML mal formado", "Timeout de conexión SUNAT"][i % 10],
  severity: (["info", "warning", "error", "critical"] as const)[i % 4],
}));

export const MOCK_CERTIFICATES: CertificateDTO[] = [
  { id: "cert-001", issuer: "VeriSign Perú",     serialNumber: "SN-2024-001", subject: "Restaurant.pe SAC", status: "valid",    issuedAt: ago(43200), expiresAt: ago(-43200), daysRemaining: 180, environment: P },
  { id: "cert-002", issuer: "VeriSign Perú",     serialNumber: "SN-2024-002", subject: "Restaurant.pe SAC", status: "valid",    issuedAt: ago(21600), expiresAt: ago(-21600), daysRemaining: 90,  environment: P },
  { id: "cert-003", issuer: "VeriSign Chile",    serialNumber: "SN-2024-003", subject: "Santiago Branch",    status: "expiring", issuedAt: ago(51840), expiresAt: ago(-1440), daysRemaining: 10,  environment: P },
  { id: "cert-004", issuer: "VeriSign Colombia", serialNumber: "SN-2024-004", subject: "Bogotá Branch",      status: "valid",    issuedAt: ago(28800), expiresAt: ago(-28800), daysRemaining: 120, environment: P },
  { id: "cert-005", issuer: "SAT México",        serialNumber: "SN-2024-005", subject: "CDMX Branch",        status: "expired",  issuedAt: ago(72000), expiresAt: ago(-1440), daysRemaining: -5,  environment: P },
  { id: "cert-006", issuer: "VeriSign Perú",     serialNumber: "SN-2024-006", subject: "Restaurant.pe SAC", status: "expiring", issuedAt: ago(51840), expiresAt: ago(-720), daysRemaining: 5,   environment: S },
  { id: "cert-007", issuer: "VeriSign Perú",     serialNumber: "SN-2024-007", subject: "Restaurant.pe SAC", status: "valid",    issuedAt: ago(43200), expiresAt: ago(-43200), daysRemaining: 180, environment: S },
  { id: "cert-008", issuer: "VeriSign Chile",    serialNumber: "SN-2024-008", subject: "Santiago Branch",    status: "valid",    issuedAt: ago(14400), expiresAt: ago(-14400), daysRemaining: 60,  environment: S },
  { id: "cert-009", issuer: "VeriSign Colombia", serialNumber: "SN-2024-009", subject: "Bogotá Branch",      status: "valid",    issuedAt: ago(21600), expiresAt: ago(-21600), daysRemaining: 90,  environment: Q },
  { id: "cert-010", issuer: "SAT México",        serialNumber: "SN-2024-010", subject: "CDMX Branch",        status: "valid",    issuedAt: ago(43200), expiresAt: ago(-43200), daysRemaining: 180, environment: Q },
  { id: "cert-011", issuer: "VeriSign Perú",     serialNumber: "SN-2024-011", subject: "Restaurant.pe SAC", status: "valid",    issuedAt: ago(86400), expiresAt: ago(-86400), daysRemaining: 360, environment: D },
  { id: "cert-012", issuer: "VeriSign Perú",     serialNumber: "SN-2024-012", subject: "Arequipa Branch",   status: "expiring", issuedAt: ago(51840), expiresAt: ago(-720), daysRemaining: 3,   environment: P },
  { id: "cert-013", issuer: "VeriSign Perú",     serialNumber: "SN-2024-013", subject: "Cusco Branch",       status: "valid",    issuedAt: ago(14400), expiresAt: ago(-14400), daysRemaining: 60,  environment: P },
  { id: "cert-014", issuer: "VeriSign Perú",     serialNumber: "SN-2024-014", subject: "Trujillo Branch",    status: "valid",    issuedAt: ago(28800), expiresAt: ago(-28800), daysRemaining: 120, environment: P },
  { id: "cert-015", issuer: "VeriSign Colombia", serialNumber: "SN-2024-015", subject: "Medellín Office",   status: "expired",  issuedAt: ago(72000), expiresAt: ago(-2880), daysRemaining: -12, environment: P },
];

export const MOCK_LICENSES: LicenseDTO[] = [
  { id: "lic-001", customer: "Restaurant.pe HQ",     licenseType: "Enterprise Billing", activationDate: ago(43200), expirationDate: ago(-43200), daysRemaining: 180, status: "active" },
  { id: "lic-002", customer: "Restaurant.pe HQ",     licenseType: "SUNAT Integration", activationDate: ago(43200), expirationDate: ago(-43200), daysRemaining: 180, status: "active" },
  { id: "lic-003", customer: "Restaurant.pe HQ",     licenseType: "Digital Signature", activationDate: ago(21600), expirationDate: ago(-21600), daysRemaining: 90,  status: "active" },
  { id: "lic-004", customer: "Santiago Branch",      licenseType: "Enterprise Billing", activationDate: ago(21600), expirationDate: ago(-21600), daysRemaining: 90,  status: "active" },
  { id: "lic-005", customer: "Santiago Branch",      licenseType: "SII Integration",    activationDate: ago(7200),  expirationDate: ago(-1440),  daysRemaining: 10,  status: "warning" },
  { id: "lic-006", customer: "Bogotá Branch",        licenseType: "Enterprise Billing", activationDate: ago(14400), expirationDate: ago(-14400), daysRemaining: 60,  status: "active" },
  { id: "lic-007", customer: "Bogotá Branch",        licenseType: "DIAN Integration",  activationDate: ago(14400), expirationDate: ago(-14400), daysRemaining: 60,  status: "active" },
  { id: "lic-008", customer: "CDMX Branch",          licenseType: "Enterprise Billing", activationDate: ago(43200), expirationDate: ago(-43200), daysRemaining: 180, status: "active" },
  { id: "lic-009", customer: "CDMX Branch",          licenseType: "SAT Integration",    activationDate: ago(43200), expirationDate: ago(-43200), daysRemaining: 180, status: "active" },
  { id: "lic-010", customer: "Restaurant.pe HQ",     licenseType: "PDF Generation",    activationDate: ago(86400), expirationDate: ago(-86400), daysRemaining: 360, status: "active" },
  { id: "lic-011", customer: "Arequipa Branch",      licenseType: "Enterprise Billing", activationDate: ago(14400), expirationDate: ago(-14400), daysRemaining: 60,  status: "active" },
  { id: "lic-012", customer: "Arequipa Branch",      licenseType: "SUNAT Integration", activationDate: ago(7200),  expirationDate: ago(-720),  daysRemaining: 5,   status: "warning" },
  { id: "lic-013", customer: "Cusco Branch",         licenseType: "Enterprise Billing", activationDate: ago(7200),  expirationDate: ago(-4320),  daysRemaining: 30,  status: "active" },
  { id: "lic-014", customer: "Trujillo Branch",      licenseType: "Enterprise Billing", activationDate: ago(21600), expirationDate: ago(-21600), daysRemaining: 90,  status: "active" },
  { id: "lic-015", customer: "Restaurant.pe HQ",     licenseType: "API Gateway",       activationDate: ago(43200), expirationDate: ago(-720),  daysRemaining: 3,   status: "warning" },
];

export const MOCK_THROUGHPUTS: BillingThroughputDTO[] = Array.from({ length: 30 }, (_, i) => ({
  id: `TP-${String(i + 1).padStart(3, "0")}`, timestamp: ago(i * 5),
  documentsSent: Math.floor(Math.random() * 50) + 10, documentsAccepted: Math.floor(Math.random() * 45) + 5,
  documentsRejected: Math.floor(Math.random() * 5), averageResponseTime: Math.floor(Math.random() * 600) + 200,
}));

export const MOCK_VALIDATIONS: ValidationErrorDTO[] = Array.from({ length: 30 }, (_, i) => ({
  id: `VAL-${String(i + 1).padStart(3, "0")}`, documentType: ["INVOICE", "CREDIT_NOTE", "DEBIT_NOTE", "RECEIPT"][i % 4],
  series: `F${String((i % 10) + 1).padStart(3, "0")}`, number: String(4000000 + i * 25),
  errorCode: ["2000", "2011", "2335", "2407", "3022", "4015", "5020", "6033", "7041", "8005"][i % 10],
  description: ["RUC inválido", "Monto incorrecto", "Fecha fuera de rango", "Serie no autorizada", "Cliente no existe", "CMP duplicado", "Dato inconsistente", "Firma inválida", "XML mal formado", "Timeout SUNAT"][i % 10],
  severity: (["info", "warning", "error", "critical"] as const)[i % 4], createdAt: ago(i * 15 + 2),
  resolved: i % 2 === 0,
}));

export const MOCK_SUMMARY: ElectronicBillingSummaryDTO = {
  sunatStatus: "Degraded", electronicDocuments: 50, pendingDocuments: 25,
  rejectedDocuments: 20, certificatesOk: 10, licensesActive: 12,
  documentsPerMinute: 34, validationErrors: 30,
};
