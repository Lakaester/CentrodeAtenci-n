import { describe, it, expect, vi, beforeEach } from "vitest";

const calls: unknown[] = [];
vi.mock("../../repositories/prisma", () => ({
  prisma: {
    $queryRaw: vi.fn(),
    $executeRaw: vi.fn(),
    $transaction: vi.fn(async (fn: (t: unknown) => unknown) => {
      calls.push("$transaction");
      return fn({ $queryRaw: vi.fn(), $executeRaw: vi.fn() });
    }),
  },
}));

vi.mock("../../repositories/quejasDevoluciones.repository", () => ({
  qdRepository: {
    porTicket: vi.fn(),
    crear: vi.fn(),
    registrarAuditoria: vi.fn(),
  },
}));

import { qdRepository } from "../../repositories/quejasDevoluciones.repository";
import { prisma } from "../../repositories/prisma";
import { qdService } from "../quejasDevoluciones.service";

const caso = {
  id: "c1", tipo: "queja" as const, numero: "QUE-1", ticket_id: "t1", ticket_padre_id: null,
  dominio: "d.com", pais: null, asesor: null, estado: "Pendiente", resultado: null, origen: "MANUAL",
};

describe("QyD — auditoría de atomicidad (O4-C): creación de caso", () => {
  beforeEach(() => {
    calls.length = 0;
    vi.clearAllMocks();
    (qdRepository.porTicket as any).mockResolvedValue(null);
    (qdRepository.crear as any).mockResolvedValue(caso);
    (qdRepository.registrarAuditoria as any).mockResolvedValue(undefined);
  });

  it("EVIDENCIA: `crear` (caso + auditoría) NO se ejecuta dentro de `$transaction` (gap T1)", async () => {
    await qdService.crear({
      tipo: "devolucion", ticketId: "t1", dominio: "d.com", asesor: "ana", estado: "Pendiente",
    }, "ana");
    expect(prisma.$transaction).not.toHaveBeenCalled();
    // Caso y auditoría se escriben por separado (global prisma), sin frontera atómica.
    expect(qdRepository.crear).toHaveBeenCalledTimes(1);
    expect(qdRepository.registrarAuditoria).toHaveBeenCalledTimes(1);
    // Si la auditoría falla tras el INSERT, el caso queda sin auditoría (escritura parcial posible).
  });

  it("EVIDENCIA: vincularTicket (interacción + auditoría) tampoco usa `$transaction`", async () => {
    (qdRepository as any).asociarInteraccion = vi.fn().mockResolvedValue({ id: "i1" });
    (qdRepository as any).porId = vi.fn().mockResolvedValue(caso);
    await (qdService as any).vincularTicket("c1", "t9", "ana", "correo");
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });
});