import { describe, it, expect, vi, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  obtenerTicket: vi.fn(),
  obtenerUsuario: vi.fn(),
}));

vi.mock("../../zendesk/infrastructure/ZendeskClient", () => ({
  ZendeskClient: class {
    obtenerTicket = mocks.obtenerTicket;
    obtenerUsuario = mocks.obtenerUsuario;
  },
}));
vi.mock("../../../repositories/prisma", () => ({ prisma: {} }));

import { ZendeskTicketService } from "../ZendeskTicketService";

function ticket(overrides: Record<string, unknown> = {}) {
  return {
    id: 1,
    subject: "Asunto",
    description: "Desc",
    status: "open",
    priority: "normal",
    type: "question",
    created_at: "2026-11-09T00:00:00Z",
    updated_at: "2026-11-09T00:00:00Z",
    requester_id: null,
    assignee_id: null,
    group_id: 1,
    tags: ["perú"],
    custom_fields: [
      { id: 40769061038615, value: "https://cliente.restaurant.pe/ruta" },
      { id: 1500005211481, value: "Perú" },
    ],
    via: { channel: "email", source: { rel: "follow_up", from: { ticket_id: 10 } } },
    followup_ids: [11, 12],
    ...overrides,
  };
}

describe("ZendeskTicketService — canal y dominio (H-03)", () => {
  const service = new ZendeskTicketService();

  beforeEach(() => {
    vi.clearAllMocks();
    mocks.obtenerTicket.mockResolvedValue(ticket());
    mocks.obtenerUsuario.mockResolvedValue(null);
  });

  it("normaliza dominio URL y mapea email → CORREO", async () => {
    const t = await service.obtenerTicket(1);
    expect(t?.dominio).toBe("cliente.restaurant.pe");
    expect(t?.canal).toBe("CORREO");
    expect(t?.canalRaw).toBe("email");
    expect(t?.ticketPadreId).toBe("10");
    expect(t?.followupIds).toEqual(["11", "12"]);
  });

  it("marca relacionVerificada y followupsVerificados cuando la respuesta está completa", async () => {
    const t = await service.obtenerTicket(1);
    expect(t?.relacionVerificada).toBe(true);
    expect(t?.followupsVerificados).toBe(true);
  });

  it("no marca relacionVerificada si falta via.source", async () => {
    mocks.obtenerTicket.mockResolvedValue(ticket({ via: { channel: "email" } }));
    const t = await service.obtenerTicket(1);
    expect(t?.relacionVerificada).toBe(false);
    expect(t?.ticketPadreId).toBeNull();
  });

  it("no marca followupsVerificados si falta followup_ids", async () => {
    const sinFollowups = { ...ticket() } as any;
    delete sinFollowups.followup_ids;
    mocks.obtenerTicket.mockResolvedValue(sinFollowups);
    const r = await service.obtenerTicket(1);
    expect(r?.followupsVerificados).toBe(false);
  });

  it("rechaza un correo almacenado como dominio", async () => {
    mocks.obtenerTicket.mockResolvedValue(ticket({
      custom_fields: [{ id: 40769061038615, value: "munanqui@gmail.com" }],
    }));
    const t = await service.obtenerTicket(1);
    expect(t?.dominio).toBeNull();
  });

  it("rechaza dominio vacío", async () => {
    mocks.obtenerTicket.mockResolvedValue(ticket({
      custom_fields: [{ id: 40769061038615, value: "   " }],
    }));
    const t = await service.obtenerTicket(1);
    expect(t?.dominio).toBeNull();
  });

  it("mapea chat → CHAT", async () => {
    mocks.obtenerTicket.mockResolvedValue(ticket({ via: { channel: "chat", source: {} } }));
    const t = await service.obtenerTicket(1);
    expect(t?.canal).toBe("CHAT");
  });

  it("mapea whatsapp → WHATSAPP", async () => {
    mocks.obtenerTicket.mockResolvedValue(ticket({ via: { channel: "whatsapp", source: {} } }));
    const t = await service.obtenerTicket(1);
    expect(t?.canal).toBe("WHATSAPP");
  });

  it("native_messaging no se asume como CORREO", async () => {
    mocks.obtenerTicket.mockResolvedValue(ticket({ via: { channel: "native_messaging", source: {} } }));
    const t = await service.obtenerTicket(1);
    expect(t?.canal).toBeNull();
    expect(t?.canalRaw).toBe("native_messaging");
  });

  it("sin país devuelve null", async () => {
    mocks.obtenerTicket.mockResolvedValue(ticket({
      custom_fields: [{ id: 40769061038615, value: "cliente.restaurant.pe" }],
    }));
    const t = await service.obtenerTicket(1);
    expect(t?.pais).toBeNull();
  });
});
