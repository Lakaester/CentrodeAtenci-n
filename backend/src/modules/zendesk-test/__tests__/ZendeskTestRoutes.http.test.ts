import { describe, it, expect, vi, beforeAll, afterAll, beforeEach } from "vitest";
import express from "express";
import http from "http";

const mocks = vi.hoisted(() => ({
  usuarioPorToken: vi.fn(),
  hasPermiso: vi.fn(),
  categorize: vi.fn(),
  obtenerTicket: vi.fn(),
  registrarClasificacion: vi.fn(),
  crearDesdeCategorizacion: vi.fn(),
  porTicketGeneral: vi.fn(),
  obtenerContextoQydLocal: vi.fn(),
}));

vi.mock("../../../services/auth.service", () => ({
  authService: {
    COOKIE_NAME: "cope_session",
    usuarioPorToken: mocks.usuarioPorToken,
    hasPermiso: mocks.hasPermiso,
  },
}));
vi.mock("../ZendeskTestService", () => ({ ZendeskTestService: class {} }));
vi.mock("../ZendeskInboxService", () => ({ ZendeskInboxService: class {} }));
vi.mock("../ZendeskCustomerService", () => ({ ZendeskCustomerService: class {} }));
vi.mock("../AtencionViewModelService", () => ({ AtencionViewModelService: class {} }));
vi.mock("../AtencionCompletaService", () => ({ AtencionCompletaService: class {} }));
vi.mock("../ClientStore", () => ({ ClientStore: { registrar: vi.fn() } }));
vi.mock("../AgentStore", () => ({ AgentStore: {} }));
vi.mock("../ZendeskActionsService", () => ({
  ZendeskActionsService: class { categorize = mocks.categorize; },
}));
vi.mock("../ZendeskTicketService", () => ({
  ZendeskTicketService: class { obtenerTicket = mocks.obtenerTicket; },
}));
vi.mock("../CustomerMemory", () => ({
  CustomerMemory: { registrarCategoria: vi.fn(), registrarResolucion: vi.fn() },
}));
vi.mock("../../../integrations/atenciones/services/AtencionOperativaService", () => ({
  atencionOperativaService: { registrarClasificacion: mocks.registrarClasificacion },
}));
vi.mock("../../../services/quejasDevoluciones.service", () => ({
  qdService: {
    crearDesdeCategorizacion: mocks.crearDesdeCategorizacion,
    porTicketGeneral: mocks.porTicketGeneral,
  },
}));
vi.mock("../../../services/qydContextoLocal.service", () => ({
  obtenerContextoQydLocal: mocks.obtenerContextoQydLocal,
}));
vi.mock("../../../repositories/prisma", () => ({ prisma: {} }));
vi.mock("../../zendesk/infrastructure/ZendeskClient", () => ({ ZendeskClient: class {} }));
vi.mock("../../../config/env", () => ({ env: { QD_AUTO_CREATE_ENABLED: true } }));

import { zendeskTestRouter } from "../ZendeskTestRoutes";
import { requireAuth } from "../../../middlewares/auth.middleware";

const ETIQUETA = "Ana Perez (usr-ana)";
let allowAtenciones = true;
let allowQyd = true;
let server: http.Server;
let port = 0;

const usuario = {
  id: "usr-ana",
  nombre: "Ana",
  apellido: "Perez",
  correo: "ana@cope.pe",
  permisos: [],
};

beforeAll(async () => {
  const app = express();
  app.use(express.json());
  app.use("/zendesk", requireAuth, zendeskTestRouter);
  server = app.listen(0);
  await new Promise<void>((resolve) => server.once("listening", () => resolve()));
  port = (server.address() as any).port;
});

afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

beforeEach(() => {
  vi.clearAllMocks();
  allowAtenciones = true;
  allowQyd = true;
  mocks.usuarioPorToken.mockResolvedValue(usuario);
  mocks.hasPermiso.mockImplementation((_u: any, modulo: string, accion: string) => {
    if (modulo === "Atenciones" && accion === "editar") return allowAtenciones;
    if (modulo === "Quejas y Devoluciones" && accion === "crear") return allowQyd;
    return false;
  });
  mocks.categorize.mockResolvedValue({ success: true, ticketId: "34576" });
  mocks.registrarClasificacion.mockResolvedValue(undefined);
  mocks.obtenerTicket.mockResolvedValue(null);
  mocks.obtenerContextoQydLocal.mockResolvedValue({
    ticketId: "34576",
    dominio: "cesars.restaurant.pe",
    pais: "perú",
    canal: "CORREO",
    canalRaw: "email",
    asesor: "Ana Asesora",
    estado: "open",
    fechaOriginalIso: "2026-07-05T15:00:00Z",
    ticketPadreId: null,
    followupIds: [],
    relacionVerificada: true,
    fuente: { atencion: true, vista: false, relacionCache: false },
  });
  mocks.crearDesdeCategorizacion.mockResolvedValue({
    caso: { id: "c1", numero: "DEV-1", tipo: "devolucion" },
    reutilizado: false,
    interaccionAsociada: false,
    creado: true,
  });
});

async function post(withCookie = true) {
  const res = await fetch(`http://127.0.0.1:${port}/zendesk/tickets/34576/categorize`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(withCookie ? { cookie: "cope_session=valid" } : {}),
    },
    body: JSON.stringify({
      categoria: "DEVOLUCIÓN",
      subcategoria: "solicitud_de_devolución",
      canal: "email",
      autor: "Otro Asesor",
    }),
  });
  return { status: res.status, json: await res.json() as any };
}

describe("HTTP /zendesk/tickets/:id/categorize — Fase 1.1.2", () => {
  it("sin cookie → 401", async () => {
    const r = await post(false);
    expect(r.status).toBe(401);
    expect(r.json).toMatchObject({ code: "UNAUTHENTICATED" });
    expect(mocks.categorize).not.toHaveBeenCalled();
  });

  it("autenticado sin Atenciones.editar → 403", async () => {
    allowAtenciones = false;
    const r = await post();
    expect(r.status).toBe(403);
    expect(r.json).toMatchObject({ code: "FORBIDDEN" });
    expect(mocks.categorize).not.toHaveBeenCalled();
  });

  it("Atenciones.editar sin QyD.crear → 200 SIN_PERMISO_QYD", async () => {
    allowQyd = false;
    const r = await post();
    expect(r.status).toBe(200);
    expect(r.json.data).toMatchObject({ motivo: "SIN_PERMISO_QYD", expedientePendiente: true, caso: null });
    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
    expect(mocks.registrarClasificacion).toHaveBeenCalledWith("34576", expect.objectContaining({ usuario: ETIQUETA }));
  });

  it("con ambos permisos → 200 y usa identidad autenticada", async () => {
    const r = await post();
    expect(r.status).toBe(200);
    expect(r.json.data).toMatchObject({ creado: true, caso: { numero: "DEV-1" }, canal: "CORREO" });
    expect(mocks.categorize).toHaveBeenCalledWith(34576, "DEVOLUCIÓN", "solicitud_de_devolución", ETIQUETA);
    expect(mocks.registrarClasificacion).toHaveBeenCalledWith("34576", expect.objectContaining({ usuario: ETIQUETA }));
    expect(mocks.crearDesdeCategorizacion).toHaveBeenCalledWith(expect.objectContaining({
      asesor: "Ana Asesora",
      dominio: "cesars.restaurant.pe",
      permitirZendesk: false,
      pais: "perú",
    }), ETIQUETA);
  });
});
