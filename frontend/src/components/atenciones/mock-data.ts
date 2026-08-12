import type { Ticket, Mensaje, ClienteInfo, Indicadores, EventoSistema } from "./types";

export const MOCK_FLUJO = {
  pasoActual: "solucion" as const,
  pasos: ["identificacion", "diagnostico", "solucion", "validacion", "cierre"] as const,
  labels: { identificacion: "Identificación", diagnostico: "Diagnóstico", solucion: "Solución", validacion: "Validación", cierre: "Cierre" } as const,
  objetivo: "Resolver problema de envío de comprobantes electrónicos con cobro indebido.",
};

export const MOCK_EVENTOS: EventoSistema[] = [
  { id: "e1", tipo: "herramienta", icono: "FileText", titulo: "Restafact consultado", descripcion: "Facturación consultada: Plan Base S/89.90 + Cargos adicionales S/100.00", timestamp: "10:21" },
  { id: "e2", tipo: "herramienta", icono: "BarChart3", titulo: "Dashboard FE consultado", descripcion: "Se revisó historial de facturación del cliente", timestamp: "10:22" },
  { id: "e3", tipo: "nota", icono: "BookOpen", titulo: "NotebookLM utilizado", descripcion: "Consulta: 'cobro indebido facturación electrónica'", timestamp: "10:23" },
  { id: "e4", tipo: "dev", icono: "Bug", titulo: "Ticket DEV relacionado", descripcion: "DEV-2024-0891: Error en cálculo de IGV", timestamp: "10:28" },
  { id: "e5", tipo: "herramienta", icono: "Grid3X3", titulo: "Integración revisada", descripcion: "Estado de integraciones: PedidosYa OK, Rappi OK, Uber Error", timestamp: "10:30" },
];

export const MOCK_INDICADORES: Indicadores = {
  ticketsAbiertos: 47,
  enProceso: 23,
  pendientes: 12,
  fueraSLA: 5,
  promedioEspera: "8 min",
  promedioAtencion: "14 min",
};

