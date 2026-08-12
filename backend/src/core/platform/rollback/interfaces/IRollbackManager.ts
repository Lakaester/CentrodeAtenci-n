import type { RollbackPoint } from "../types";

export interface IRollbackManager {
  createPoint(version: string, description: string, files: string[]): Promise<RollbackPoint>;
  rollback(pointId: string): Promise<boolean>;
  list(): Promise<RollbackPoint[]>;
}
