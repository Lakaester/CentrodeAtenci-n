import { DashboardGrid } from "@/pages/dashboard/components/DashboardGrid";
import { SunatConnectivityWidget, ElectronicDocumentsWidget, PendingDocumentsWidget, RejectedDocumentsWidget, CertificateStatusWidget, LicenseStatusWidget, BillingThroughputWidget, ValidationErrorsWidget } from "./widgets";
import type { SunatUI, DocumentUI, PendingUI, RejectedUI, CertificateUI, LicenseUI, ThroughputUI, ValidationUI } from "../mappers/electronicBilling.mapper";
import type { BillingState } from "../hooks/useElectronicBillingHealth";

interface Props {
  state: BillingState;
  sunat: SunatUI[]; documents: DocumentUI[]; pending: PendingUI[]; rejected: RejectedUI[];
  certificates: CertificateUI[]; licenses: LicenseUI[]; throughputs: ThroughputUI[]; validations: ValidationUI[];
}

export function ElectronicBillingHealthGrid({ state, sunat, documents, pending, rejected, certificates, licenses, throughputs, validations }: Props) {
  return <DashboardGrid cols={4}>
    <SunatConnectivityWidget items={sunat} state={state} />
    <ElectronicDocumentsWidget items={documents} state={state} />
    <PendingDocumentsWidget items={pending} state={state} />
    <RejectedDocumentsWidget items={rejected} state={state} />
    <CertificateStatusWidget items={certificates} state={state} />
    <LicenseStatusWidget items={licenses} state={state} />
    <BillingThroughputWidget items={throughputs} state={state} />
    <ValidationErrorsWidget items={validations} state={state} />
  </DashboardGrid>;
}
