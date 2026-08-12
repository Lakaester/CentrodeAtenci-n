import type { ElectronicBillingProvider } from "../providers/ElectronicBillingProvider";
import type { ElectronicBillingSummaryDTO, SunatConnectivityDTO, ElectronicDocumentDTO, PendingDocumentDTO, RejectedDocumentDTO, CertificateDTO, LicenseDTO, BillingThroughputDTO, ValidationErrorDTO } from "../dto/electronicBilling.dto";

export interface BillingData {
  summary: ElectronicBillingSummaryDTO; sunatConnections: SunatConnectivityDTO[];
  electronicDocuments: ElectronicDocumentDTO[]; pendingDocuments: PendingDocumentDTO[];
  rejectedDocuments: RejectedDocumentDTO[]; certificates: CertificateDTO[];
  licenses: LicenseDTO[]; billingThroughputs: BillingThroughputDTO[]; validationErrors: ValidationErrorDTO[];
}

export class ElectronicBillingService {
  constructor(private provider: ElectronicBillingProvider) {}

  async fetchAll(): Promise<BillingData> {
    const [summary, sunatConnections, electronicDocuments, pendingDocuments, rejectedDocuments, certificates, licenses, billingThroughputs, validationErrors] = await Promise.all([
      this.provider.getSummary(), this.provider.getSunatConnections(), this.provider.getElectronicDocuments(),
      this.provider.getPendingDocuments(), this.provider.getRejectedDocuments(), this.provider.getCertificates(),
      this.provider.getLicenses(), this.provider.getBillingThroughputs(), this.provider.getValidationErrors(),
    ]);
    return { summary, sunatConnections, electronicDocuments, pendingDocuments, rejectedDocuments, certificates, licenses, billingThroughputs, validationErrors };
  }
}
