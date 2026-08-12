import { BaseRule } from "../engine/BaseRule";
import type { RuleDefinition } from "../types";

export class DiskSpaceRule extends BaseRule {
  getDefinition(): RuleDefinition {
    return {
      id: "ENV-001",
      nombre: "Disco casi lleno",
      descripcion: "El espacio en disco del dispositivo está por debajo del 10%",
      categoria: "environment",
      severidad: "alta",
      condiciones: [{ field: "diskUsagePercent", operator: "gte", value: 90 }],
      recomendaciones: ["Liberar espacio en disco", "Revisar logs antiguos", "Programar limpieza automática"],
      explicacion: "Cuando el disco supera el 90% de uso, el sistema puede volverse inestable o dejar de funcionar.",
      confianza: "alta",
      version: "1.0.0",
      autor: "COPE",
      fecha: "2026-07-18",
    };
  }
}
