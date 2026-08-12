import type { HealthCheck } from "../types";

export type HealthCheckFn = () => Promise<HealthCheck>;

export class HealthRegistry {
  private checks = new Map<string, HealthCheckFn>();

  register(name: string, fn: HealthCheckFn): void {
    this.checks.set(name, fn);
  }

  get(name: string): HealthCheckFn | undefined {
    return this.checks.get(name);
  }

  list(): { name: string; fn: HealthCheckFn }[] {
    return Array.from(this.checks.entries()).map(([name, fn]) => ({ name, fn }));
  }

  count(): number {
    return this.checks.size;
  }
}
