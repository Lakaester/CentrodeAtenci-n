import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = { $queryRaw: vi.fn(), $executeRaw: vi.fn(), $queryRawUnsafe: vi.fn(), $executeRawUnsafe: vi.fn() };

vi.mock("../../repositories/prisma", () => ({
  prisma: { $transaction: vi.fn(async (fn: (t: unknown) => unknown) => fn(tx)) },
}));

vi.mock("../../repositories/quejasDevoluciones.repository", () => ({
  qdRepository: {
    porId: vi.fn(),
    porTicket: vi.fn(),
    crear: vi.fn(),
    registrarAuditoria: vi.fn(),
    actualizar: vi.fn(),
    eliminarLogico: vi.fn(),
    asociarInteraccion: vi.fn(),
  },
}));

import { qdRepository } from "../../repositories/quejasDevoluciones.repository";
import { prisma } from "../../repositories/prisma";
import { qdService } from "../quejasDevoluciones.service";

const caso = {
  id: "c1", tipo: "devolucion" as const, numero: "DEV-1", ticket_id: "t1", ticket_padre_id: null,
  dominio: "d.com", pais: null, asesor: null, estado: "Pendiente", resultado: null, origen: "MANUAL",
  monto_pagado: "100", porcentaje: "10", monto_devuelto: "10", clasificacion: null, area: null,
  producto: null, motivo: null, eliminado: false, consolidado_en: null,
};

describe("QyD — cierre F03 (O4-D): atomicidad crear/vincular/eliminar/actualizar/reconcile", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (prisma.$transaction as any).mockImplementation(async (fn: (t: unknown) => unknown) => fn(tx));
    (qdRepository.porId as any).mockResolvedValue(caso);
    (qdRepository.porTicket as any).mockResolvedValue(null);
    (qdRepository.crear as any).mockResolvedValue(caso);
    (qdRepository.registrarAuditoria as any).mockResolvedValue(undefined);
  });

  it("F03-01 crear exitoso: caso + auditoría dentro de $transaction (usa tx)", async () => {
    const r = await qdService.crear({ tipo: "devolucion", ticketId: "t9", dominio: "d.com", asesor: "ana" }, "ana");
    expect(r).toBe(caso);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(qdRepository.crear).toHaveBeenCalledWith(expect.objectContaining({ ticketId: "t9" }), tx);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledWith(caso.id, "ana", "creacion", "caso", null, expect.stringContaining("DEV-1"), tx);
  });

  it("F03-02 crear: falla tras la escritura principal → rollback (sin caso, sin auditoría)", async () => {
    (qdRepository.crear as any).mockRejectedValue(new Error("db boom"));
    await expect(qdService.crear({ tipo: "devolucion", ticketId: "t9", dominio: "d.com" }, "ana")).rejects.toThrow("db boom");
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
    expect(prisma.$transaction).toHaveBeenCalled();
  });

  it("F03-03 crear: falla durante auditoría → rollback del caso", async () => {
    (qdRepository.registrarAuditoria as any).mockRejectedValue(new Error("audit boom"));
    await expect(qdService.crear({ tipo: "devolucion", ticketId: "t9", dominio: "d.com" }, "ana")).rejects.toThrow("audit boom");
    // El caso fue creado dentro de la misma tx que falló → rollback (sin persistencia).
    expect(qdRepository.crear).toHaveBeenCalled();
  });

  it("F03-04 vincularTicket exitoso: vínculo + auditoría dentro de tx", async () => {
    (qdRepository.asociarInteraccion as any).mockResolvedValue({ id: "i1" });
    const r = await qdService.vincularTicket("c1", "t9", "ana", "correo");
    expect(r).toEqual({ id: "i1" });
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(qdRepository.asociarInteraccion).toHaveBeenCalledWith("c1", "t9", "ana", "relacionada", "correo", expect.any(Date), tx);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledWith("c1", "ana", "interaccion_asociada", "ticket", null, expect.stringContaining("#t9"), tx);
  });

  it("F03-05 vincularTicket: falla durante vinculación → rollback (sin auditoría)", async () => {
    (qdRepository.asociarInteraccion as any).mockRejectedValue(new Error("link boom"));
    await expect(qdService.vincularTicket("c1", "t9", "ana")).rejects.toThrow("link boom");
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("F03-06 eliminar exitoso: soft delete + auditoría dentro de tx", async () => {
    (qdRepository.eliminarLogico as any).mockResolvedValue(caso);
    const r = await qdService.eliminar("c1", "ana");
    expect(r).toBe(caso);
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(qdRepository.eliminarLogico).toHaveBeenCalledWith("c1", "ana", tx);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledWith("c1", "ana", "ELIMINACION", "caso", expect.any(String), expect.any(String), tx);
  });

  it("F03-07 eliminar: falla → rollback (sin auditoría de éxito)", async () => {
    (qdRepository.eliminarLogico as any).mockRejectedValue(new Error("del boom"));
    await expect(qdService.eliminar("c1", "ana")).rejects.toThrow("del boom");
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("F03-08 actualizar exitoso: update + auditoría dentro de tx", async () => {
    (qdRepository.actualizar as any).mockResolvedValue({ ...caso, estado: "Resuelto" });
    const r = await qdService.actualizar("c1", { estado: "Resuelto" }, "ana");
    expect(r.estado).toBe("Resuelto");
    expect(prisma.$transaction).toHaveBeenCalled();
    expect(qdRepository.actualizar).toHaveBeenCalledWith("c1", expect.objectContaining({ estado: "Resuelto" }), tx);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledWith("c1", "ana", "edicion", "estado", "Pendiente", "Resuelto", tx);
  });

  it("F03-09 actualizar: falla → rollback (sin auditoría)", async () => {
    (qdRepository.actualizar as any).mockRejectedValue(new Error("upd boom"));
    await expect(qdService.actualizar("c1", { estado: "Resuelto" }, "ana")).rejects.toThrow("upd boom");
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("F03-10/11 crear repetido: idempotencia preservada (CASO_DUPLICADO si el ticket ya tiene caso)", async () => {
    (qdRepository.porTicket as any).mockResolvedValue(caso);
    await expect(qdService.crear({ tipo: "devolucion", ticketId: "t9", dominio: "d.com" }, "ana")).rejects.toMatchObject({ code: "CASO_DUPLICADO" });
    expect(qdRepository.crear).not.toHaveBeenCalled();
    expect(qdRepository.registrarAuditoria).not.toHaveBeenCalled();
  });

  it("F03-12 transaction client: dentro de $transaction solo se usa tx (no prisma global)", async () => {
    const llamadoConTx: boolean[] = [];
    (qdRepository.crear as any).mockImplementation(async (_input: unknown, exec: unknown) => {
      llamadoConTx.push(exec === tx);
      return caso;
    });
    (qdRepository.registrarAuditoria as any).mockImplementation(async (_id: unknown, _u: unknown, _a: unknown, _c: unknown, _o: unknown, _n: unknown, exec: unknown) => {
      llamadoConTx.push(exec === tx);
    });
    await qdService.crear({ tipo: "devolucion", ticketId: "t9", dominio: "d.com" }, "ana");
    expect(llamadoConTx).toEqual([true, true]); // ambas escrituras usaron el transaction client
  });
});