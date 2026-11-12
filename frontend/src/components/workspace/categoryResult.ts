export type CategoryResult = {
  tone: "success" | "warning" | "error" | "neutral";
  message: string;
  caso?: { id: string; numero: string };
};

export type CategoryOutcome =
  | { kind: "creado"; caso: { id: string; numero: string; tipo: string }; message: string }
  | { kind: "reutilizado"; caso: { id: string; numero: string; tipo: string }; message: string }
  | { kind: "pendiente"; motivo: string; message: string }
  | { kind: "no_elegible"; message: string }
  | { kind: "guardado"; message: string };

export function mensajeMotivo(motivo: string | null | undefined): string {
  switch (motivo) {
    case "PENDIENTE_CANAL":
      return "Categoría guardada. Expediente pendiente: no se pudo determinar el canal real.";
    case "CANAL_NO_SOPORTADO":
      return "Categoría guardada. Expediente pendiente: el canal no está soportado.";
    case "PENDIENTE_DOMINIO":
      return "Categoría guardada. Expediente pendiente: el dominio del cliente no es válido.";
    case "PENDIENTE_RELACION":
      return "Categoría guardada. Expediente pendiente: no se pudo resolver el ticket raíz.";
    case "PENDIENTE_ATENCION":
      return "Categoría guardada. Expediente pendiente: no hay datos locales de la atención. Abre el ticket para sincronizarlo y vuelve a intentar.";
    case "PENDIENTE_FECHA":
      return "Categoría guardada. Expediente pendiente: falta la fecha original del ticket en PostgreSQL.";
    case "SIN_PERMISO_QYD":
      return "Categoría guardada. No tienes permiso para crear expedientes QyD.";
    default:
      return "Categoría guardada. Expediente pendiente.";
  }
}

export function interpretarRespuestaCategoria(data: any): CategoryOutcome {
  const caso = data?.caso
    ? {
        id: String(data.caso.id),
        numero: String(data.caso.numero),
        tipo: String(data.caso.tipo),
      }
    : null;

  if (data?.creado && caso) {
    return { kind: "creado", caso, message: `Expediente ${caso.numero} creado.` };
  }
  if (data?.reutilizado && caso) {
    return { kind: "reutilizado", caso, message: `Vinculado al expediente ${caso.numero}.` };
  }
  if (data?.expedientePendiente) {
    return {
      kind: "pendiente",
      motivo: String(data.motivo ?? ""),
      message: mensajeMotivo(data.motivo),
    };
  }
  if (data?.motivo === "NO_ELEGIBLE") {
    return { kind: "no_elegible", message: "Categoría guardada. No genera expediente QyD." };
  }
  return { kind: "guardado", message: "Categoría guardada." };
}

export function toneClasses(tone: CategoryResult["tone"]): string {
  switch (tone) {
    case "success": return "bg-success-5 text-success";
    case "warning": return "bg-warning-5 text-warning-65";
    case "error": return "bg-danger-5 text-danger";
    default: return "bg-black-5 text-black-45";
  }
}
