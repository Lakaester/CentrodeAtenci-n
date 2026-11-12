import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = { $queryRaw: vi.fn(), $executeRaw: vi.fn() };

vi.mock("../../repositories/prisma", () => ({
  prisma: { $transaction: async (fn: (t: unknown) => unknown) => fn(tx) },
}));

vi.mock("../../repositories/quejasDevoluciones.repository", () => ({
  qdRepository: {
    porId: vi.fn(),
    porTicketGeneral: vi.fn(),
    asociarInteraccion: vi.fn(),
    asignarDominio: vi.fn(),
    cerrarCaso: vi.fn(),
    reabrirCaso: vi.fn(),
    consolidarCasos: vi.fn(),
    registrarAuditoria: vi.fn(),
  },
}));

import { qdRepository } from "../../repositories/quejasDevoluciones.repository";
import { prisma } from "../../repositories/prisma";
import { qdService } from "../quejasDevoluciones.service";

const casoAbierto = {
  id: "c1", tipo: "queja" as const, numero: "QUE-12345", ticket_id: "t1", ticket_padre_id: null,
  dominio: "dominio.com", pais: null, asesor: null, estado: "Pendiente de conciliación", resultado: null,
  caso_cerrado: false, consolidado_en: null, eliminado: false, created_at: new Date(),
};

