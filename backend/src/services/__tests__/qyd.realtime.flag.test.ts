import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  categorize: vi.fn(),
  obtenerTicket: vi.fn(),
  registrarClasificacion: vi.fn(),
  crearDesdeCategorizacion: vi.fn(),
  porTicketGeneral: vi.fn(),
  registrarCategoria: vi.fn(),
}));

vi.mock("../../modules/zendesk-test/ZendeskTestService", () => ({ ZendeskTestService: class {} }));
vi.mock("../../modules/zendesk-test/ZendeskInboxService", () => ({ ZendeskInboxService: class {} }));
vi.mock("../../modules/zendesk-test/ZendeskCustomerService", () => ({ ZendeskCustomerService: class {} }));
vi.mock("../../modules/zendesk-test/AtencionViewModelService", () => ({ AtencionViewModelService: class {} }));
vi.mock("../../modules/zendesk-test/AtencionCompletaService", () => ({ AtencionCompletaService: class {} }));
vi.mock("../../modules/zendesk-test/ClientStore", () => ({ ClientStore: { registrar: vi.fn() } }));
vi.mock("../../modules/zendesk-test/AgentStore", () => ({ AgentStore: {} }));
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
vi.mock("../../modules/zendesk/infrastructure/ZendeskClient", () => ({ ZendeskClient: class {} }));
vi.mock("../../repositories/prisma", () => ({ prisma: {} }));
// Flag apagado: no debe crear expedientes.
vi.mock("../../config/env", () => ({ env: { QD_AUTO_CREATE_ENABLED: false } }));

import { zendeskTestController } from "../../modules/zendesk-test/ZendeskTestController";

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  return res;
}

describe("ZendeskTestController.categorize — flag QD_AUTO_CREATE_ENABLED=false", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.categorize.mockResolvedValue({ success: true, ticketId: "34576" });
    mocks.registrarClasificacion.mockResolvedValue(undefined);
  });

  it("persiste la categoría pero no crea expediente", async () => {
    const req = { params: { id: "34576" }, auth: {
      id: "usr-ana",
      nombre: "Ana",
      apellido: "Perez",
      permisos: [
        { modulo: "Atenciones", accion: "editar", permitido: true },
        { modulo: "Quejas y Devoluciones", accion: "crear", permitido: true },
      ],
    }, body: {
      categoria: "DEVOLUCIÓN",
      subcategoria: "solicitud_de_devolución",
      autor: "COPE",
      canal: "email",
    } } as any;
    const res = makeRes();
    await zendeskTestController.categorize(req, res, vi.fn());

    expect(mocks.registrarClasificacion).toHaveBeenCalledTimes(1);
    expect(mocks.crearDesdeCategorizacion).not.toHaveBeenCalled();
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      ok: true,
      data: expect.objectContaining({
        caso: null,
        creado: false,
        reutilizado: false,
        motivo: "AUTO_CREATE_DESHABILITADO",
        expedientePendiente: false,
      }),
    }));
  });
});
