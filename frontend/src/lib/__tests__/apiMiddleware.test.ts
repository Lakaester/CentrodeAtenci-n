import { describe, it, expect, vi, beforeAll, beforeEach } from "vitest";

const mocks = vi.hoisted(() => ({
  requestUse: vi.fn(),
  sendReply: vi.fn(),
  executeAction: vi.fn(),
}));

vi.mock("@/lib/api", () => ({
  api: { interceptors: { request: { use: mocks.requestUse } } },
}));
vi.mock("@/modules/reply/services/ReplyService", () => ({
  ReplyService: class { sendReply = mocks.sendReply; },
}));
vi.mock("@/modules/reply/providers", () => ({ replyProvider: {} }));
vi.mock("@/modules/ticket-actions/services/TicketActionsService", () => ({
  TicketActionsService: class { executeAction = mocks.executeAction; },
}));
vi.mock("@/modules/ticket-actions/providers", () => ({ ticketActionsProvider: {} }));

import { initApiMiddleware, setInboxTickets } from "@/lib/apiMiddleware";

let handler: (config: any) => Promise<any>;

const ticket = {
  id: "t1",
  ticketNumber: "123",
  channel: "email",
  subChannel: "zendesk",
  status: "open",
  subject: "Asunto",
  lastMessage: "Mensaje",
  contact: { name: "Cliente", email: "c@restaurant.pe", phone: null, avatarUrl: null },
  assignee: null,
  queue: null,
  updatedAt: "2026-11-09T00:00:00.000Z",
  createdAt: "2026-11-09T00:00:00.000Z",
  unreadCount: 0,
  avatar: null,
  priority: "normal",
  raw: {},
} as any;

function config(action: string, extra: Record<string, unknown> = {}) {
  return {
    url: `/zendesk/tickets/123/${action}`,
    method: "post",
    data: { body: "texto", categoria: "QUEJA", subcategoria: "queja_servicio", assigneeId: 7, status: "open" },
    ...extra,
  };
}

beforeAll(() => {
  initApiMiddleware();
  handler = mocks.requestUse.mock.calls[0][0];
});

beforeEach(() => {
  vi.clearAllMocks();
  setInboxTickets([ticket]);
  mocks.executeAction.mockResolvedValue({ success: true });
  mocks.sendReply.mockResolvedValue({ success: true });
});

describe("apiMiddleware — Fase 1", () => {
  it("respeta __skipApiMiddleware y no reenruta (evita recursión)", async () => {
    const cfg = config("categorize", { __skipApiMiddleware: true });
    await expect(handler(cfg)).resolves.toBe(cfg);
    expect(mocks.executeAction).not.toHaveBeenCalled();
    expect(mocks.sendReply).not.toHaveBeenCalled();
  });

  it("categorize → ADD_CATEGORY una sola vez", async () => {
    await expect(handler(config("categorize"))).rejects.toMatchObject({ _handled: true });
    expect(mocks.executeAction).toHaveBeenCalledTimes(1);
    expect(mocks.executeAction.mock.calls[0][1]).toMatchObject({ action: "ADD_CATEGORY" });
  });

  it("assign → CHANGE_ASSIGNEE", async () => {
    await expect(handler(config("assign"))).rejects.toMatchObject({ _handled: true });
    expect(mocks.executeAction.mock.calls[0][1]).toMatchObject({ action: "CHANGE_ASSIGNEE" });
  });

  it("status → CUSTOM (fallback al backend si el provider no lo soporta)", async () => {
    await expect(handler(config("status"))).rejects.toMatchObject({ _handled: true });
    expect(mocks.executeAction.mock.calls[0][1]).toMatchObject({ action: "CUSTOM" });
  });

  it("reply-resolve → ReplyService.sendReply", async () => {
    await expect(handler(config("reply-resolve"))).rejects.toMatchObject({ _handled: true });
    expect(mocks.sendReply).toHaveBeenCalledTimes(1);
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it("reply-resolve conserva los adjuntos del body", async () => {
    const archivos = [{ name: "a.txt", base64: "eA==", contentType: "text/plain" }];
    const cfg = config("reply-resolve", { data: { body: "texto", archivos } });
    await expect(handler(cfg)).rejects.toMatchObject({ _handled: true });
    expect(mocks.sendReply.mock.calls[0][1]).toMatchObject({ message: "texto", attachments: archivos });
  });

  it("internal-note → no se enruta, llega al backend", async () => {
    const cfg = config("internal-note");
    await expect(handler(cfg)).resolves.toBe(cfg);
    expect(mocks.executeAction).not.toHaveBeenCalled();
    expect(mocks.sendReply).not.toHaveBeenCalled();
  });

  it("si el provider falla, deja pasar el request al backend", async () => {
    mocks.executeAction.mockRejectedValue(new Error("provider down"));
    const cfg = config("categorize");
    await expect(handler(cfg)).resolves.toBe(cfg);
  });

  it("ticket fuera de la bandeja → no intercepta", async () => {
    setInboxTickets([]);
    const cfg = config("categorize");
    await expect(handler(cfg)).resolves.toBe(cfg);
    expect(mocks.executeAction).not.toHaveBeenCalled();
  });

  it("método no POST → no intercepta", async () => {
    const cfg = { ...config("categorize"), method: "get" };
    await expect(handler(cfg)).resolves.toBe(cfg);
  });
});
