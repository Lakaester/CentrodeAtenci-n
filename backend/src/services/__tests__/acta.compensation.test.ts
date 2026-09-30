import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

const tx = { $queryRawUnsafe: vi.fn(), $executeRawUnsafe: vi.fn() };

vi.mock("../../repositories/prisma", () => ({
  prisma: { $transaction: async (fn: (t: unknown) => unknown) => fn(tx) },
}));

vi.mock("../actaPdf.service", () => ({
  actaPdfService: {
    generarAsync: vi.fn(),
    guardarPdf: vi.fn(),
    eliminarPdf: vi.fn(),
    nombreArchivoActa: vi.fn((t: string) => `ACTA-${t}.pdf`),
  },
}));

vi.mock("../../repositories/agendas.repository", () => ({
  agendasRepository: {
    porId: vi.fn(),
    guardarActa: vi.fn(),
    actualizarMetadatosActa: vi.fn(),
  },
}));

import { agendasRepository } from "../../repositories/agendas.repository";
import { actaPdfService } from "../actaPdf.service";
import { agendasService } from "../agendas.service";

const agenda = {
  id: "a1", ticket: "T-1", tipo: "REUNION", asesor_id: "u1", estado: "FINALIZADA",
  fecha: "2026-09-30", hora_inicio: "10:00", hora_fin: "11:00", eliminado: false,
  calendar_event_id: null, created_by: "u1", updated_at: new Date(), acta_estado: "BORRADOR",
};

describe("O5-D — F05: Acta compensation logging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (agendasRepository.porId as any).mockResolvedValue(agenda);
    (agendasRepository.guardarActa as any).mockResolvedValue({ ...agenda, acta_estado: "FINALIZADA" });
    (agendasRepository.actualizarMetadatosActa as any).mockResolvedValue(agenda);
    (actaPdfService.generarAsync as any).mockResolvedValue(Buffer.from("pdf"));
    (actaPdfService.guardarPdf as any).mockReturnValue({ filePath: "/tmp/ACTA-T-1.pdf", tamano: 3 });
    (actaPdfService.eliminarPdf as any).mockReturnValue({ ok: true });
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("ACTA-F05-01 flujo exitoso: PDF guardado + DB commit + sin log de compensación", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    await agendasService.guardarActa("a1", { x: 1 }, "FINALIZADA");
    expect(agendasRepository.guardarActa).toHaveBeenCalled();
    expect(actaPdfService.eliminarPdf).not.toHaveBeenCalled(); // sin compensación
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining("ACTA_FILE_COMPENSATION"));
  });

  it("ACTA-F05-02 DB falla y compensación OK → rollback, sin log F05", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    (agendasRepository.guardarActa as any).mockRejectedValue(new Error("db boom"));
    await expect(agendasService.guardarActa("a1", { x: 1 }, "FINALIZADA")).rejects.toThrow("db boom");
    expect(actaPdfService.eliminarPdf).toHaveBeenCalledWith("T-1");
    expect(spy).not.toHaveBeenCalledWith(expect.stringContaining("ACTA_FILE_COMPENSATION"));
  });

  it("ACTA-F05-03 DB falla y compensación falla → log F05 con contexto y error original preservado", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    (agendasRepository.guardarActa as any).mockRejectedValue(new Error("db boom"));
    (actaPdfService.eliminarPdf as any).mockReturnValue({ ok: false, error: "EACCES permission denied" });
    await expect(agendasService.guardarActa("a1", { x: 1 }, "FINALIZADA")).rejects.toThrow("db boom");
    // Log F05 presente con contexto completo.
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("ACTA_FILE_COMPENSATION"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("result=FAILED"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("agendaId=a1"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("file=ACTA-T-1.pdf"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("originalError=db boom"));
    expect(spy).toHaveBeenCalledWith(expect.stringContaining("compensationError=EACCES"));
    // No FINALIZADA: la transacción DB lanzó → rollback.
    expect(agendasRepository.actualizarMetadatosActa).not.toHaveBeenCalled();
  });

  it("ACTA-F05-04/05 log sin secretos y con path saneado", async () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => undefined);
    (agendasRepository.guardarActa as any).mockRejectedValue(new Error("db boom"));
    (actaPdfService.eliminarPdf as any).mockReturnValue({ ok: false, error: "unlink failed" });
    await agendasService.guardarActa("a1", { x: 1 }, "FINALIZADA").catch(() => undefined);
    const log = spy.mock.calls.find((c) => String(c[0]).includes("ACTA_FILE_COMPENSATION"))?.[0] as string;
    expect(log).toBeDefined();
    expect(log.toLowerCase()).not.toMatch(/authorization|token|cookie|refresh/);
    // file proviene de nombreArchivoActa (saneado), no de texto libre.
    expect(log).toContain("file=ACTA-T-1.pdf");
  });

  it("ACTA-F05-06 regresión: flujo BORRADOR intacto (solo DB, sin PDF)", async () => {
    (agendasRepository.guardarActa as any).mockResolvedValue({ ...agenda, acta_estado: "BORRADOR" });
    await agendasService.guardarActa("a1", { x: 1 }, "BORRADOR");
    expect(agendasRepository.guardarActa).toHaveBeenCalledWith("a1", { x: 1 }, "BORRADOR", tx);
    expect(actaPdfService.generarAsync).not.toHaveBeenCalled();
  });
});