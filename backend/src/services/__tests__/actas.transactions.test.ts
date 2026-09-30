import { describe, it, expect, vi, beforeEach } from "vitest";

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

describe("Actas T3 (O4-B.5) — PDF/filesystem separado de PostgreSQL", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (agendasRepository.porId as any).mockResolvedValue(agenda);
    (agendasRepository.guardarActa as any).mockResolvedValue({ ...agenda, acta_estado: "FINALIZADA" });
    (agendasRepository.actualizarMetadatosActa as any).mockResolvedValue(agenda);
    (actaPdfService.generarAsync as any).mockResolvedValue(Buffer.from("pdf"));
    (actaPdfService.guardarPdf as any).mockReturnValue({ filePath: "/tmp/ACTA-T-1.pdf", tamano: 3 });
  });

  it("FINALIZADA: PDF generado y guardado ANTES de persistir; DB atómica (acta + metadatos en tx)", async () => {
    await agendasService.guardarActa("a1", { desarrollo: "x" }, "FINALIZADA");
    expect(actaPdfService.generarAsync).toHaveBeenCalled();
    expect(actaPdfService.guardarPdf).toHaveBeenCalledWith("T-1", Buffer.from("pdf"));
    expect(agendasRepository.guardarActa).toHaveBeenCalledWith("a1", { desarrollo: "x" }, "FINALIZADA", tx);
    expect(agendasRepository.actualizarMetadatosActa).toHaveBeenCalledWith(
      "a1",
      expect.objectContaining({ acta_file_id: "ACTA-T-1.pdf", acta_nombre: "ACTA-T-1.pdf", acta_tipo: "application/pdf", acta_tamano: 3 }),
      tx,
    );
  });

  it("FINALIZADA con PDF que falla → error y NO se persiste (no deja FINALIZADA sin artefacto)", async () => {
    (actaPdfService.generarAsync as any).mockRejectedValue(new Error("pdf boom"));
    await expect(agendasService.guardarActa("a1", { x: 1 }, "FINALIZADA")).rejects.toThrow("pdf boom");
    expect(agendasRepository.guardarActa).not.toHaveBeenCalled();
    expect(actaPdfService.eliminarPdf).not.toHaveBeenCalled();
  });

  it("FINALIZADA con escritura fs que falla → error y NO se persiste", async () => {
    (actaPdfService.guardarPdf as any).mockImplementation(() => {
      throw new Error("fs boom");
    });
    await expect(agendasService.guardarActa("a1", { x: 1 }, "FINALIZADA")).rejects.toThrow("fs boom");
    expect(agendasRepository.guardarActa).not.toHaveBeenCalled();
  });

  it("FINALIZADA con fallo DB → compensación elimina el archivo y relanza", async () => {
    (agendasRepository.guardarActa as any).mockRejectedValue(new Error("db boom"));
    await expect(agendasService.guardarActa("a1", { x: 1 }, "FINALIZADA")).rejects.toThrow("db boom");
    expect(actaPdfService.eliminarPdf).toHaveBeenCalledWith("T-1");
  });

  it("BORRADOR: solo DB en tx, sin PDF ni metadatos", async () => {
    (agendasRepository.guardarActa as any).mockResolvedValue({ ...agenda, acta_estado: "BORRADOR" });
    await agendasService.guardarActa("a1", { x: 1 }, "BORRADOR");
    expect(agendasRepository.guardarActa).toHaveBeenCalledWith("a1", { x: 1 }, "BORRADOR", tx);
    expect(actaPdfService.generarAsync).not.toHaveBeenCalled();
    expect(agendasRepository.actualizarMetadatosActa).not.toHaveBeenCalled();
  });

  it("generación repetida (misma agenda) → una sola fila actualizada (sin duplicar acta)", async () => {
    await agendasService.guardarActa("a1", { x: 1 }, "FINALIZADA");
    await agendasService.guardarActa("a1", { x: 2 }, "FINALIZADA");
    expect(agendasRepository.guardarActa).toHaveBeenCalledTimes(2); // upsert sobre la misma agenda (1:1)
    expect(agendasRepository.guardarActa).toHaveBeenNthCalledWith(1, "a1", { x: 1 }, "FINALIZADA", tx);
    expect(agendasRepository.guardarActa).toHaveBeenNthCalledWith(2, "a1", { x: 2 }, "FINALIZADA", tx);
  });
});