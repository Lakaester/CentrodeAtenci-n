export interface DiagnosisResult {
  problema: string;
  contexto: string;
  providersUtilizados: string[];
  hallazgos: string[];
  recomendaciones: string[];
  nivelConfianza: "alta" | "media" | "baja";
  proximosPasos: string[];
}

export interface OrchestratorInfo {
  name: string;
  description: string;
}
