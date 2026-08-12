import { EstadoOperativoCOPE } from "./EstadoOperativo";
import { VentanaVisibilidadStore } from "./VentanaVisibilidad";

export interface TicketVisibilidad {
  id: string;
  canal: string;
  estadoCanal: string;
  ultimaActividad: string;
  createdAt: string;
}

export interface TicketConVisibilidad extends TicketVisibilidad {
  estadoOperativo: EstadoOperativoCOPE;
  ventanaHoras: number;
  expiraEn: string;
}

const ESTADOS_ACTIVOS = new Set(["new", "open", "pending", "hold", "waiting"]);

export class VisibilityEngine {
  private ventanas: VentanaVisibilidadStore;

  constructor(ventanas?: VentanaVisibilidadStore) {
    this.ventanas = ventanas ?? new VentanaVisibilidadStore();
  }

  evaluar(ticket: TicketVisibilidad): TicketConVisibilidad {
    const ventana = this.ventanas.obtener(ticket.canal);
    const estadoCanal = ticket.estadoCanal.toLowerCase();
    const esActivo = ESTADOS_ACTIVOS.has(estadoCanal);

    if (esActivo) {
      return {
        ...ticket,
        estadoOperativo: "ACTIVA",
        ventanaHoras: ventana.horas,
        expiraEn: this.calcularExpiracion(ticket.ultimaActividad, ventana.horas),
      };
    }

    const resueltoEn = new Date(ticket.ultimaActividad).getTime();
    const ahora = Date.now();
    const horasTranscurridas = (ahora - resueltoEn) / 3600000;

    if (horasTranscurridas <= ventana.horas) {
      return {
        ...ticket,
        estadoOperativo: "RECIENTE",
        ventanaHoras: ventana.horas,
        expiraEn: this.calcularExpiracion(ticket.ultimaActividad, ventana.horas),
      };
    }

    return {
      ...ticket,
      estadoOperativo: "ARCHIVADA",
      ventanaHoras: ventana.horas,
      expiraEn: this.calcularExpiracion(ticket.ultimaActividad, ventana.horas),
    };
  }

  evaluarMuchos(tickets: TicketVisibilidad[]): TicketConVisibilidad[] {
    return tickets.map((t) => this.evaluar(t));
  }

  visiblesEnBandeja(tickets: TicketVisibilidad[]): TicketConVisibilidad[] {
    return this.evaluarMuchos(tickets).filter((t) => t.estadoOperativo !== "ARCHIVADA");
  }

  private calcularExpiracion(ultimaActividad: string, horas: number): string {
    const fecha = new Date(ultimaActividad);
    fecha.setHours(fecha.getHours() + horas);
    return fecha.toISOString();
  }
}
