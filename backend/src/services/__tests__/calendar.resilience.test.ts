import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../repositories/agendas.repository", () => ({
  agendasRepository: { porId: vi.fn(), actualizarSyncCalendar: vi.fn() },
}));

import { agendasRepository } from "../../repositories/agendas.repository";
import { googleCalendarService, clasificarErrorCalendar } from "../../integrations/google/googleCalendar.service";
import { agendasService } from "../agendas.service";

const agenda = {
  id: "a1", ticket: "T1", tipo: "REUNION", asesor_id: "u1", estado: "ACTIVA",
  fecha: "2026-09-30", hora_inicio: "10:00", hora_fin: "11:00", eliminado: false,
  calendar_event_id: null, calendar_meet_link: null, asesor_correo: "a@cope.pe", created_by: "u1", updated_at: new Date(),
};

const eventoMock = { summary: "x", description: "y", startDateTime: "2026-09-30T10:00:00", endDateTime: "2026-09-30T11:00:00", extendedProperties: { copeAgendaId: "a1" } };

beforeEach(() => {
  vi.clearAllMocks();
  (agendasRepository.porId as any).mockResolvedValue(agenda);
  (agendasRepository.actualizarSyncCalendar as any).mockResolvedValue(agenda);
  googleCalendarService.isConfigured = vi.fn(async () => true) as any;
  googleCalendarService.isConnected = vi.fn(async () => true) as any;
  googleCalendarService.buildEventoFromAgenda = vi.fn(() => eventoMock) as any;
  googleCalendarService.obtenerEvento = vi.fn(async () => ({ exists: false })) as any;
  googleCalendarService.crearEvento = vi.fn() as any;
  googleCalendarService.actualizarEvento = vi.fn() as any;
  googleCalendarService.buscarEventoPorIdentificador = vi.fn(async () => null) as any;
});

afterEach(() => {
  vi.useRealTimers();
});

