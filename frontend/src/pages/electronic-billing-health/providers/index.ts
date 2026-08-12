import type { ElectronicBillingProvider } from "./ElectronicBillingProvider";
import { mockBillingProvider } from "./MockElectronicBillingProvider";

export const billingProvider: ElectronicBillingProvider = mockBillingProvider;
// import { apiBillingProvider } from "./ApiElectronicBillingProvider";
// export const billingProvider: ElectronicBillingProvider = apiBillingProvider;
