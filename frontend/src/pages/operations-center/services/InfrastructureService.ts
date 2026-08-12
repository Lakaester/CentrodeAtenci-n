import type { InfrastructureProvider } from "../providers/InfrastructureProvider";
import type { InfrastructureSummaryDTO, MicroserviceDTO, ApiHealthDTO, FeatureFlagDTO, DeploymentDTO, QueueDTO, LicenseDTO, FolioDTO, RegionDTO } from "../dto/infrastructure.dto";

export interface InfrastructureData {
  summary: InfrastructureSummaryDTO;
  microservices: MicroserviceDTO[];
  apis: ApiHealthDTO[];
  featureFlags: FeatureFlagDTO[];
  deployments: DeploymentDTO[];
  queues: QueueDTO[];
  licenses: LicenseDTO[];
  folios: FolioDTO[];
  regions: RegionDTO[];
}

export class InfrastructureService {
  constructor(private provider: InfrastructureProvider) {}

  async fetchAll(): Promise<InfrastructureData> {
    const [summary, microservices, apis, featureFlags, deployments, queues, licenses, folios, regions] = await Promise.all([
      this.provider.getSummary(),
      this.provider.getMicroservices(),
      this.provider.getApis(),
      this.provider.getFeatureFlags(),
      this.provider.getDeployments(),
      this.provider.getQueues(),
      this.provider.getLicenses(),
      this.provider.getFolios(),
      this.provider.getRegions(),
    ]);

    return { summary, microservices, apis, featureFlags, deployments, queues, licenses, folios, regions };
  }
}
