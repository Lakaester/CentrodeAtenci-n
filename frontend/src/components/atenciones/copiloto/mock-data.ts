export interface CopilotoData {
  resumen: { categoria: string; subcategoria: string; confianza: number; tiempoEstimado: string; prioridad: string };
  pasos: string[];
  infoFaltante: { label: string; presente: boolean }[];
  respuestaSugerida: string;
  macros: string[];
  notebookLM: string;
  casosSimilares: { cliente: string; fecha: string; resultado: string }[];
  checklist: { label: string; checked: boolean }[];
  alertas: { texto: string; tipo: "alta" | "media" | "baja" }[];
  antesCerrar: { label: string; ok: boolean }[];
}

export const MOCK_COPILOTO: CopilotoData = {
  resumen: {
    categoria: "Facturación Electrónica",
    subcategoria: "Cobro indebido / Error en comprobante",
    confianza: 92,
    tiempoEstimado: "45 min — 1h 30min",
    prioridad: "Alta — SLA en rojo",
  },
  pasos: [
    "Revisar CDT del cliente",
    "Revisar certificado digital",
    "Revisar Dashboard FE",
    "Informar al cliente",
    "Categorizar y cerrar",
  ],
  infoFaltante: [
    { label: "Dominio", presente: true },
    { label: "Número telefónico", presente: true },
    { label: "Correo", presente: true },
    { label: "RUC", presente: false },
    { label: "Versión del producto", presente: false },
    { label: "Fecha de alta", presente: true },
  ],
  respuestaSugerida: "Estimado cliente, hemos identificado el problema en su facturación. Procederemos con la reversión del cargo de S/100.00 en las próximas 24-48 horas hábiles. Le enviaremos la confirmación por correo electrónico.",
  macros: ["Macro FE — Revisión rápida de CDT", "Macro FE — Corrección de comprobantes", "Macro FE — Nota de crédito"],
  notebookLM: "Guía de resolución de problemas de Facturación Electrónica — Errores comunes y soluciones.",
  casosSimilares: [
    { cliente: "Diego Vargas", fecha: "28/06/2025", resultado: "Resuelto — Certificado actualizado" },
    { cliente: "María López", fecha: "05/07/2025", resultado: "Gestionado — CDT renovado" },
    { cliente: "Rosa Martínez", fecha: "15/06/2025", resultado: "Derivado a DEV" },
  ],
  checklist: [
    { label: "Cliente identificado", checked: true },
    { label: "Dominio validado", checked: true },
    { label: "Diagnóstico realizado", checked: true },
    { label: "Herramienta revisada", checked: false },
    { label: "Cliente informado", checked: false },
    { label: "Categorización completa", checked: false },
  ],
  alertas: [
    { texto: "SLA próximo a vencer (65%)", tipo: "alta" },
    { texto: "Cliente High Touch — prioridad máxima", tipo: "alta" },
    { texto: "Ticket DEV relacionado (DEV-2024-0891)", tipo: "media" },
    { texto: "Cliente reincidente en facturación (4 atenciones)", tipo: "media" },
    { texto: "Espera prolongada — 5 min", tipo: "baja" },
  ],
  antesCerrar: [
    { label: "Categorizar ticket", ok: false },
    { label: "Registrar subcategoría", ok: false },
    { label: "Registrar dominio", ok: true },
    { label: "Registrar resolución", ok: false },
    { label: "Informar al cliente", ok: false },
  ],
};
