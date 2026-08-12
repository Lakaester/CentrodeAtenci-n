export type AlertType =
  | "sla-vencido"
  | "sla-proximo"
  | "cola-saturada"
  | "canal-alta-demanda"
  | "asesor-sobrecargado";

export type AlertSeverity = "critica" | "alta" | "media" | "baja";

export type AlertStatus = "activa" | "acknowledged" | "resuelta";

export interface AlertDTO {
  id: string;
  tipo: AlertType;
  severidad: AlertSeverity;
  titulo: string;
  descripcion: string;
  fechaHora: string;
  estado: AlertStatus;
  accionSugerida: string;
}
