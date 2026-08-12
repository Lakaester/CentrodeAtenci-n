import type {
  InfrastructureSummaryDTO, MicroserviceDTO, ApiHealthDTO, FeatureFlagDTO,
  DeploymentDTO, QueueDTO, LicenseDTO, FolioDTO, RegionDTO,
} from "../dto/infrastructure.dto";

export interface InfrastructureProvider {
  getSummary(): Promise<InfrastructureSummaryDTO>;
  getMicroservices(): Promise<MicroserviceDTO[]>;
  getApis(): Promise<ApiHealthDTO[]>;
  getFeatureFlags(): Promise<FeatureFlagDTO[]>;
  getDeployments(): Promise<DeploymentDTO[]>;
  getQueues(): Promise<QueueDTO[]>;
  getLicenses(): Promise<LicenseDTO[]>;
  getFolios(): Promise<FolioDTO[]>;
  getRegions(): Promise<RegionDTO[]>;
}
