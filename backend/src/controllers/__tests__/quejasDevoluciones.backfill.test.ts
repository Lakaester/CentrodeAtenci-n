import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  ejecutarBackfillZendesk: vi.fn(),
  exportarDryRunCsv: vi.fn(),
  repararFechasFaltantes: vi.fn(),
  resumenDesdeRun: vi.fn(),
  obtenerRun: vi.fn(),
  items: vi.fn(),
  listarIncidencias: vi.fn(),
}));

vi.mock("../../services/qydZendeskBackfill.service", () => ({
  ejecutarBackfillZendesk: mocks.ejecutarBackfillZendesk,
  exportarDryRunCsv: mocks.exportarDryRunCsv,
  repararFechasFaltantes: mocks.repararFechasFaltantes,
  resumenDesdeRun: mocks.resumenDesdeRun,
  postgresBackfillSource: {},
  zendeskBackfillSource: {},
}));

vi.mock("../../repositories/qydBackfill.repository", () => ({
  qydBackfillRepository: {
    obtenerRun: mocks.obtenerRun,
    items: mocks.items,
  },
}));

vi.mock("../../repositories/quejasDevoluciones.repository", () => ({
  qdRepository: { listarIncidencias: mocks.listarIncidencias },
}));

vi.mock("../../services/quejasDevoluciones.service", () => ({ qdService: {} }));
vi.mock("../../services/quejasDevolucionesExport.service", () => ({ qdExportService: {} }));

import { qdController } from "../quejasDevoluciones.controller";

function makeRes() {
  const res: any = {};
  res.status = vi.fn().mockReturnValue(res);
  res.json = vi.fn().mockReturnValue(res);
  res.setHeader = vi.fn().mockReturnValue(res);
  res.send = vi.fn().mockReturnValue(res);
  return res;
}

function makeReq(body: Record<string, unknown>) {
  return { body, auth: { nombre: "Ana" }, query: {}, params: {} } as any;
}

const resumen = {
  runId: "dry-run-1",
  estado: "SIMULADO",
  dryRun: true,
  controlPersistido: false,
  desde: "2026-07-01",
  hasta: "2026-11-10",
  ventanas: 5,
  total: 1,
  creados: 1,
  reutilizados: 0,
  omitidos: 0,
  pendientes: 0,
  errores: 0,
  pendientesPorMotivo: {},
  fechasRecuperadas: 0,
  fechasNoRecuperables: 0,
  incidenciasFecha: 0,
  detalle: { pagina: 1, porPagina: 50, total: 1, paginas: 1, items: [] },
};

describe("QyD backfill controller — detalle y CSV", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.ejecutarBackfillZendesk.mockResolvedValue(resumen);
    mocks.exportarDryRunCsv.mockResolvedValue({
      csv: "\uFEFFticket_id,accion_proyectada\r\n50001,CREAR\r\n",
      total: 1,
      filename: "qyd-dry-run-2026-07-01-2026-11-10.csv",
    });
  });

  it("pasa incluirDetalle y la paginación al orquestador", async () => {
    const req = makeReq({
      desde: "2026-07-01", hasta: "2026-11-10", dryRun: true,
      incluirDetalle: true, paginaDetalle: 2, porPaginaDetalle: 25,
    });
    const res = makeRes();

    await qdController.backfillZendesk(req, res, vi.fn());

    expect(mocks.ejecutarBackfillZendesk).toHaveBeenCalledWith(expect.objectContaining({
      desde: "2026-07-01",
      hasta: "2026-11-10",
      dryRun: true,
      incluirDetalle: true,
      paginaDetalle: 2,
      porPaginaDetalle: 25,
      usuario: "Ana",
    }));
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({ ok: true }));
  });

  it("exporta CSV sin escribir JSON y con cabeceras de descarga", async () => {
    const req = makeReq({
      desde: "2026-07-01", hasta: "2026-11-10", dryRun: true, formato: "csv",
    });
    const res = makeRes();

    await qdController.backfillZendesk(req, res, vi.fn());

    expect(mocks.exportarDryRunCsv).toHaveBeenCalledWith(expect.objectContaining({
      desde: "2026-07-01",
      hasta: "2026-11-10",
      usuario: "Ana",
    }));
    expect(res.setHeader).toHaveBeenCalledWith("Content-Type", "text/csv; charset=utf-8");
    expect(res.setHeader).toHaveBeenCalledWith(
      "Content-Disposition",
      'attachment; filename="qyd-dry-run-2026-07-01-2026-11-10.csv"',
    );
    expect(res.send).toHaveBeenCalledWith(expect.stringContaining("50001,CREAR"));
    expect(res.json).not.toHaveBeenCalled();
  });

  it("rechaza CSV en ejecución real", async () => {
    const req = makeReq({
      desde: "2026-07-01", hasta: "2026-11-10", dryRun: false,
      confirmar: "EJECUTAR_BACKFILL_QYD", formato: "csv",
    });
    const res = makeRes();

    await qdController.backfillZendesk(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.exportarDryRunCsv).not.toHaveBeenCalled();
  });

  it("exige confirmación explícita para el backfill real", async () => {
    const req = makeReq({ desde: "2026-07-01", hasta: "2026-11-10", dryRun: false });
    const res = makeRes();

    await qdController.backfillZendesk(req, res, vi.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(mocks.ejecutarBackfillZendesk).not.toHaveBeenCalled();
  });
});
