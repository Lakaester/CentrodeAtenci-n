import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  internalNote: vi.fn(),
  assign: vi.fn(),
  changeStatus: vi.fn(),
  reply: vi.fn(),
  responderYResolver: vi.fn(),
  registrarAccion: vi.fn(),
  registrarResolucion: vi.fn(),
}));

vi.mock("../../modules/zendesk-test/ZendeskTestService", () => ({ ZendeskTestService: class {} }));
vi.mock("../../modules/zendesk-test/ZendeskInboxService", () => ({ ZendeskInboxService: class {} }));
vi.mock("../../modules/zendesk-test/ZendeskCustomerService", () => ({ ZendeskCustomerService: class {} }));
vi.mock("../../modules/zendesk-test/AtencionViewModelService", () => ({ AtencionViewModelService: class {} }));
vi.mock("../../modules/zendesk-test/AtencionCompletaService", () => ({ AtencionCompletaService: class {} }));
vi.mock("../../modules/zendesk-test/ClientStore", () => ({ ClientStore: { registrar: vi.fn() } }));
vi.mock("../../modules/zendesk-test/AgentStore", () => ({ AgentStore: {} }));
vi.mock("../../modules/zendesk-test/ZendeskTicketService", () => ({ ZendeskTicketService: class {} }));
vi.mock("../../modules/zendesk-test/ZendeskActionsService", () => ({
  ZendeskActionsService: class {
    internalNote = mocks.internalNote;
    assign = mocks.assign;
    changeStatus = mocks.changeStatus;
    reply = mocks.reply;
    responderYResolver = mocks.responderYResolver;
  },
}));
vi.mock("../../modules/zendesk-test/CustomerMemory", () => ({
  CustomerMemory: { registrarResolucion: mocks.registrarResolucion, registrarCategoria: vi.fn() },
}));
vi.mock("../../integrations/atenciones/services/AtencionOperativaService", () => ({
  atencionOperativaService: { registrarAccion: mocks.registrarAccion, registrarClasificacion: vi.fn() },
}));
vi.mock("../../repositories/prisma", () => ({ prisma: {} }));
vi.mock("../../modules/zendesk/infrastructure/ZendeskClient", () => ({ ZendeskClient: class {} }));
vi.mock("../../config/env", () => ({ env: { QD_AUTO_CREATE_ENABLED: false } }));

import { zendeskTestController } from "../../modules/zendesk-test/ZendeskTestController";

const ETIQUETA = "Ana Perez (usr-ana)";
const auth = {
  id: "usr-ana",
  nombre: "Ana",
  apellido: "Perez",
  correo: "ana@cope.pe",
  permisos: [],
};

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

function makeReq(body: Record<string, unknown>, authValue: any = auth) {
  return { params: { id: "123" }, body, auth: authValue } as any;
}

describe("ZendeskTestController — identidad global (Fase 1.1.2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.internalNote.mockResolvedValue({ success: true });
    mocks.assign.mockResolvedValue({ success: true });
    mocks.changeStatus.mockResolvedValue({ success: true });
    mocks.reply.mockResolvedValue({ success: true });
    mocks.responderYResolver.mockResolvedValue({ success: true });
    mocks.registrarAccion.mockResolvedValue(undefined);
  });

  it("internal-note ignora body.autor", async () => {
    const res = makeRes();
    await zendeskTestController.internalNote(makeReq({ body: "nota", autor: "Otro" }), res, vi.fn());
    expect(mocks.internalNote).toHaveBeenCalledWith(123, "nota", ETIQUETA);
    expect(mocks.registrarAccion).toHaveBeenCalledWith("123", expect.objectContaining({
      accion: "nota_interna",
      usuario: ETIQUETA,
    }));
  });

  it("assign ignora body.autor", async () => {
    const res = makeRes();
    await zendeskTestController.assign(makeReq({ assigneeId: 7, autor: "Otro" }), res, vi.fn());
    expect(mocks.assign).toHaveBeenCalledWith(123, 7, ETIQUETA);
    expect(mocks.registrarAccion).toHaveBeenCalledWith("123", expect.objectContaining({
      accion: "asignacion",
      usuario: ETIQUETA,
    }));
  });

  it("status ignora body.autor y audita la identidad autenticada", async () => {
    const res = makeRes();
    await zendeskTestController.changeStatus(makeReq({ status: "solved", email: null, autor: "Otro" }), res, vi.fn());
    expect(mocks.changeStatus).toHaveBeenCalledWith(123, "solved", ETIQUETA);
    expect(mocks.registrarAccion).toHaveBeenCalledWith("123", expect.objectContaining({
      usuario: ETIQUETA,
      accion: "resolucion",
    }));
  });

  it("reply ignora body.autor", async () => {
    const res = makeRes();
    await zendeskTestController.reply(makeReq({ body: "hola", autor: "Otro" }), res, vi.fn());
    expect(mocks.reply).toHaveBeenCalledWith(123, "hola", ETIQUETA);
    expect(mocks.registrarAccion).toHaveBeenCalledWith("123", expect.objectContaining({
      accion: "respuesta",
      usuario: ETIQUETA,
    }));
  });

  it("reply-resolve ignora body.autor y conserva adjuntos", async () => {
    const res = makeRes();
    const archivos = [{ nombre: "a.txt", base64: "eA==", contentType: "text/plain" }];
    await zendeskTestController.replyResolve(makeReq({ body: "hola", autor: "Otro", resolver: false, archivos }), res, vi.fn());
    expect(mocks.responderYResolver).toHaveBeenCalledWith(123, "hola", ETIQUETA, expect.any(Array), false);
    expect(mocks.responderYResolver.mock.calls[0][3]).toHaveLength(1);
    expect(mocks.registrarAccion).toHaveBeenCalledWith("123", expect.objectContaining({
      accion: "respuesta",
      usuario: ETIQUETA,
    }));
  });

  it("sin sesión → 401 y no ejecuta la acción", async () => {
    const res = makeRes();
    await zendeskTestController.internalNote(makeReq({ body: "nota", autor: "Otro" }, null), res, vi.fn());
    expect(res.status).toHaveBeenCalledWith(401);
    expect(mocks.internalNote).not.toHaveBeenCalled();
  });
});