export const MOCK_TICKETS: Ticket[] = [
  { id: "t1", canal: "whatsapp", iniciales: "CM", nombreCliente: "Carlos Mendoza", dominio: "carlos.m@email.com", pais: "Perú", tipoCliente: "high_touch", tiempoEsperando: "5 min", tiempoAtencion: "12 min", estado: "en_proceso", categoria: "Facturación", subcategoria: "Cobro indebido", sla: "rojo", prioridad: 1, asunto: "Problema con facturación recurrente", ultimoMensaje: "Ya intenté pagar con dos tarjetas y ninguna funciona", timestamp: "10:32", noLeido: 2, agenteAsignado: "Tú" },
  { id: "t2", canal: "correo", iniciales: "ML", nombreCliente: "María López", dominio: "maria.l@empresa.com", pais: "Chile", tipoCliente: "high_touch", tiempoEsperando: "15 min", tiempoAtencion: "—", estado: "sin_atender", categoria: "Contratos", subcategoria: "Cambio de plan", sla: "amarillo", prioridad: 2, asunto: "Solicitud de cambio de plan", ultimoMensaje: "Adjunto mi DNI para la actualización del contrato", timestamp: "10:15", noLeido: 1, agenteAsignado: "—" },
  { id: "t3", canal: "whatsapp", iniciales: "AG", nombreCliente: "Andrea García", dominio: "andrea.g@outlook.com", pais: "Perú", tipoCliente: "low_touch", tiempoEsperando: "32 min", tiempoAtencion: "—", estado: "pendiente_cliente", categoria: "Reclamos", subcategoria: "Servicio no prestado", sla: "amarillo", prioridad: 3, asunto: "Reclamo por servicio no prestado", ultimoMensaje: "El técnico nunca llegó en la ventana acordada", timestamp: "09:58", noLeido: 0, agenteAsignado: "—" },
  { id: "t4", canal: "correo", iniciales: "PS", nombreCliente: "Pedro Sánchez", dominio: "pedro.s@gmail.com", pais: "Colombia", tipoCliente: "tech_touch", tiempoEsperando: "—", tiempoAtencion: "8 min", estado: "resuelto", categoria: "Facturación Electrónica", subcategoria: "Descarga de recibos", sla: "verde", prioridad: 10, asunto: "Consulta sobre facturación electrónica", ultimoMensaje: "Gracias por la ayuda, ya pude descargar mis recibos", timestamp: "09:30", noLeido: 0, agenteAsignado: "Carlos" },
  { id: "t5", canal: "meta", iniciales: "LF", nombreCliente: "Lucía Fernández", dominio: "lucia.f@yahoo.com", pais: "Perú", tipoCliente: "high_touch", tiempoEsperando: "18 min", tiempoAtencion: "25 min", estado: "en_proceso", categoria: "Cancelaciones", subcategoria: "Baja de servicio", sla: "rojo", prioridad: 1, asunto: "Cancelación de servicio", ultimoMensaje: "Quiero dar de baja el servicio desde el 01/08", timestamp: "09:12", noLeido: 3, agenteAsignado: "Tú" },
  { id: "t6", canal: "correo", iniciales: "JC", nombreCliente: "Jorge Castillo", dominio: "jorgec@techcorp.com", pais: "México", tipoCliente: "tech_touch", tiempoEsperando: "45 min", tiempoAtencion: "—", estado: "sin_atender", categoria: "Soporte Técnico", subcategoria: "Conectividad", sla: "rojo", prioridad: 2, asunto: "Problema de conexión recurrente", ultimoMensaje: "Llevo 3 días sin servicio estable", timestamp: "08:45", noLeido: 0, agenteAsignado: "—" },
  { id: "t7", canal: "whatsapp", iniciales: "RM", nombreCliente: "Rosa Martínez", dominio: "rosa.m@hotmail.com", pais: "Perú", tipoCliente: "low_touch", tiempoEsperando: "—", tiempoAtencion: "4 min", estado: "resuelto", categoria: "Datos de Contacto", subcategoria: "Actualización", sla: "verde", prioridad: 10, asunto: "Actualización de datos de contacto", ultimoMensaje: "Muchas gracias por la atención", timestamp: "08:20", noLeido: 0, agenteAsignado: "Ana" },
  { id: "t8", canal: "meta", iniciales: "DV", nombreCliente: "Diego Vargas", dominio: "diego.v@empresa.cl", pais: "Chile", tipoCliente: "high_touch", tiempoEsperando: "12 min", tiempoAtencion: "6 min", estado: "esperando_gestion", categoria: "Facturación", subcategoria: "Nota de crédito", sla: "amarillo", prioridad: 4, asunto: "Solicitud de nota de crédito", ultimoMensaje: "Necesito la nota de crédito para mi contabilidad", timestamp: "11:05", noLeido: 0, agenteAsignado: "Pedro" },
  { id: "t9", canal: "whatsapp", iniciales: "PA", nombreCliente: "Patricia Álvarez", dominio: "patricia.a@gmail.com", pais: "Perú", tipoCliente: "low_touch", tiempoEsperando: "8 min", tiempoAtencion: "—", estado: "pendiente_cliente", categoria: "Ventas", subcategoria: "Nuevo plan", sla: "verde", prioridad: 5, asunto: "Consulta sobre planes disponibles", ultimoMensaje: "Estoy revisando la información que me envió", timestamp: "11:30", noLeido: 0, agenteAsignado: "—" },
  { id: "t10", canal: "correo", iniciales: "FR", nombreCliente: "Fernando Ruiz", dominio: "fernando.r@tech.cl", pais: "Chile", tipoCliente: "tech_touch", tiempoEsperando: "55 min", tiempoAtencion: "—", estado: "esperando_desarrollo", categoria: "Soporte Técnico", subcategoria: "Bug reportado", sla: "rojo", prioridad: 2, asunto: "Error en módulo de facturación", ultimoMensaje: "El error persiste después del último deploy", timestamp: "10:50", noLeido: 0, agenteAsignado: "DEV" },
  { id: "t11", canal: "meta", iniciales: "CG", nombreCliente: "Carmen Gutiérrez", dominio: "carmen.g@outlook.com", pais: "Colombia", tipoCliente: "high_touch", tiempoEsperando: "22 min", tiempoAtencion: "18 min", estado: "en_proceso", categoria: "Facturación", subcategoria: "Doble cobro", sla: "rojo", prioridad: 1, asunto: "Cobro duplicado en tarjeta", ultimoMensaje: "Me aparecen dos cargos por el mismo monto", timestamp: "10:40", noLeido: 4, agenteAsignado: "Tú" },
  { id: "t12", canal: "whatsapp", iniciales: "HM", nombreCliente: "Humberto Miranda", dominio: "hmiranda@empresa.com", pais: "Perú", tipoCliente: "low_touch", tiempoEsperando: "3 min", tiempoAtencion: "—", estado: "sin_atender", categoria: "Información General", subcategoria: "Consulta", sla: "verde", prioridad: 6, asunto: "Consulta sobre horarios de atención", ultimoMensaje: "¿Cuál es el horario de atención en Lima?", timestamp: "11:45", noLeido: 0, agenteAsignado: "—" },
];

