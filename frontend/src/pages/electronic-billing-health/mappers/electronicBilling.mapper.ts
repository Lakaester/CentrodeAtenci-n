import { SUNAT_STATUS_CONFIG, DOCUMENT_STATUS_CONFIG, CERTIFICATE_STATUS_CONFIG, LICENSE_STATUS_CONFIG, VALIDATION_SEVERITY_CONFIG, ENVIRONMENT_CONFIG } from "../registry/electronicBilling.registry";
import type { SunatConnectivityDTO, ElectronicDocumentDTO, PendingDocumentDTO, RejectedDocumentDTO, CertificateDTO, LicenseDTO, BillingThroughputDTO, ValidationErrorDTO, ElectronicBillingSummaryDTO } from "../dto/electronicBilling.dto";

export interface SummaryUI { sunatStatus: string; electronicDocuments: number; pendingDocuments: number; rejectedDocuments: number; certificatesOk: number; licensesActive: number; documentsPerMinute: number; validationErrors: number; }
export interface SunatUI { id: string; country: string; endpoint: string; status: string; statusColor: string; environment: string; envColor: string; responseTime: number; availability: number; }
export interface DocumentUI { id: string; documentType: string; series: string; number: string; status: string; statusColor: string; }
export interface PendingUI { id: string; documentType: string; series: string; number: string; retryCount: number; priority: string; }
export interface RejectedUI { id: string; documentType: string; series: string; number: string; errorCode: string; errorDescription: string; severity: string; severityColor: string; }
export interface CertificateUI { id: string; issuer: string; status: string; statusColor: string; daysRemaining: number; }
export interface LicenseUI { id: string; customer: string; licenseType: string; status: string; statusColor: string; daysRemaining: number; }
export interface ThroughputUI { id: string; timestamp: string; documentsSent: number; documentsAccepted: number; documentsRejected: number; avgResponseTime: number; }
export interface ValidationUI { id: string; documentType: string; errorCode: string; description: string; severity: string; severityColor: string; resolved: boolean; }

export function mapSummary(dto: ElectronicBillingSummaryDTO): SummaryUI { return dto; }
export function mapSunat(dto: SunatConnectivityDTO): SunatUI { const sc = SUNAT_STATUS_CONFIG[dto.status]; const ec = ENVIRONMENT_CONFIG[dto.environment]; return { id: dto.id, country: dto.country, endpoint: dto.endpoint, status: sc.label, statusColor: sc.color, environment: ec.label, envColor: ec.color, responseTime: dto.responseTime, availability: dto.availability }; }
export function mapSunats(dtos: SunatConnectivityDTO[]): SunatUI[] { return dtos.map(mapSunat); }
export function mapDocument(dto: ElectronicDocumentDTO): DocumentUI { const dc = DOCUMENT_STATUS_CONFIG[dto.status]; return { id: dto.id, documentType: dto.documentType, series: dto.series, number: dto.number, status: dc.label, statusColor: dc.color }; }
export function mapDocuments(dtos: ElectronicDocumentDTO[]): DocumentUI[] { return dtos.map(mapDocument); }
export function mapPending(dto: PendingDocumentDTO): PendingUI { return { id: dto.id, documentType: dto.documentType, series: dto.series, number: dto.number, retryCount: dto.retryCount, priority: dto.priority }; }
export function mapPendings(dtos: PendingDocumentDTO[]): PendingUI[] { return dtos.map(mapPending); }
export function mapRejected(dto: RejectedDocumentDTO): RejectedUI { const vc = VALIDATION_SEVERITY_CONFIG[dto.severity]; return { id: dto.id, documentType: dto.documentType, series: dto.series, number: dto.number, errorCode: dto.errorCode, errorDescription: dto.errorDescription, severity: vc.label, severityColor: vc.color }; }
export function mapRejecteds(dtos: RejectedDocumentDTO[]): RejectedUI[] { return dtos.map(mapRejected); }
export function mapCertificate(dto: CertificateDTO): CertificateUI { const cc = CERTIFICATE_STATUS_CONFIG[dto.status]; return { id: dto.id, issuer: dto.issuer, status: cc.label, statusColor: cc.color, daysRemaining: dto.daysRemaining }; }
export function mapCertificates(dtos: CertificateDTO[]): CertificateUI[] { return dtos.map(mapCertificate); }
export function mapLicense(dto: LicenseDTO): LicenseUI { const lc = LICENSE_STATUS_CONFIG[dto.status]; return { id: dto.id, customer: dto.customer, licenseType: dto.licenseType, status: lc.label, statusColor: lc.color, daysRemaining: dto.daysRemaining }; }
export function mapLicenses(dtos: LicenseDTO[]): LicenseUI[] { return dtos.map(mapLicense); }
export function mapThroughput(dto: BillingThroughputDTO): ThroughputUI { return { id: dto.id, timestamp: dto.timestamp, documentsSent: dto.documentsSent, documentsAccepted: dto.documentsAccepted, documentsRejected: dto.documentsRejected, avgResponseTime: dto.averageResponseTime }; }
export function mapThroughputs(dtos: BillingThroughputDTO[]): ThroughputUI[] { return dtos.map(mapThroughput); }
export function mapValidation(dto: ValidationErrorDTO): ValidationUI { const vc = VALIDATION_SEVERITY_CONFIG[dto.severity]; return { id: dto.id, documentType: dto.documentType, errorCode: dto.errorCode, description: dto.description, severity: vc.label, severityColor: vc.color, resolved: dto.resolved }; }
export function mapValidations(dtos: ValidationErrorDTO[]): ValidationUI[] { return dtos.map(mapValidation); }
