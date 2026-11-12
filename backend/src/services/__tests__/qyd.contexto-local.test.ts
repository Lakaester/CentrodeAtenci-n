import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerAtencion: vi.fn(),
  relacionCache: vi.fn(),
  vista: vi.fn(),
}));

vi.mock("../../repositories/prisma", () => ({
  prisma: { $queryRawUnsafe: mocks.vista },
}));

vi.mock("../../repositories/atencionOperativa.repository", () => ({
  atencionOperativaRepository: { obtenerPorTicket: mocks.obtenerAtencion },
}));

vi.mock("../../repositories/quejasDevoluciones.repository", () => ({
  qdRepository: { relacionCache: mocks.relacionCache },
}));

import { obtenerContextoQydLocal } from "../qydContextoLocal.service";

function atencion(overrides: Record<string, unknown> = {}) {
  return {
    id: "a1",
    zendesk_ticket_id: "34576",
    dominio_identificado: "cesars.restaurant.pe",
    categoria: "DEVOLUCIÓN",
    subcategoria: "solicitud_de_devolución",
    asesor: "Ana Asesora",
    estado: "open",
    zendesk_snapshot: {
      createdAt: "2026-07-05T15:00:00Z",
      pais: "PERU",
      canal: "CORREO",
      canalRaw: "email",
      via: { channel: "email", source: { rel: null, from: {} } },
      followupIds: [],
      ticketPadreId: null,
      relacionVerificada: true,
    },
    ...overrides,
  };
}

describe("qydContextoLocal — creación QyD sin API Zendesk", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerAtencion.mockResolvedValue(atencion());
    mocks.relacionCache.mockResolvedValue(null);
    mocks.vista.mockResolvedValue([]);
  });

  it("usa el snapshot de atención: dominio, canal, fecha, asesor y estado", async () => {
    const ctx = await obtenerContextoQydLocal("34576");
    expect(ctx).toMatchObject({
      dominio: "cesars.restaurant.pe",
      pais: "PERU",
      canal: "CORREO",
      canalRaw: "email",
      asesor: "Ana Asesora",
      estado: "open",
      fechaOriginalIso: "2026-07-05T15:00:00Z",
      relacionVerificada: true,
      ticketPadreId: null,
      followupIds: [],
      fuente: { atencion: true, vista: false, relacionCache: false },
    });
  });

  it("deriva el padre desde via cuando el snapshot no trae ticketPadreId", async () => {
    mocks.obtenerAtencion.mockResolvedValue(atencion({
      zendesk_snapshot: {
        createdAt: "2026-07-05T15:00:00Z",
        pais: "PERU",
        canal: "email",
        via: { channel: "email", source: { rel: "follow_up", from: { ticket_id: 33967 } } },
        relacionVerificada: true,
      },
    }));
    const ctx = await obtenerContextoQydLocal("34576");
    expect(ctx?.ticketPadreId).toBe("33967");
    expect(ctx?.relacionVerificada).toBe(true);
  });

  it("sin canal en atención cae a la vista; si tampoco hay, devuelve null", async () => {
    mocks.obtenerAtencion.mockResolvedValue(atencion({
      zendesk_snapshot: { createdAt: "2026-07-05T15:00:00Z", pais: "PERU", relacionVerificada: true },
    }));
    mocks.vista.mockResolvedValue([{
      created_at: "2026-07-05T15:00:00Z", categoria: "GESTION", subcategoria: "queja",
      dominio: "cesars.restaurant.pe", pais: "PERU", canal: "ZENDESK", asesor: "Ana", estado: "open",
    }]);
    let ctx = await obtenerContextoQydLocal("34576");
    expect(ctx?.canal).toBe("CORREO");
    expect(ctx?.canalRaw).toBe("ZENDESK");

    mocks.vista.mockResolvedValue([]);
    ctx = await obtenerContextoQydLocal("34576");
    expect(ctx?.canal).toBeNull();
  });

  it("usa qd_relaciones_ticket cuando el snapshot no tiene relación", async () => {
    mocks.obtenerAtencion.mockResolvedValue(atencion({
      zendesk_snapshot: { createdAt: "2026-07-05T15:00:00Z", pais: "PERU", canal: "email" },
    }));
    mocks.relacionCache.mockResolvedValue({
      ticket_padre_id: "33967", followup_ids: ["34577"], origen: "zendesk", fetched_at: new Date(),
    });
    const ctx = await obtenerContextoQydLocal("34576");
    expect(ctx?.relacionVerificada).toBe(true);
    expect(ctx?.ticketPadreId).toBe("33967");
    expect(ctx?.followupIds).toEqual(["34577"]);
  });

  it("sin atención, vista ni relación devuelve null", async () => {
    mocks.obtenerAtencion.mockResolvedValue(null);
    mocks.vista.mockResolvedValue([]);
    mocks.relacionCache.mockResolvedValue(null);
    expect(await obtenerContextoQydLocal("99999")).toBeNull();
  });
});