export const MOCK_MENSAJES: Mensaje[] = [
  { id: "m1", tipo: "cliente", emisor: "Carlos Mendoza", contenido: "Hola, buenos días. Tengo un problema con mi facturación de este mes.", timestamp: "10:15" },
  { id: "m2", tipo: "agente", emisor: "Tú", contenido: "¡Buenos días, Carlos! Claro, con gusto lo ayudo. ¿Me puede comentar qué está sucediendo?", timestamp: "10:17" },
  { id: "m3", tipo: "cliente", emisor: "Carlos Mendoza", contenido: "Resulta que me llegó un cobro de S/189.90 pero mi plan es de S/89.90. Ya revisé mi contrato y no hay cambios.", timestamp: "10:19" },
  { id: "m4", tipo: "agente", emisor: "Tú", contenido: "Entiendo, voy a revisar su historial de facturación. Permítame un momento.", timestamp: "10:21" },
  { id: "m5", tipo: "sistema", emisor: "Sistema", contenido: "Facturación consultada: Plan Base S/89.90 + Cargos adicionales S/100.00", timestamp: "10:25" },
  { id: "m6", tipo: "cliente", emisor: "Carlos Mendoza", contenido: "Ya intenté pagar con dos tarjetas diferentes y ninguna funciona", timestamp: "10:32" },
  { id: "m7", tipo: "agente", emisor: "Tú", contenido: "Veo que tiene un cargo por servicio técnico del mes pasado. ¿Autorizó usted ese servicio?", timestamp: "10:35" },
  { id: "m8", tipo: "cliente", emisor: "Carlos Mendoza", contenido: "No, yo no autoricé ningún servicio técnico adicional.", timestamp: "10:38" },
  { id: "m9", tipo: "agente", emisor: "Tú", contenido: "Entiendo. Voy a gestionar la reversión de ese cargo y la corrección de su factura.", timestamp: "10:40" },
  { id: "m10", tipo: "cliente", emisor: "Carlos Mendoza", contenido: "Perfecto, gracias. ¿En cuánto tiempo se verá reflejado?", timestamp: "10:42" },
  { id: "m11", tipo: "agente", emisor: "Tú", contenido: "La reversión se procesa en 24 a 48 horas hábiles. Le enviaré la confirmación por correo.", timestamp: "10:44" },
  { id: "m12", tipo: "cliente", emisor: "Carlos Mendoza", contenido: "Muchas gracias por su ayuda.", timestamp: "10:46" },
];

