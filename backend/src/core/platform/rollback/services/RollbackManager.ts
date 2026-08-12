import type { IRollbackManager } from "../interfaces/IRollbackManager";
import type { RollbackPoint } from "../types";

export class RollbackManager implements IRollbackManager {
  private points: RollbackPoint[] = [];

  async createPoint(version: string, description: string, files: string[]): Promise<RollbackPoint> {
    const point: RollbackPoint = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      version,
      description,
      files,
      strategy: "revert",
    };
    this.points.push(point);
    console.log(`[Rollback] Punto creado: ${version} — ${description}`);
    return point;
  }

  async rollback(pointId: string): Promise<boolean> {
    const point = this.points.find((p) => p.id === pointId);
    if (!point) return false;
    console.log(`[Rollback] Ejecutando rollback a ${point.version}: ${point.description}`);
    return true;
  }

  async list(): Promise<RollbackPoint[]> {
    return [...this.points].reverse();
  }
}
