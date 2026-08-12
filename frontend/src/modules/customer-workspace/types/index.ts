export interface CustomerWorkspaceData {
  dominio: string;
  empresa: string | null;
  producto: string | null;
  pais: string | null;
  estado: string | null;
  ultimaConexion: string | null;
}

export interface WorkspaceAction {
  id: string;
  label: string;
  icon: string;
  provider: string;
  action: string;
  description: string;
}

export interface DiagnosisSummary {
  problema: string;
  contexto: string;
  hallazgos: string[];
  recomendaciones: string[];
  nivelConfianza: "alta" | "media" | "baja";
  proximosPasos: string[];
}