describe("QyD transacciones (O4-B T1/T2 + CAS)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (qdRepository.porId as any).mockResolvedValue(casoAbierto);
  });

  it("asociarInteraccion: interacción + auditoría dentro de la misma transacción", async () => {
    (qdRepository.asociarInteraccion as any).mockResolvedValue({ id: "i1" });
    const r = await qdService.asociarInteraccion("c1", "t99", "ana");
    expect(r).toEqual({ id: "i1" });
    expect(qdRepository.asociarInteraccion).toHaveBeenCalledWith("c1", "t99", "ana", "relacionada", null, null, tx);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledWith("c1", "ana", "interaccion_asociada", "ticket", null, expect.stringContaining("#t99"), tx);
  });

  it("asociarInteraccion: si la interacción ya existía (null) NO escribe auditoría", async () => {
    (qdRepository.asociarInteraccion as any).mockResolvedValue(null);
    const r = await qdService.asociarInteraccion("c1", "t99", "ana");
    expect(r).toBeNull();
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("asignarDominio: update + auditoría (solo si cambió) en la misma transacción", async () => {
    (qdRepository.asignarDominio as any).mockResolvedValue({ ...casoAbierto, dominio: "nuevo.com" });
    await qdService.asignarDominio("c1", "nuevo.com", "ana");
    expect(qdRepository.asignarDominio).toHaveBeenCalledWith("c1", "nuevo.com", "ana", tx);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledWith("c1", "ana", "asignacion_dominio", "dominio", "dominio.com", "nuevo.com", tx);
  });

  it("cerrarCaso: éxito → update + auditoría en tx", async () => {
    (qdRepository.cerrarCaso as any).mockResolvedValue({ ...casoAbierto, caso_cerrado: true });
    const r = await qdService.cerrarCaso("c1", "ana");
    expect(r.caso_cerrado).toBe(true);
    expect(qdRepository.cerrarCaso).toHaveBeenCalledWith("c1", "ana", tx);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledWith("c1", "ana", "cierre_caso", "caso", "ABIERTO", "CERRADO", tx);
  });

  it("cerrarCaso: CAS pierde (ya cerrado) → error y SIN auditoría", async () => {
    (qdRepository.cerrarCaso as any).mockResolvedValue(null);
    await expect(qdService.cerrarCaso("c1", "ana")).rejects.toMatchObject({ code: "CASO_CERRADO" });
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("reabrirCaso: CAS pierde (ya abierto) → error y SIN auditoría", async () => {
    (qdRepository.reabrirCaso as any).mockResolvedValue(null);
    await expect(qdService.reabrirCaso("c1", "ana")).rejects.toMatchObject({ code: "CASO_ABIERTO" });
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("consolidarCasos: éxito → consolidar + auditoría en tx", async () => {
    (qdRepository.porId as any).mockImplementation(async (id: string) =>
      id === "c1" ? casoAbierto : { ...casoAbierto, id, numero: `QUE-${id}`, tipo: "queja" },
    );
    (qdRepository.consolidarCasos as any).mockResolvedValue(2);
    const r = await qdService.consolidarCasos("c1", ["c2", "c3"], "ana", "motivo");
    expect(r.consolidados).toBe(2);
    expect(qdRepository.consolidarCasos).toHaveBeenCalledWith("c1", ["c2", "c3"], "ana", tx);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledTimes(3); // principal + 2 secundarios
  });

  it("consolidarCasos: CAS pierde (principal ya consolidado) → error y SIN auditoría", async () => {
    (qdRepository.porId as any).mockImplementation(async (id: string) =>
      id === "c1" ? { ...casoAbierto, consolidado_en: "x0" } : casoAbierto,
    );
    await expect(qdService.consolidarCasos("c1", ["c2"], "ana")).rejects.toMatchObject({ code: "CONSOLIDACION_INVALIDA" });
    expect(qdRepository.consolidarCasos).not.toHaveBeenCalled();
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("consolidarCasos: consolidar devuelve 0 (CAS en DB) → error y SIN auditoría", async () => {
    (qdRepository.porId as any).mockResolvedValue(casoAbierto);
    (qdRepository.consolidarCasos as any).mockResolvedValue(0);
    await expect(qdService.consolidarCasos("c1", ["c2"], "ana")).rejects.toMatchObject({ code: "CONSOLIDACION_INVALIDA" });
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("consolidarCasos: tres casos, principal más antiguo y secundarios con CERRADO", async () => {
    (qdRepository.porId as any).mockImplementation(async (id: string) => {
      if (id === "c1") return { ...casoAbierto, estado: "Pendiente de conciliación" };
      if (id === "c2") return { ...casoAbierto, id, numero: "QUE-c2", estado: "CERRADO", caso_cerrado: true };
      return { ...casoAbierto, id, numero: "QUE-c3", estado: "Resuelto", caso_cerrado: true };
    });
    (qdRepository.consolidarCasos as any).mockResolvedValue(2);

    const r = await qdService.consolidarCasos("c1", ["c2", "c3"], "ana", "unificar");

    expect(r.consolidados).toBe(2);
    expect(qdRepository.consolidarCasos).toHaveBeenCalledWith("c1", ["c2", "c3"], "ana", tx);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledTimes(3);
  });

  it("consolidarCasos: deduplica secundarios repetidos", async () => {
    (qdRepository.porId as any).mockImplementation(async (id: string) =>
      id === "c1" ? casoAbierto : { ...casoAbierto, id, numero: `QUE-${id}` },
    );
    (qdRepository.consolidarCasos as any).mockResolvedValue(1);

    await qdService.consolidarCasos("c1", ["c2", "c2"], "ana");

    expect(qdRepository.consolidarCasos).toHaveBeenCalledWith("c1", ["c2"], "ana", tx);
  });

  it("consolidarCasos: consolidación parcial → error y rollback lógico sin auditoría", async () => {
    (qdRepository.porId as any).mockImplementation(async (id: string) =>
      id === "c1" ? casoAbierto : { ...casoAbierto, id, numero: `QUE-${id}` },
    );
    (qdRepository.consolidarCasos as any).mockResolvedValue(1);

    await expect(qdService.consolidarCasos("c1", ["c2", "c3"], "ana"))
      .rejects.toMatchObject({ code: "CONSOLIDACION_INVALIDA" });
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("consolidarCasos: principal cerrado se permite y conserva su estado", async () => {
    (qdRepository.porId as any).mockImplementation(async (id: string) =>
      id === "c1"
        ? { ...casoAbierto, estado: "CERRADO", caso_cerrado: true }
        : { ...casoAbierto, id, numero: `QUE-${id}`, estado: "CERRADO", caso_cerrado: true },
    );
    (qdRepository.consolidarCasos as any).mockResolvedValue(2);

    const r = await qdService.consolidarCasos("c1", ["c2", "c3"], "ana");

    expect(r.consolidados).toBe(2);
    expect(r.principal.estado).toBe("CERRADO");
    expect(qdRepository.consolidarCasos).toHaveBeenCalled();
  });

  it("consolidarCasos: si falla la consolidación en DB → no audita y propaga", async () => {
    (qdRepository.porId as any).mockImplementation(async (id: string) =>
      id === "c1" ? casoAbierto : { ...casoAbierto, id, numero: `QUE-${id}` },
    );
    (qdRepository.consolidarCasos as any).mockRejectedValue(new Error("db constraint"));

    await expect(qdService.consolidarCasos("c1", ["c2"], "ana")).rejects.toThrow("db constraint");
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("consolidarCasos: repetir una consolidación ya realizada → error sin duplicar", async () => {
    (qdRepository.porId as any).mockImplementation(async (id: string) =>
      id === "c1"
        ? casoAbierto
        : { ...casoAbierto, id, numero: `QUE-${id}`, consolidado_en: "c1" },
    );

    await expect(qdService.consolidarCasos("c1", ["c2"], "ana"))
      .rejects.toMatchObject({ code: "CONSOLIDACION_INVALIDA" });
    expect(qdRepository.consolidarCasos).not.toHaveBeenCalled();
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });
});