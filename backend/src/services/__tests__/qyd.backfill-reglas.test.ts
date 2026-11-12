import { describe, expect, it, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  porTicketGeneral: vi.fn(),
  relacionCache: vi.fn(),
  crearDesdeCategorizacion: vi.fn(),
}));

vi.mock("../../repositories/prisma", () => ({ prisma: {} }));
vi.mock("../../modules/zendesk/infrastructure/ZendeskClient", () => ({
  ZendeskClient: class {
    estaConfigurado = false;
    async obtenerTicket() { return null; }
    async searchTicketsPage() { return { tickets: [], total: 0, hasMore: false }; }
    async obtenerUsuarios() { return []; }
  },
}));
vi.mock("../../repositories/quejasDevoluciones.repository", () => ({
  qdRepository: {
    relacionCache: mocks.relacionCache,
  },
}));
vi.mock("../quejasDevoluciones.service", () => ({
  qdService: {
    porTicketGeneral: mocks.porTicketGeneral,
    crearDesdeCategorizacion: mocks.crearDesdeCategorizacion,
  },
}));

import { ejecutarBackfillZendesk, type QydBackfillTicket } from "../qydZendeskBackfill.service";

function ticket(overrides: Partial<QydBackfillTicket>): QydBackfillTicket {
  return {
    ticketId: "1",
    createdAt: "2026-07-01T00:18:48Z",
    status: "closed",
    categoriaRaw: "GESTION",
    subcategoriaRaw: "solicitud_de_devolución",
    categoriaEsHoja: false,
    domainRaw: null,
    country: "Perú",
    channelRaw: "CORREO",
    assigneeName: "Asesora",
    viaSourcePresent: false,
    followUp: false,
    parentTicketId: null,
    followupIds: [],
    ...overrides,
  };
}

function sourceCon(tickets: QydBackfillTicket[]) {
  return {
    async listarTickets() {
      return { tickets, total: tickets.length, hasMore: false };
    },
    async obtenerTicket() {
      return null;
    },
  };
}

const casoExistente = (overrides: Record<string, unknown>) => ({
  id: "caso-1",
  tipo: "devolucion",
  numero: "DEV-1",
  ticket_id: "5",
  ticket_padre_id: null,
  dominio: null,
  estado: "Pendiente de conciliación",
  caso_cerrado: false,
  ...overrides,
});

