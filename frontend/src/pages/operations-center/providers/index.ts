import type { InfrastructureProvider } from "./InfrastructureProvider";
import { mockInfrastructureProvider } from "./MockInfrastructureProvider";
// import { apiInfrastructureProvider } from "./ApiInfrastructureProvider"; // Uncomment to switch to real API

export const infrastructureProvider: InfrastructureProvider = mockInfrastructureProvider;
