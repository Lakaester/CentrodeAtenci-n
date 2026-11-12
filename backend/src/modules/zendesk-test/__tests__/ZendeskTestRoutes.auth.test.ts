import { describe, it, expect, vi } from "vitest";

vi.mock("../../../services/auth.service", () => ({
  authService: {
    COOKIE_NAME: "cope_session",
    usuarioPorToken: vi.fn(),
    hasPermiso: vi.fn(),
  },
}));

vi.mock("../ZendeskTestController", () => {
  const f = () => vi.fn();
  return {
    zendeskTestController: {
      test: f(), views: f(), inbox: f(), ticketDetail: f(), ticketComments: f(),
      atencionCompleta: f(), updateDomain: f(), getClientInfo: f(), addClientDomain: f(),
      getAgents: f(), replyResolve: f(), history: f(), getCustomerMemory: f(),
      linkDomainCustomerMemory: f(), checkDomainSuggestion: f(), customer: f(),
      customerTimeline: f(), agents: f(), internalNote: f(), assign: f(),
      changeStatus: f(), categorize: f(), reply: f(),
    },
  };
});

import { zendeskTestRouter } from "../ZendeskTestRoutes";
import { zendeskTestController } from "../ZendeskTestController";

describe("ZendeskTestRoutes — autorización H-01", () => {
  it("categorize tiene requirePermission antes del controlador", () => {
    const stack = (zendeskTestRouter as any).stack;
    const layer = stack.find((l: any) => l.route?.path === "/tickets/:id/categorize");
    expect(layer).toBeTruthy();
    // middleware de permiso + controlador
    expect(layer.route.stack).toHaveLength(2);
    expect(layer.route.stack[1].handle).toBe(zendeskTestController.categorize);
  });
});
