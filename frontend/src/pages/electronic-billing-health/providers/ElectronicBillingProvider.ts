import type { ElectronicBillingSummaryDTO, SunatConnectivityDTO, ElectronicDocumentDTO, PendingDocumentDTO, RejectedDocumentDTO, CertificateDTO, LicenseDTO, BillingThroughputDTO, ValidationErrorDTO } from "../dto/electronicBilling.dto";

export interface ElectronicBillingProvider {
  getSummary(): Promise<ElectronicBillingSummaryDTO>;
  getSunatConnections(): Promise<SunatConnectivityDTO[]>;
  getElectronicDocuments(): Promise<ElectronicDocumentDTO[]>;
  getPendingDocuments(): Promise<PendingDocumentDTO[]>;
  getRejectedDocuments(): Promise<RejectedDocumentDTO[]>;
  getCertificates(): Promise<CertificateDTO[]>;
  getLicenses(): Promise<LicenseDTO[]>;
  getBillingThroughputs(): Promise<BillingThroughputDTO[]>;
  getValidationErrors(): Promise<ValidationErrorDTO[]>;
}