export const MOCK_CLIENTE: ClienteInfo = {
  /* General */
  nombre: "Carlos Mendoza",
  iniciales: "CM",
  dominio: "carlos.mendoza@email.com",
  telefono: "+51 999 888 777",
  correo: "carlos.mendoza@email.com",
  pais: "Perú",
  ruc: "20123456789",
  tipoCliente: "high_touch",
  fechaAlta: "15/03/2022",
  tiempoCliente: "2 años 4 meses",
  ltv: "S/ 24,850",
  estado: "activo",

  /* Producto */
  productoPrincipal: "Restaurant Web + Blue Android",
  version: "v3.2.1 (build 2847)",
  ultimaSincronizacion: "10:28:15",
  configuracionesActivas: ["Facturación Electrónica", "Notificación SMS", "API REST", "Multi-local"],
  cantidadLocales: 3,
  facturacionElectronica: true,
  estadoCDT: "Vigente",
  fechaVencimientoCDT: "31/12/2025",
  estadoCertificado: "OK",
  foliosDisponibles: 850,
  foliosConsumidos: 4200,
  foliosPendientes: 150,

  /* Historial */
  ultimasAtenciones: [
    { canal: "WhatsApp", fecha: "10/07/2025", asesor: "Ana Torres", categoria: "Facturación", subcategoria: "Cobro indebido", tiempoRespuesta: "2 min", tiempoResolucion: "45 min", resultado: "gestionar" },
    { canal: "Correo", fecha: "05/07/2025", asesor: "Carlos Ruiz", categoria: "Soporte Técnico", subcategoria: "Configuración", tiempoRespuesta: "5 min", tiempoResolucion: "1h 20min", resultado: "responder" },
    { canal: "WhatsApp", fecha: "28/06/2025", asesor: "Ana Torres", categoria: "Facturación", subcategoria: "Nota de crédito", tiempoRespuesta: "3 min", tiempoResolucion: "2h 10min", resultado: "responder" },
    { canal: "Meta", fecha: "15/06/2025", asesor: "Pedro Sánchez", categoria: "Ventas", subcategoria: "Cambio de plan", tiempoRespuesta: "1 min", tiempoResolucion: "30 min", resultado: "responder" },
    { canal: "WhatsApp", fecha: "02/06/2025", asesor: "Lucía Fernández", categoria: "Soporte Técnico", subcategoria: "Conectividad", tiempoRespuesta: "8 min", tiempoResolucion: "3h 45min", resultado: "dev" },
    { canal: "Correo", fecha: "25/05/2025", asesor: "Ana Torres", categoria: "Facturación", subcategoria: "Doble cobro", tiempoRespuesta: "4 min", tiempoResolucion: "1h 15min", resultado: "gestionar" },
    { canal: "WhatsApp", fecha: "18/05/2025", asesor: "Carlos Ruiz", categoria: "Reclamos", subcategoria: "Servicio no prestado", tiempoRespuesta: "6 min", tiempoResolucion: "4h 30min", resultado: "dev" },
    { canal: "Meta", fecha: "10/05/2025", asesor: "María López", categoria: "Información General", subcategoria: "Consulta", tiempoRespuesta: "2 min", tiempoResolucion: "15 min", resultado: "responder" },
  ],
  categoriasFrecuentes: ["Facturación (12)", "Soporte Técnico (5)", "Ventas (3)", "Reclamos (2)"],
  subcategoriasFrecuentes: ["Cobro indebido (4)", "Nota de crédito (3)", "Configuración (2)", "Conectividad (2)"],
  asesorQueMasAtendio: "Ana Torres (8 atenciones)",
  promedioResolucion: "2h 15min",
  promedioPrimeraRespuesta: "3.5 min",

  /* Diagnóstico */
  estadoFE: "Aceptado",
  documentosCola: 2,
  erroresFE: ["CDR rechazado (10/07)", "Firma inválida (08/07)"],
  integraciones: [
    { nombre: "PedidosYa", estado: "conectado", ultimaSync: "10:30:12" },
    { nombre: "Rappi", estado: "conectado", ultimaSync: "10:29:48" },
    { nombre: "Uber Eats", estado: "error", ultimaSync: "09:15:00" },
    { nombre: "Didi Food", estado: "desconectado", ultimaSync: "—" },
  ],
  logistica: { sincronizacion: "OK", colas: 12, errores: 2 },
  configuracionesCriticas: ["API REST timeout configurado en 30s", "Webhook de notificaciones caído"],

  /* Developer */
  ticketsDEV: [
    { id: "DEV-2024-0891", titulo: "Error en cálculo de IGV", estado: "En progreso", prioridad: "Alta", fechaCreacion: "08/07/2025", responsable: "Jorge Castillo", tiempoAbierto: "2 días" },
    { id: "DEV-2024-0876", titulo: "No genera XML de factura", estado: "QA", prioridad: "Media", fechaCreacion: "05/07/2025", responsable: "María López", tiempoAbierto: "5 días" },
    { id: "DEV-2024-0842", titulo: "Fallo en sincronización de stock", estado: "Pendiente", prioridad: "Baja", fechaCreacion: "28/06/2025", responsable: "—", tiempoAbierto: "12 días" },
  ],

  /* Diagnóstico Inteligente */
  diagnostico: {
    categoriaSugerida: "Facturación Electrónica",
    confianza: 92,
    subcategoriaSugerida: "Cobro indebido / Error en comprobante",
    checklist: [], // se resuelve dinámicamente por categoría
    posiblesCausas: [
      "Certificado digital vencido o próximo a vencer",
      "CDT vencido (31/12/2025)",
      "Error conocido en facturación recurrente",
      "Configuración de FE incompleta",
      "Comprobante rechazado por SUNAT",
    ],
    casosSimilares: [
      { cliente: "María López", fecha: "05/07/2025", categoria: "Facturación", resultado: "Gestionado — CDT renovado" },
      { cliente: "Diego Vargas", fecha: "28/06/2025", categoria: "Facturación", resultado: "Resuelto — Certificado actualizado" },
      { cliente: "Rosa Martínez", fecha: "15/06/2025", categoria: "FE", resultado: "Derivado a DEV — Error en XML" },
      { cliente: "Pedro Sánchez", fecha: "02/06/2025", categoria: "Facturación", resultado: "Resuelto — CDT renovado" },
      { cliente: "Lucía Fernández", fecha: "25/05/2025", categoria: "FE", resultado: "Gestionado — SUNAT aceptó" },
    ],
    recomendaciones: [
      "Verificar primero el estado del CDT antes de escalar.",
      "Existe un ticket DEV relacionado (DEV-2024-0891).",
      "Cliente ya reportó este problema hace 15 días (misma categoría).",
      "NotebookLM disponible para consultar documentación de FE.",
    ],
    riesgos: [
      { texto: "Cliente High Touch — requiere atención prioritaria", tipo: "alta" },
      { texto: "Cliente reincidente en facturación (4 atenciones)", tipo: "alta" },
      { texto: "SLA en rojo — incumplimiento inminente", tipo: "alta" },
      { texto: "Facturación detenida — cliente sin emitir comprobantes", tipo: "media" },
      { texto: "Folios Chile por terminarse (150 restantes)", tipo: "baja" },
    ],
    tiempoEstimado: "45 min — 1h 30min",
  },

  /* Notas */
  notasInternas: "Cliente High Touch con historial de reclamos por facturación. Requiere seguimiento prioritario. Contactar cada 15 días.",
  observaciones: "Ha solicitado aumento de límite de facturación en 3 ocasiones. Última solicitud aprobada.",
  clientesVIP: "Sí — Categoría Oro. Descuento especial del 15% en facturación.",
  recordatorios: "Vencimiento CDT: 31/12/2025. Renovación contrato: 15/03/2026.",
  notasAdministrativas: "Facturación consolidada. Contacto administrativo: contabilidad@carlosmendoza.pe",
};

