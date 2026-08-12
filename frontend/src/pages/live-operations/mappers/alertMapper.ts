import { getAlertSeverityConfig, STATUS_LABEL, ALERT_TYPE_LABEL } from "../registry/alertConfig";
import type { AlertDTO, AlertSeverity } from "../dto/alert.dto";

export interface AlertUI {
  id: string;
  tipo: string;
  tipoLabel: string;
  severidad: AlertSeverity;
  severityColor: string;
  severityLabel: string;
  titulo: string;
  descripcion: string;
  fechaHora: string;
  horaLabel: string;
  estado: string;
  estadoLabel: string;
  accionSugerida: string;
  priorityOrder: number;
}

function formatHora(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

export function mapAlert(dto: AlertDTO): AlertUI {
  const sevCfg = getAlertSeverityConfig(dto.severidad);
  return {
    id: dto.id,
    tipo: dto.tipo,
    tipoLabel: ALERT_TYPE_LABEL[dto.tipo] ?? dto.tipo,
    severidad: dto.severidad,
    severityColor: sevCfg.severityColor,
    severityLabel: sevCfg.severityLabel,
    titulo: dto.titulo,
    descripcion: dto.descripcion,
    fechaHora: dto.fechaHora,
    horaLabel: formatHora(dto.fechaHora),
    estado: dto.estado,
    estadoLabel: STATUS_LABEL[dto.estado] ?? dto.estado,
    accionSugerida: dto.accionSugerida,
    priorityOrder: sevCfg.priorityOrder,
  };
}

export function mapAlerts(dtos: AlertDTO[]): AlertUI[] {
  return dtos.map(mapAlert).sort((a, b) => a.priorityOrder - b.priorityOrder);
}
