import { describe, it, expect, vi, beforeEach } from "vitest";

const tx = { $queryRawUnsafe: vi.fn(), $executeRawUnsafe: vi.fn() };

vi.mock("../../repositories/prisma", () => ({
  prisma: { $transaction: async (fn: (t: unknown) => unknown) => fn(tx) },
}));

vi.mock("../../repositories/agendas.repository", () => ({
  agendasRepository: {
    porId: vi.fn(),
    registrarTiempoReal: vi.fn(),
    actualizarEstado: vi.fn(),
  },
}));

import { agendasRepository } from "../../repositories/agendas.repository";
import { agendasService } from "../agendas.service";

const agendaPendiente = {
  id: "a1", ticket: "T1", tipo: "REUNION", asesor_id: "u1", estado: "PENDIENTE",
  fecha: "2026-09-30", hora_inicio: "10:00", hora_fin: "11:00", eliminado: false,
  calendar_event_id: null, created_by: "u1", updated_at: new Date(),
};

describe("Agendas transacciones + CAS (O4-B.3, AUD-230)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (agendasRepository.porId as any).mockResolvedValue(agendaPendiente);
  });

  it("transición válida: actualizarEstado con CAS (estado esperado) dentro de tx", async () => {
    (agendasRepository.actualizarEstado as any).mockResolvedValue({ ...agendaPendiente, estado: "ACTIVA" });
    const r = await agendasService.actualizarEstado("a1", "ACTIVA", null);
    expect(r.estado).toBe("ACTIVA");
    expect(agendasRepository.actualizarEstado).toHaveBeenCalledWith("a1", "ACTIVA", null, "PENDIENTE", tx);
    expect(agendasRepository.registrarTiempoReal).not.toHaveBeenCalled(); // sin resultado
  });

  it("transición inválida: PENDIENTE → FINALIZADA → TRANSICION_INVALIDA", async () => {
    await expect(agendasService.actualizarEstado("a1", "FINALIZADA", null)).rejects.toMatchObject({
      code: "TRANSICION_INVALIDA",
    });
    expect(agendasRepository.actualizarEstado).not.toHaveBeenCalled();
  });

  it("CAS conflict: estado cambió concurrentemente → TRANSICION_CONFLICTO y sin side effect de cancelación", async () => {
    const spyCancel = vi.spyOn(agendasService, "cancelarEnCalendar" as any).mockResolvedValue(undefined);
    (agendasRepository.porId as any).mockResolvedValue({ ...agendaPendiente, estado: "ACTIVA", calendar_event_id: "ev-1" });
    (agendasRepository.actualizarEstado as any).mockResolvedValue(null); // CAS pierde
    await expect(agendasService.actualizarEstado("a1", "CANCELADA", null)).rejects.toMatchObject({
      code: "TRANSICION_CONFLICTO",
    });
    // registrarTiempoReal se ejecutó dentro de la tx pero el CAS falló → rollback; no se cancela en Calendar.
    expect(agendasRepository.registrarTiempoReal).toHaveBeenCalledWith("a1", { resultado: "CANCELADA" }, tx);
    expect(spyCancel).not.toHaveBeenCalled();
    spyCancel.mockRestore();
  });

  it("CANCELADA con éxito: registrarTiempoReal + CAS dentro de tx y cancelación en Calendar FUERA", async () => {
    const spyCancel = vi.spyOn(agendasService, "cancelarEnCalendar" as any).mockResolvedValue(undefined);
    (agendasRepository.porId as any).mockResolvedValue({ ...agendaPendiente, estado: "ACTIVA", calendar_event_id: "ev-1" });
    (agendasRepository.registrarTiempoReal as any).mockResolvedValue({ ...agendaPendiente, estado: "ACTIVA" });
    (agendasRepository.actualizarEstado as any).mockResolvedValue({ ...agendaPendiente, estado: "CANCELADA", calendar_event_id: "ev-1" });
    const r = await agendasService.actualizarEstado("a1", "CANCELADA", null);
    expect(r.estado).toBe("CANCELADA");
    expect(agendasRepository.registrarTiempoReal).toHaveBeenCalledWith("a1", { resultado: "CANCELADA" }, tx);
    expect(agendasRepository.actualizarEstado).toHaveBeenCalledWith("a1", "CANCELADA", null, "ACTIVA", tx);
    expect(spyCancel).toHaveBeenCalledWith("a1"); // side effect externo fuera de la tx
    spyCancel.mockRestore();
  });
});