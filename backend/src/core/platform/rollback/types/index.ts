export interface RollbackPoint {
  id: string;
  timestamp: string;
  version: string;
  description: string;
  files: string[];
  strategy: "revert" | "restore" | "migration_down";
}
