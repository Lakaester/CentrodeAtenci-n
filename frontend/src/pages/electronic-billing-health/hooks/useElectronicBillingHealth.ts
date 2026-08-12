import { useMemo } from "react";
import { useElectronicBillingData } from "./useElectronicBillingData";
import { mapSummary, mapSunats, mapDocuments, mapPendings, mapRejecteds, mapCertificates, mapLicenses, mapThroughputs, mapValidations } from "../mappers/electronicBilling.mapper";
import type { SummaryUI, SunatUI, DocumentUI, PendingUI, RejectedUI, CertificateUI, LicenseUI, ThroughputUI, ValidationUI } from "../mappers/electronicBilling.mapper";

export type BillingState = "loading" | "empty" | "error" | "success";

interface BillingDataResult {
  state: BillingState; lastUpdate: string | null; error: string | null; refresh: () => void;
  summary: SummaryUI | null; sunat: SunatUI[]; documents: DocumentUI[];
  pending: PendingUI[]; rejected: RejectedUI[]; certificates: CertificateUI[];
  licenses: LicenseUI[]; throughputs: ThroughputUI[]; validations: ValidationUI[];
}

export function useElectronicBillingHealth(): BillingDataResult {
  const { data, isLoading, isError, error, dataUpdatedAt, refetch } = useElectronicBillingData();
  const summary = useMemo(() => data ? mapSummary(data.summary) : null, [data]);
  const sunat = useMemo(() => data ? mapSunats(data.sunatConnections) : [], [data]);
  const documents = useMemo(() => data ? mapDocuments(data.electronicDocuments) : [], [data]);
  const pending = useMemo(() => data ? mapPendings(data.pendingDocuments) : [], [data]);
  const rejected = useMemo(() => data ? mapRejecteds(data.rejectedDocuments) : [], [data]);
  const certificates = useMemo(() => data ? mapCertificates(data.certificates) : [], [data]);
  const licenses = useMemo(() => data ? mapLicenses(data.licenses) : [], [data]);
  const throughputs = useMemo(() => data ? mapThroughputs(data.billingThroughputs) : [], [data]);
  const validations = useMemo(() => data ? mapValidations(data.validationErrors) : [], [data]);

  const hasData = data && data.electronicDocuments.length > 0;
  const state: BillingState = isLoading ? "loading" : isError ? "error" : hasData ? "success" : "empty";
  const lastUpdate = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : null;
  return { state, lastUpdate, error: error ?? null, refresh: refetch, summary, sunat, documents, pending, rejected, certificates, licenses, throughputs, validations };
}
