import type { CustomerContextProvider } from "./CustomerContextProvider";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { CustomerContextDTO } from "../dto/customerContext.dto";
import type { InboxItemFE } from "@/components/zendesk/useZendeskInbox";
import { metaToCustomerContext, zendeskToCustomerContext } from "../mappers";
import { fetchVersions } from "./sources/VersionsProvider";
import { fetchFeatureFlags } from "./sources/FeatureFlagsProvider";
import { fetchFolios } from "./sources/FoliosProvider";
import { fetchQueues } from "./sources/QueuesProvider";
import { fetchMicroservices } from "./sources/MicroservicesProvider";
import { fetchDashboardData } from "./sources/DashboardProvider";
import { calculateHealth } from "../registry/HealthEngine";
import type { HealthFactor } from "../registry/HealthEngine";

export const mergedCustomerContextProvider: CustomerContextProvider = {
  getCustomerContext: async (ticket: InboxTicketDTO): Promise<CustomerContextDTO> => {
    const base: CustomerContextDTO = ticket.subChannel === "meta"
      ? metaToCustomerContext(ticket.raw as any)
      : zendeskToCustomerContext(ticket.raw as InboxItemFE);

    const [versions, featureFlagsData, folios, queues, microservices, dashboard] = await Promise.all([
      fetchVersions(), fetchFeatureFlags(), fetchFolios(),
      fetchQueues(), fetchMicroservices(), fetchDashboardData(),
    ]);

    const healthFactors: HealthFactor[] = [
      { name: "Licencia activa", weight: 25, ok: true },
      { name: "Versión actualizada", weight: 20, ok: versions?.status === "actualizado" },
      { name: "Folios disponibles", weight: 15, ok: folios ? !folios.lowStock : false },
      { name: "Actividad reciente", weight: 15, ok: !!base.lastInteraction && Date.now() - new Date(base.lastInteraction).getTime() < 86400000 },
      { name: "Servicios saludables", weight: 15, ok: (microservices?.down ?? 1) === 0 },
      { name: "Sin errores en colas", weight: 10, ok: (queues?.totalErrors ?? 1) === 0 },
    ];

    return {
      ...base,
      licenses: [],
      healthScore: calculateHealth(healthFactors),
      versions,
      featureFlags: featureFlagsData?.flags ?? null,
      folios: folios ? { available: folios.available, used: folios.used, remaining: folios.remaining, consumptionPct: folios.consumptionPct, lowStock: folios.lowStock } : null,
      queues: queues?.processes ?? null,
      microservices: microservices?.services ?? null,
      health: dashboard ? {
        totalTickets: dashboard.totalTickets,
        openTickets: dashboard.openTickets,
        avgResponseTime: dashboard.avgResponseTime,
        slaCompliance: null,
        lastInteraction: base.lastInteraction,
      } : null,
    };
  },
};
