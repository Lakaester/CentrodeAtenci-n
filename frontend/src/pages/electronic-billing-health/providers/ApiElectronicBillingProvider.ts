import type { ElectronicBillingProvider } from "./ElectronicBillingProvider";

export const apiBillingProvider: ElectronicBillingProvider = {
  getSummary: () => { throw new Error("Not implemented"); },
  getSunatConnections: () => { throw new Error("Not implemented"); },
  getElectronicDocuments: () => { throw new Error("Not implemented"); },
  getPendingDocuments: () => { throw new Error("Not implemented"); },
  getRejectedDocuments: () => { throw new Error("Not implemented"); },
  getCertificates: () => { throw new Error("Not implemented"); },
  getLicenses: () => { throw new Error("Not implemented"); },
  getBillingThroughputs: () => { throw new Error("Not implemented"); },
  getValidationErrors: () => { throw new Error("Not implemented"); },
};