describe("Backfill dry-run — reglas definitivas QyD", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.relacionCache.mockResolvedValue(null);
    mocks.porTicketGeneral.mockResolvedValue(null);
  });

  it("separa sin categorizar, no QyD y QyD; crea SIN DOMINIO + CERRADO", async () => {
    const tickets = [
      ticket({ ticketId: "1", categoriaRaw: null, subcategoriaRaw: null }),
      ticket({ ticketId: "2", categoriaRaw: "SOFTWARE", subcategoriaRaw: "error_punto_de_venta" }),
      ticket({ ticketId: "3", domainRaw: null }),
      ticket({ ticketId: "4", domainRaw: "munanqui@gmail.com" }),
    ];

    const r = await ejecutarBackfillZendesk({
      desde: "2026-07-01",
      hasta: "2026-11-11",
      usuario: "test",
      dryRun: true,
      source: sourceCon(tickets),
      repararFechas: false,
      incluirDetalle: true,
      porPaginaDetalle: 200,
    });

    expect(r.controlPersistido).toBe(false);
    expect(r.universo).toEqual({
      total: 4,
      sinCategorizar: 1,
      noQyd: 1,
      qydElegibles: 2,
    });
    expect(r.omitidos).toBe(2);
    expect(r.candidatosCrear).toBe(2);
    expect(r.sinDominioRegularizado).toBe(2);
    expect(r.sinDominioCerrado).toBe(2);
    expect(r.pendientesRelacion).toBe(0);

    const items = r.detalle?.items ?? [];
    const porId = new Map(items.map((i) => [i.ticketId, i]));
    expect(porId.get("1")).toMatchObject({
      universo: "SIN_CATEGORIZAR", accionProyectada: "OMITIR", motivo: "SIN_CATEGORIZAR",
    });
    expect(porId.get("2")).toMatchObject({
      universo: "NO_QYD", accionProyectada: "OMITIR", motivo: "NO_ELEGIBLE_QYD",
    });
    expect(porId.get("3")).toMatchObject({
      universo: "QYD",
      sinDominio: true,
      dominioProyectado: "SIN DOMINIO",
      estadoProyectado: "CERRADO",
      casoCerradoProyectado: true,
      accionProyectada: "CREAR",
      fechaOriginalIso: "2026-07-01T00:18:48Z",
      fechaSolicitudProyectada: "2026-07-01T00:18:48Z",
    });
    expect(porId.get("4")).toMatchObject({
      universo: "QYD",
      dominioRaw: "munanqui@gmail.com",
      dominioOriginal: "munanqui@gmail.com",
      dominioProyectado: "SIN DOMINIO",
      estadoProyectado: "CERRADO",
      accionProyectada: "CREAR",
    });
  });

  it("reutiliza un expediente existente aunque la relación no esté verificada", async () => {
    mocks.porTicketGeneral.mockImplementation(async (ticketId: string) =>
      ticketId === "7" ? casoExistente({ ticket_id: "7", dominio: "cliente.restaurant.pe" }) : null
    );

    const r = await ejecutarBackfillZendesk({
      desde: "2026-07-01",
      hasta: "2026-11-11",
      usuario: "test",
      dryRun: true,
      source: sourceCon([ticket({ ticketId: "7", domainRaw: "cliente.restaurant.pe" })]),
      repararFechas: false,
      incluirDetalle: true,
    });

    expect(r.reutilizables).toBe(1);
    expect(r.detalle?.items[0]).toMatchObject({
      ticketId: "7",
      accionProyectada: "REUTILIZAR",
      motivo: "YA_EXISTE",
      evidenciaRelacion: "EXPEDIENTE_EXISTENTE",
      dominioProyectado: "cliente.restaurant.pe",
    });
  });

  it("reutiliza un expediente existente sin modificarlo aunque el ticket no tenga dominio", async () => {
    mocks.porTicketGeneral.mockImplementation(async (ticketId: string) =>
      ticketId === "5" ? casoExistente({ ticket_id: "5", dominio: null }) : null
    );

    const r = await ejecutarBackfillZendesk({
      desde: "2026-07-01",
      hasta: "2026-11-11",
      usuario: "test",
      dryRun: true,
      source: sourceCon([ticket({ ticketId: "5", domainRaw: null })]),
      repararFechas: false,
      incluirDetalle: true,
    });

    expect(r.reutilizables).toBe(1);
    expect(r.sinDominioRegularizado).toBe(0);
    expect(r.sinDominioCerrado).toBe(0);
    expect(r.detalle?.items[0]).toMatchObject({
      ticketId: "5",
      accionProyectada: "REUTILIZAR",
      motivo: "YA_EXISTE",
      dominioProyectado: null,
      estadoProyectado: "Pendiente de conciliación",
      casoCerradoProyectado: false,
    });
  });

  it("mantiene PENDIENTE_RELACION cuando hay dominio real pero no relación", async () => {
    const r = await ejecutarBackfillZendesk({
      desde: "2026-07-01",
      hasta: "2026-11-11",
      usuario: "test",
      dryRun: true,
      source: sourceCon([ticket({ ticketId: "6", domainRaw: "cliente.restaurant.pe" })]),
      repararFechas: false,
      incluirDetalle: true,
    });

    expect(r.pendientes).toBe(1);
    expect(r.pendientesRelacion).toBe(1);
    expect(r.detalle?.items[0]).toMatchObject({
      ticketId: "6",
      accionProyectada: "PENDIENTE",
      motivo: "PENDIENTE_RELACION",
      evidenciaRelacion: "RELACION_NO_DISPONIBLE",
    });
  });
});
