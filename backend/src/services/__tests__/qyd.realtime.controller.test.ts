import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  categorize: vi.fn(),
  obtenerTicket: vi.fn(),
  registrarClasificacion: vi.fn(),
  crearDesdeCategorizacion: vi.fn(),
  porTicketGeneral: vi.fn(),
  registrarCategoria: vi.fn(),
  obtenerContextoQydLocal: vi.fn(),
}));

vi.mock("../../modules/zendesk-test/ZendeskTestService", () => ({
  ZendeskTestService: class { testConnection = vi.fn(); },
}));
vi.mock("../../modules/zendesk-test/ZendeskInboxService", () => ({
  ZendeskInboxService: class { obtenerInbox = vi.fn(); },
}));
vi.mock("../../modules/zendesk-test/ZendeskCustomerService", () => ({
  ZendeskCustomerService: class { obtenerHistorial = vi.fn(); },
}));
vi.mock("../../modules/zendesk-test/AtencionViewModelService", () => ({
  AtencionViewModelService: class { assemble = vi.fn(); },
}));
vi.mock("../../modules/zendesk-test/AtencionCompletaService", () => ({
  AtencionCompletaService: class { obtenerAtencionCompleta = vi.fn(); },
}));
vi.mock("../../modules/zendesk-test/ClientStore", () => ({
  ClientStore: { registrar: vi.fn() },
}));
vi.mock("../../modules/zendesk-test/AgentStore", () => ({
  AgentStore: {},
}));
vi.mock("../../modules/zendesk-test/ZendeskActionsService", () => ({
  ZendeskActionsService: class { categorize = mocks.categorize; },
}));
vi.mock("../../modules/zendesk-test/ZendeskTicketService", () => ({
  ZendeskTicketService: class { obtenerTicket = mocks.obtenerTicket; },
}));
vi.mock("../../modules/zendesk-test/CustomerMemory", () => ({
  CustomerMemory: { registrarCategoria: mocks.registrarCategoria },
}));
vi.mock("../../integrations/atenciones/services/AtencionOperativaService", () => ({
  atencionOperativaService: { registrarClasificacion: mocks.registrarClasificacion },
}));
vi.mock("../quejasDevoluciones.service", () => ({
  qdService: {
    crearDesdeCategorizacion: mocks.crearDesdeCategorizacion,
    porTicketGeneral: mocks.porTicketGeneral,
  },
}));
vi.mock("../qydContextoLocal.service", () => ({
  obtenerContextoQydLocal: mocks.obtenerContextoQydLocal,
}));
// Evita side effects de módulos que no participan en categorize.
vi.mock("../../modules/zendesk/infrastructure/ZendeskClient", () => ({
  ZendeskClient: class {},
}));
vi.mock("../../repositories/prisma", () => ({ prisma: {} }));
vi.mock("../../config/env", () => ({ env: { QD_AUTO_CREATE_ENABLED: true } }));

import { zendeskTestController } from "../../modules/zendesk-test/ZendeskTestController";

const defaultAuth = {
  id: "usr-ana",
  nombre: "Ana",
  apellido: "Perez",
  correo: "ana@cope.pe",
  permisos: [
    { modulo: "Atenciones", accion: "editar", permitido: true },
    { modulo: "Quejas y Devoluciones", accion: "crear", permitido: true },
  ],
};

const NOMBRE = "Ana Perez";
const ETIQUETA = "Ana Perez (usr-ana)";

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function makeReq(body: Record<string, unknown>, id = "34576", auth: any = defaultAuth) {
  return { params: { id }, body, auth } as any;
}

const caso = { id: "c1", numero: "DEV-34576", tipo: "devolucion" };
const contextoBase = {
  ticketId: "34576",
  dominio: "cesars.restaurant.pe",
  dominioOriginal: "cesars.restaurant.pe",
  pais: "perú",
  canal: "CORREO",
  canalRaw: "email",
  asesor: "Ana Asesora",
  estado: "open",
  fechaOriginalIso: "2026-07-05T15:00:00Z",
  ticketPadreId: null,
  followupIds: [],
  relacionVerificada: true,
  fuente: { atencion: true, vista: true, relacionCache: true },
};