/* ── Checklist templates por categoría ── */
const CHECKLIST_TEMPLATES: Record<string, { label: string; checked: boolean }[]> = {
  "Facturación Electrónica": [
    { label: "Revisar CDT (Estado y vencimiento)", checked: true },
    { label: "Revisar Certificado Digital", checked: true },
    { label: "Revisar comprobantes en cola", checked: false },
    { label: "Revisar estado SUNAT", checked: false },
    { label: "Revisar Restafact", checked: false },
    { label: "Revisar historial FE del cliente", checked: false },
  ],
  Integraciones: [
    { label: "Revisar Monitor de integraciones", checked: false },
    { label: "Revisar Carta de servicios", checked: false },
    { label: "Revisar Productos sincronizados", checked: true },
    { label: "Revisar Pedidos en cola", checked: false },
    { label: "Revisar Configuración de canales", checked: false },
  ],
  Logística: [
    { label: "Revisar sincronización de inventarios", checked: false },
    { label: "Revisar inventarios actuales", checked: false },
    { label: "Revisar configuración de logística", checked: true },
    { label: "Revisar pendientes de entrega", checked: false },
  ],
};

export function getChecklistItems(categoria: string): { label: string; checked: boolean }[] {
  return CHECKLIST_TEMPLATES[categoria] ?? CHECKLIST_TEMPLATES["Facturación Electrónica"];
}

