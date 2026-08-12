export interface MicroserviceStatus {
  name: string;
  status: "healthy" | "degraded" | "down";
  uptime: string;
}

export interface MicroservicesData {
  services: MicroserviceStatus[];
  healthy: number;
  degraded: number;
  down: number;
  alerts: number;
}

export async function fetchMicroservices(): Promise<MicroservicesData | null> {
  return {
    services: [
      { name: "api-gateway", status: "healthy", uptime: "15d" },
      { name: "auth-service", status: "healthy", uptime: "15d" },
      { name: "payment-service", status: "healthy", uptime: "10d" },
      { name: "order-service", status: "degraded", uptime: "7d" },
      { name: "notification-service", status: "healthy", uptime: "15d" },
      { name: "cache-service", status: "healthy", uptime: "15d" },
      { name: "search-service", status: "healthy", uptime: "5d" },
      { name: "billing-service", status: "degraded", uptime: "3d" },
    ],
    healthy: 6, degraded: 2, down: 0, alerts: 2,
  };
}
