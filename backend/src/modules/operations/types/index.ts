export interface OperationsKPI {
  mttr: number | null;
  mttd: number | null;
  sla: number | null;
  casosAbiertos: number;
  casosCriticos: number;
  providersDisponibles: number;
  healthScore: number;
  workflowSuccessRate: number | null;
}

export interface OperationsDashboard {
  kpis: OperationsKPI;
  health: { overall: string; healthy: number; total: number };
  casesByStatus: Record<string, number>;
  recentActivity: { event: string; timestamp: string; detail: string }[];
}