describe("ZendeskTestController.categorize — Fase 1.1", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.categorize.mockResolvedValue({ success: true, ticketId: "34576", categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución" });
    mocks.registrarClasificacion.mockResolvedValue(undefined);
    mocks.obtenerTicket.mockResolvedValue(null);
    mocks.obtenerContextoQydLocal.mockResolvedValue(contextoBase);
    mocks.crearDesdeCategorizacion.mockResolvedValue({
      caso,
      reutilizado: false,
      interaccionAsociada: false,
      creado: true,
    });
    mocks.porTicketGeneral.mockResolvedValue(null);
  });

  it("H-02: usa la identidad autenticada, no body.autor", async () => {
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", autor: "COPE", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.categorize).toHaveBeenCalledWith(34576, "DEVOLUCIÓN", "solicitud_de_devolución", ETIQUETA);
    expect(mocks.registrarClasificacion).toHaveBeenCalledWith("34576", expect.objectContaining({
      categoria: "DEVOLUCIÓN",
      subcategoria: "solicitud_de_devolución",
      usuario: ETIQUETA,
      origen: "zendesk",
    }));
    expect(mocks.crearDesdeCategorizacion).toHaveBeenCalledWith(expect.objectContaining({
      ticketId: "34576",
      tipo: "devolucion",
      asesor: "Ana Asesora",
      canal: "CORREO",
      estadoTicket: "open",
      dominio: "cesars.restaurant.pe",
      relacionVerificada: true,
      followupIds: [],
      fechaSolicitud: "2026-07-05T15:00:00Z",
      permitirSinRelacionVerificada: true,
    }), ETIQUETA);
    expect(res.status).not.toHaveBeenCalled();
    expect(mocks.obtenerTicket).not.toHaveBeenCalled();
  });

  it("H-02: ignora un autor de otro asesor enviado en el body", async () => {
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", autor: "Otro Asesor", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.categorize).toHaveBeenCalledWith(34576, "DEVOLUCIÓN", "solicitud_de_devolución", ETIQUETA);
    expect(mocks.registrarClasificacion).toHaveBeenCalledWith("34576", expect.objectContaining({ usuario: ETIQUETA }));
    expect(mocks.crearDesdeCategorizacion).toHaveBeenCalledWith(expect.objectContaining({ asesor: "Ana Asesora" }), ETIQUETA);
  });

  it("H-02: funciona si el body omite autor", async () => {
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.categorize).toHaveBeenCalledWith(34576, "DEVOLUCIÓN", "solicitud_de_devolución", ETIQUETA);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it("H-02: sin sesión autenticada → 401, sin acciones", async () => {
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" }, "34576", null);
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.categorize).not.toHaveBeenCalled();
    expect(mocks.registrarClasificacion).not.toHaveBeenCalled();
    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
  });

  it("H-01: sin permiso QyD guarda categoría y deja expediente pendiente", async () => {
    const authSinQyd = {
      ...defaultAuth,
      permisos: [{ modulo: "Atenciones", accion: "editar", permitido: true }],
    };
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" }, "34576", authSinQyd);
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.registrarClasificacion).toHaveBeenCalledTimes(1);
    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({
        caso: null,
        motivo: "SIN_PERMISO_QYD",
        expedientePendiente: true,
      }),
    }));
  });

  it("H-03: ignora dominio del body y usa el del ticket", async () => {
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email", dominio: "otro-cliente.com" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).toHaveBeenCalledWith(expect.objectContaining({
      dominio: "cesars.restaurant.pe",
    }), ETIQUETA);
  });

  it("H-03: ignora país del body y usa el del ticket", async () => {
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email", pais: "Chile" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).toHaveBeenCalledWith(expect.objectContaining({
      pais: "perú",
    }), ETIQUETA);
  });

  it("H-03: body sin dominio/país usa los valores del ticket", async () => {
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).toHaveBeenCalledWith(expect.objectContaining({
      dominio: "cesars.restaurant.pe",
      pais: "perú",
    }), ETIQUETA);
  });

  it("H-03: ticket sin dominio válido → crea/reutiliza SIN DOMINIO aunque el body traiga dominio", async () => {
    mocks.obtenerContextoQydLocal.mockResolvedValue({
      ...contextoBase, dominio: null, dominioOriginal: null,
    });
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email", dominio: "otro-cliente.com" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).toHaveBeenCalledWith(expect.objectContaining({
      dominio: null,
      dominioOriginal: null,
      permitirSinRelacionVerificada: true,
    }), ETIQUETA);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({ caso: expect.anything(), motivo: null, expedientePendiente: false }),
    }));
  });

  it("H-03: ticket sin país → pais null", async () => {
    mocks.obtenerContextoQydLocal.mockResolvedValue({ ...contextoBase, pais: null });
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email", pais: "Chile" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).toHaveBeenCalledWith(expect.objectContaining({ pais: null }), ETIQUETA);
  });

  it("sin canal → PENDIENTE_CANAL, sin asumir CORREO", async () => {
    mocks.obtenerContextoQydLocal.mockResolvedValue({ ...contextoBase, canal: null, canalRaw: null });
    mocks.crearDesdeCategorizacion.mockResolvedValue({
      caso: null, reutilizado: false, interaccionAsociada: false, creado: false, motivoNoCreacion: "PENDIENTE_CANAL",
    });
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({ caso: null, motivo: "PENDIENTE_CANAL", expedientePendiente: true, canal: null }),
    }));
  });

  it("H-04: relación no resuelta con padre conocido → PENDIENTE_RELACION y expediente pendiente", async () => {
    mocks.obtenerContextoQydLocal.mockResolvedValue({
      ...contextoBase, relacionVerificada: false, ticketPadreId: "33967",
    });
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({
        caso: null,
        creado: false,
        motivo: "PENDIENTE_RELACION",
        expedientePendiente: true,
      }),
    }));
  });

  it("canal desconocido → CANAL_NO_SOPORTADO", async () => {
    mocks.obtenerContextoQydLocal.mockResolvedValue({ ...contextoBase, canal: null, canalRaw: "telefono" });
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "telefono" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({ motivo: "CANAL_NO_SOPORTADO", expedientePendiente: true }),
    }));
  });

  it("fallo al persistir la clasificación → 500, no crea expediente", async () => {
    mocks.registrarClasificacion.mockRejectedValue(new Error("db down"));
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: "ERROR_PERSISTENCIA_ATENCION" }),
    }));
    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
  });

  it("fallo al crear el expediente → 500 con error explícito", async () => {
    mocks.crearDesdeCategorizacion.mockRejectedValue(new Error("db down"));
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: false,
      error: expect.objectContaining({ code: "ERROR_CREACION_EXPEDIENTE" }),
      data: expect.objectContaining({ expedientePendiente: true }),
    }));
  });

  it("categoría no elegible → NO_ELEGIBLE, no llama al servicio QyD", async () => {
    const req = makeReq({ categoria: "Consulta general", subcategoria: "", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({ motivo: "NO_ELEGIBLE", expedientePendiente: false }),
    }));
  });

  it("expediente existente → reutilizado y casoReutilizado", async () => {
    mocks.crearDesdeCategorizacion.mockResolvedValue({
      caso, reutilizado: true, interaccionAsociada: true, creado: false,
    });
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({
        caso,
        creado: false,
        reutilizado: true,
        casoReutilizado: true,
        expedientePendiente: false,
      }),
    }));
  });

  it("sin fecha original en PostgreSQL → PENDIENTE_FECHA sin crear", async () => {
    mocks.obtenerContextoQydLocal.mockResolvedValue({ ...contextoBase, fechaOriginalIso: null });
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({ caso: null, motivo: "PENDIENTE_FECHA", expedientePendiente: true }),
    }));
  });

  it("sin atención local → PENDIENTE_ATENCION sin crear", async () => {
    mocks.obtenerContextoQydLocal.mockResolvedValue(null);
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({ caso: null, motivo: "PENDIENTE_ATENCION", expedientePendiente: true }),
    }));
  });

  it("follow-up usa padre/follow-ups locales y prohíbe Zendesk", async () => {
    mocks.obtenerContextoQydLocal.mockResolvedValue({
      ...contextoBase,
      ticketPadreId: "33967",
      followupIds: ["34577"],
      relacionVerificada: true,
    });
    const req = makeReq({ categoria: "DEVOLUCIÓN", subcategoria: "solicitud_de_devolución", canal: "email" });
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.crearDesdeCategorizacion).toHaveBeenCalledWith(expect.objectContaining({
      ticketId: "34576",
      ticketPadreId: "33967",
      followupIds: ["34577"],
      relacionVerificada: true,
      permitirZendesk: false,
    }), ETIQUETA);
    expect(mocks.obtenerTicket).not.toHaveBeenCalled();
  });
});
