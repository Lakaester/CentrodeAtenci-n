import type { ElectronicBillingProvider } from "./ElectronicBillingProvider";
import { MOCK_SUMMARY, MOCK_SUNAT, MOCK_DOCUMENTS, MOCK_PENDING, MOCK_REJECTED, MOCK_CERTIFICATES, MOCK_LICENSES, MOCK_THROUGHPUTS, MOCK_VALIDATIONS } from "../mocks/electronicBilling.mock";

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const mockBillingProvider: ElectronicBillingProvider = {
  getSummary: async () => { await delay(300); return MOCK_SUMMARY; },
  getSunatConnections: async () => { await delay(300); return MOCK_SUNAT; },
  getElectronicDocuments: async () => { await delay(300); return MOCK_DOCUMENTS; },
  getPendingDocuments: async () => { await delay(300); return MOCK_PENDING; },
  getRejectedDocuments: async () => { await delay(300); return MOCK_REJECTED; },
  getCertificates: async () => { await delay(300); return MOCK_CERTIFICATES; },
  getLicenses: async () => { await delay(300); return MOCK_LICENSES; },
  getBillingThroughputs: async () => { await delay(300); return MOCK_THROUGHPUTS; },
  getValidationErrors: async () => { await delay(300); return MOCK_VALIDATIONS; },
};
