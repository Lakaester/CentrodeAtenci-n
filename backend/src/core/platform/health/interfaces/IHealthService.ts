import type { HealthReport } from "../types";

export interface IHealthService {
  check(): Promise<HealthReport>;
  registerCheck(name: string, check: () => Promise<{ ok: boolean; message?: string }>): void;
}
