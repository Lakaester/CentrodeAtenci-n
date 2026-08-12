import { ZendeskClient } from "../zendesk/infrastructure/ZendeskClient";

export interface CustomerData {
  id: string;
  nombre: string;
  correo: string;
  telefono: string | null;
  empresa: string | null;
  rol: string;
  idioma: string | null;
  zonaHoraria: string | null;
  fechaCreacion: string;
  ultimaActividad: string | null;
  tags: string[];
  totalTickets: number;
  ticketsAbiertos: number;
}

export class ZendeskCustomerService {
  private client: ZendeskClient;

  constructor() {
    this.client = new ZendeskClient();
  }

  async obtenerCliente(usuarioId: number): Promise<CustomerData | null> {
    const user = await this.client.obtenerUsuario(usuarioId);
    if (!user) return null;

    const [org, ticketsData] = await Promise.all([
      user.organization_id ? this.client.obtenerOrganizacion(user.organization_id) : Promise.resolve(null),
      this.client.listarTicketsPorSolicitante(usuarioId),
    ]);

    const abiertos = ticketsData.tickets.filter((t) => t.status !== "closed" && t.status !== "solved");

    return {
      id: String(user.id),
      nombre: user.name,
      correo: user.email,
      telefono: user.phone,
      empresa: org?.name ?? null,
      rol: user.role,
      idioma: null,
      zonaHoraria: null,
      fechaCreacion: user.created_at,
      ultimaActividad: ticketsData.tickets.length > 0
        ? ticketsData.tickets.sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0].updated_at
        : null,
      tags: [],
      totalTickets: ticketsData.total,
      ticketsAbiertos: abiertos.length,
    };
  }

  async obtenerHistorial(requesterId: number) {
    const user = await this.client.obtenerUsuario(requesterId);
    if (!user) return { total: 0, porCanal: {}, primeraAtencion: null, ultimaAtencion: null, tiempoPromedioResolucion: null, tickets: [], usuario: null };

    // Use Search API with email for precise filtering (more reliable than requester_id param)
    const ticketsData = await this.client.searchTickets(`type:ticket requester:${user.email}`, 30);

    const tickets = ticketsData.tickets
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 30)
      .map((t) => ({
        id: String(t.id),
        asunto: t.subject,
        estado: t.status,
        prioridad: t.priority,
        canal: "correo",
        categoria: t.tags?.[0] ?? null,
        fecha: t.created_at,
      }));

    const tiempos = ticketsData.tickets
      .filter((t) => t.status === "solved" || t.status === "closed")
      .map((t) => {
        const creado = new Date(t.created_at).getTime();
        const actualizado = new Date(t.updated_at).getTime();
        return (actualizado - creado) / 60000;
      });
    const promedioResolucion = tiempos.length > 0
      ? Math.round(tiempos.reduce((a, b) => a + b, 0) / tiempos.length)
      : null;

    return {
      total: ticketsData.total,
      porCanal: { correo: tickets.length },
      primeraAtencion: tickets[tickets.length - 1]?.fecha ?? null,
      ultimaAtencion: tickets[0]?.fecha ?? null,
      tiempoPromedioResolucion: promedioResolucion,
      tickets,
      usuario: { nombre: user.name, correo: user.email },
    };
  }
}