describe("O5-C — Calendar resilience / retry seguro (F02)", () => {
  it("CAL-01 create exitoso: 1 evento, event_id persistido, SYNCED", async () => {
    (googleCalendarService.crearEvento as any).mockResolvedValue({ eventId: "ev-1", htmlLink: "https://link" });
    const r = await agendasService.sincronizarCalendar("a1");
    expect(r.action).toBe("created");
    expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(1);
    expect(agendasRepository.actualizarSyncCalendar).toHaveBeenCalledWith("a1", expect.objectContaining({ calendar_event_id: "ev-1", calendar_sync_status: "SYNCED" }));
  });

  it("CAL-02/CAL-11 update exitoso con event_id → NO insert", async () => {
    (agendasRepository.porId as any).mockResolvedValue({ ...agenda, calendar_event_id: "ev-1" });
    (googleCalendarService.obtenerEvento as any).mockResolvedValue({ exists: true });
    (googleCalendarService.actualizarEvento as any).mockResolvedValue({ eventId: "ev-1", htmlLink: "https://link" });
    const r = await agendasService.sincronizarCalendar("a1");
    expect(r.action).toBe("updated");
    expect(googleCalendarService.crearEvento).not.toHaveBeenCalled();
    expect(googleCalendarService.actualizarEvento).toHaveBeenCalledTimes(1);
  });

  it("CAL-03 429 transitorio → retry acotado → éxito, sin duplicado", async () => {
    vi.useFakeTimers();
    (googleCalendarService.crearEvento as any)
      .mockRejectedValueOnce({ code: 429 })
      .mockResolvedValue({ eventId: "ev-1", htmlLink: "" });
    const p = agendasService.sincronizarCalendar("a1");
    await vi.advanceTimersByTimeAsync(5000);
    const r = await p;
    expect(r.action).toBe("created");
    expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(2); // 1 fallo + 1 retry
  });

  it("CAL-04 503 transitorio → retry → éxito", async () => {
    vi.useFakeTimers();
    (googleCalendarService.crearEvento as any)
      .mockRejectedValueOnce({ code: 503 })
      .mockResolvedValue({ eventId: "ev-1", htmlLink: "" });
    const p = agendasService.sincronizarCalendar("a1");
    await vi.advanceTimersByTimeAsync(5000);
    const r = await p;
    expect(r.action).toBe("created");
    expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(2);
  });

  it("CAL-05/CAL-06 400/403 determinista → SIN retry, ERROR", async () => {
    for (const code of [400, 403]) {
      vi.clearAllMocks();
      (agendasRepository.porId as any).mockResolvedValue(agenda);
      (agendasRepository.actualizarSyncCalendar as any).mockResolvedValue(agenda);
      (googleCalendarService.crearEvento as any).mockRejectedValue({ code });
      await expect(agendasService.sincronizarCalendar("a1")).rejects.toBeDefined();
      expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(1); // sin retry
      expect(agendasRepository.actualizarSyncCalendar).toHaveBeenCalledWith("a1", expect.objectContaining({ calendar_sync_status: "ERROR" }));
    }
  });

  it("CAL-07 AUTH (401) → sin loop, ERROR", async () => {
    (googleCalendarService.crearEvento as any).mockRejectedValue({ code: 401 });
    await expect(agendasService.sincronizarCalendar("a1")).rejects.toBeDefined();
    expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(1);
    expect(agendasRepository.actualizarSyncCalendar).toHaveBeenCalledWith("a1", expect.objectContaining({ calendar_sync_status: "ERROR" }));
  });

  it("CAL-08 CREATE timeout ambiguo sin reconciliación → NO retry ciego, ERROR", async () => {
    (googleCalendarService.crearEvento as any).mockRejectedValue({ code: "ECONNRESET" });
    await expect(agendasService.sincronizarCalendar("a1")).rejects.toBeDefined();
    expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(1); // sin blind retry
    expect(googleCalendarService.buscarEventoPorIdentificador).toHaveBeenCalled();
    expect(agendasRepository.actualizarSyncCalendar).toHaveBeenCalledWith("a1", expect.objectContaining({ calendar_sync_status: "ERROR" }));
  });

  it("CAL-09 CREATE ambiguo donde Google SÍ creó → reconciliación recupera event_id, sin segundo insert", async () => {
    (googleCalendarService.crearEvento as any).mockRejectedValue({ code: "ETIMEDOUT" });
    (googleCalendarService.buscarEventoPorIdentificador as any)
      .mockResolvedValueOnce(null) // antes del create
      .mockResolvedValueOnce({ eventId: "ev-existente", htmlLink: "https://l" }); // tras el fallo ambiguo
    const r = await agendasService.sincronizarCalendar("a1");
    expect(r.eventId).toBe("ev-existente");
    expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(1); // no segundo insert
    expect(agendasRepository.actualizarSyncCalendar).toHaveBeenCalledWith("a1", expect.objectContaining({ calendar_event_id: "ev-existente", calendar_sync_status: "SYNCED" }));
  });

  it("CAL-12 retry agotado (siempre 5xx) → ERROR, sin loop (4 intentos máx)", async () => {
    vi.useFakeTimers();
    (googleCalendarService.crearEvento as any).mockRejectedValue({ code: 500 });
    const p = agendasService.sincronizarCalendar("a1").catch(() => "error");
    await vi.advanceTimersByTimeAsync(20000);
    const r = await p;
    expect(r).toBe("error");
    expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(4); // 1 + 3 retries
    expect(agendasRepository.actualizarSyncCalendar).toHaveBeenCalledWith("a1", expect.objectContaining({ calendar_sync_status: "ERROR" }));
  });

  it("CAL-13 UPDATE 404 → el evento ya no existe → recrea (sin duplicar por reconciliación)", async () => {
    (agendasRepository.porId as any).mockResolvedValue({ ...agenda, calendar_event_id: "ev-1" });
    (googleCalendarService.obtenerEvento as any).mockResolvedValue({ exists: true });
    (googleCalendarService.actualizarEvento as any).mockRejectedValue({ code: 404 });
    (googleCalendarService.crearEvento as any).mockResolvedValue({ eventId: "ev-2", htmlLink: "" });
    const r = await agendasService.sincronizarCalendar("a1");
    expect(r.action).toBe("created");
    expect(r.eventId).toBe("ev-2");
    expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(1);
  });

  it("CAL-14 dos sync secuenciales → máximo un evento lógico (2ª sync = update)", async () => {
    (googleCalendarService.crearEvento as any).mockResolvedValue({ eventId: "ev-1", htmlLink: "" });
    await agendasService.sincronizarCalendar("a1");
    // Segunda invocación: la agenda ya tiene event_id → update.
    (agendasRepository.porId as any).mockResolvedValue({ ...agenda, calendar_event_id: "ev-1" });
    (googleCalendarService.obtenerEvento as any).mockResolvedValue({ exists: true });
    (googleCalendarService.actualizarEvento as any).mockResolvedValue({ eventId: "ev-1", htmlLink: "" });
    await agendasService.sincronizarCalendar("a1");
    expect(googleCalendarService.crearEvento).toHaveBeenCalledTimes(1); // solo 1 create
    expect(googleCalendarService.actualizarEvento).toHaveBeenCalledTimes(1);
  });

  it("clasificarErrorCalendar: categorías correctas", () => {
    expect(clasificarErrorCalendar({ code: 429 }).category).toBe("RETRYABLE");
    expect(clasificarErrorCalendar({ code: 503 }).category).toBe("RETRYABLE");
    expect(clasificarErrorCalendar({ code: 400 }).category).toBe("NON_RETRYABLE");
    expect(clasificarErrorCalendar({ code: 403 }).category).toBe("NON_RETRYABLE");
    expect(clasificarErrorCalendar({ code: 404 }).category).toBe("NON_RETRYABLE");
    expect(clasificarErrorCalendar({ code: 401 }).category).toBe("AUTH");
    expect(clasificarErrorCalendar({ code: "ECONNRESET" }).category).toBe("AMBIGUOUS");
    expect(clasificarErrorCalendar({ code: "ETIMEDOUT" }).category).toBe("AMBIGUOUS");
  });
});