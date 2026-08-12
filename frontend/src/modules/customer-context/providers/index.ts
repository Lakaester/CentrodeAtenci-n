import type { CustomerContextProvider } from "./CustomerContextProvider";
import { mergedCustomerContextProvider } from "./MergedCustomerContextProvider";

export const customerContextProvider: CustomerContextProvider = mergedCustomerContextProvider;