export const MOCK_CASO: CasoData = {
  objetivo: "Resolver problema de envío de comprobantes electrónicos con cobro indebido.",
  resumenEjecutivo: "",
  proximoPaso: "Revisar CDT del cliente y verificar si el certificado digital está vigente.",
  checklist: [
    { label: "Cliente identificado", checked: true },
    { label: "Dominio validado", checked: true },
    { label: "Diagnóstico realizado", checked: true },
    { label: "Herramienta revisada", checked: false },
    { label: "Cliente informado", checked: false },
    { label: "Ticket DEV creado", checked: false },
    { label: "Categorización completa", checked: false },
    { label: "Cliente confirmó solución", checked: false },
    { label: "Caso listo para cerrar", checked: false },
  ],
  timeline: [
    { id: "s1", estado: "ticket_recibido", fecha: "10/07/2025", hora: "10:15", usuario: "Sistema", comentario: "Ticket recibido a través de WhatsApp." },
    { id: "s2", estado: "aceptado", fecha: "10/07/2025", hora: "10:17", usuario: "Tú", comentario: "Caso aceptado para resolución." },
    { id: "s3", estado: "diagnostico_iniciado", fecha: "10/07/2025", hora: "10:19", usuario: "Tú", comentario: "Iniciando diagnóstico. Cliente reporta cobro duplicado de S/100.00." },
    { id: "s4", estado: "informacion_solicitada", fecha: "10/07/2025", hora: "10:21", usuario: "Tú", comentario: "Solicitando autorización del servicio técnico adicional." },
    { id: "s5", estado: "cliente_respondio", fecha: "10/07/2025", hora: "10:38", usuario: "Carlos Mendoza", comentario: "Cliente confirma que no autorizó servicio adicional." },
    { id: "s6", estado: "diagnostico_finalizado", fecha: "10/07/2025", hora: "10:45", usuario: "Tú", comentario: "Diagnóstico completo: cargo no autorizado por servicio técnico. Se gestionará reversión." },
    { id: "s7", estado: "gestion_iniciada", fecha: "10/07/2025", hora: "10:46", usuario: "Tú", comentario: "Gestionando reversión del cargo y corrección de factura." },
  ],
  evidencias: [
    { tipo: "captura", nombre: "Factura_202507.png" },
    { tipo: "captura", nombre: "Historial_cargos.png" },
    { tipo: "log", nombre: "sistema_fe_log_20250710.txt" },
    { tipo: "enlace", nombre: "Dashboard FE Cliente" },
  ],
  herramientas: ["Dominio", "Restafact", "Dashboard FE", "NotebookLM", "Microservice"],
  resultado: "pendiente",
  lecciones: [
    "Verificar siempre autorización del cliente antes de procesar cargos adicionales.",
    "Documentar el consentimiento del cliente en notas del caso.",
    "Revisar el historial de facturación antes de escalar a DEV.",
  ],
};

import type { CasoData } from "./types";
