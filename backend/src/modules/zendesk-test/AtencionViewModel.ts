export interface AtencionViewModel {
  id: string;
  canal: string;
  ticket: {
    id: string;
    ticketOriginalId: string;
    ticketOriginalStatus: string;
    asunto: string;
    descripcion: string;
    prioridad: string;
    tipo: string;
    createdAt: string;
    updatedAt: string;
    tags: string[];
    url: string;
  };
  cliente: {
    id: string;
    nombre: string;
    correo: string;
    telefono: string | null;
    empresa: string | null;
    rol: string;
    fechaCreacion: string;
    ultimaActividad: string | null;
    totalTickets: number;
    ticketsAbiertos: number;
    ultimosTickets: { ticketId: string; asunto: string; estado: string; fecha: string }[];
  };
  comentarios: {
    id: string;
    contenido: string;
    emisor: string;
    tipo: "cliente" | "agente" | "sistema";
    timestamp: string;
    publico: boolean;
    adjuntos: { id: string; nombre: string; url: string }[];
  }[];
  totalComentarios: number;
}
