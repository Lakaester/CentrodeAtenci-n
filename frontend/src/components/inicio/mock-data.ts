import type { InicioData } from "./types";

export const MOCK_DATA: InicioData = {
  general: {
    pendientes: 47,
    enProceso: 23,
    esperandoCliente: 12,
    resueltosHoy: 156,
    slaCumplimiento: 94.2,
  },
  canales: {
    whatsapp: {
      pendientes: 18,
      sla: 96,
      mayorEspera: "12 min",
      volumenDia: 89,
      trend: 8,
    },
    correo: {
      pendientes: 29,
      sla: 91,
      mayorEspera: "45 min",
      volumenDia: 67,
      trend: -3,
    },
    consolidado: {
      pendientes: 47,
      sla: 94,
      mayorEspera: "45 min",
      volumenDia: 156,
      trend: 5,
    },
  },
  alertas: [
    {
      id: "a1",
      tipo: "sla",
      mensaje: "Cliente High Touch próximo a incumplir SLA",
      severidad: "alta",
    },
    {
      id: "a2",
      tipo: "volumen",
      mensaje: "Categoría Facturación con incremento de volumen (+23%)",
      severidad: "alta",
    },
    {
      id: "a3",
      tipo: "sobrecarga",
      mensaje: "Asesor María López con sobrecarga (18 atenciones activas)",
      severidad: "media",
    },
    {
      id: "a4",
      tipo: "dev",
      mensaje: "12 tickets DEV pendientes por revisión",
      severidad: "media",
    },
    {
      id: "a5",
      tipo: "sla",
      mensaje: "Categoría Reclamos con SLA al 82% (umbral 90%)",
      severidad: "baja",
    },
  ],
  equipo: [
    { id: "e1", nombre: "Carlos Mendoza", iniciales: "CM", estado: "Disponible", atencionesActivas: 3, sla: 98, ultimaActividad: "Hace 2 min" },
    { id: "e2", nombre: "María López", iniciales: "ML", estado: "Ocupado", atencionesActivas: 18, sla: 87, ultimaActividad: "Hace 1 min" },
    { id: "e3", nombre: "Andrea García", iniciales: "AG", estado: "Disponible", atencionesActivas: 5, sla: 95, ultimaActividad: "Hace 5 min" },
    { id: "e4", nombre: "Pedro Sánchez", iniciales: "PS", estado: "En pausa", atencionesActivas: 0, sla: 100, ultimaActividad: "Hace 15 min" },
    { id: "e5", nombre: "Lucía Fernández", iniciales: "LF", estado: "Ocupado", atencionesActivas: 7, sla: 92, ultimaActividad: "Hace 3 min" },
    { id: "e6", nombre: "Jorge Castillo", iniciales: "JC", estado: "Fuera de línea", atencionesActivas: 0, sla: 0, ultimaActividad: "Hace 2 h" },
  ],
  tendencias: [
    { categoria: "Facturación", hoy: 42, variacion: 23 },
    { categoria: "Soporte Técnico", hoy: 38, variacion: 12 },
    { categoria: "Reclamos", hoy: 28, variacion: -5 },
    { categoria: "Ventas", hoy: 24, variacion: 8 },
    { categoria: "Cancelaciones", hoy: 18, variacion: -15 },
    { categoria: "Información General", hoy: 15, variacion: 3 },
    { categoria: "Cambios de Plan", hoy: 12, variacion: -8 },
    { categoria: "Facturación Electrónica", hoy: 10, variacion: 20 },
  ],
  dev: {
    pendientes: 12,
    enDesarrollo: 8,
    qa: 5,
    cerradosHoy: 3,
  },
};
