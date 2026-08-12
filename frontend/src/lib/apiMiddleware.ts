import { api } from "./api";
import type { InboxTicketDTO } from "@/modules/inbox/dto/inbox.dto";
import { ReplyService } from "@/modules/reply/services/ReplyService";
import { replyProvider } from "@/modules/reply/providers";
import { TicketActionsService } from "@/modules/ticket-actions/services/TicketActionsService";
import { ticketActionsProvider } from "@/modules/ticket-actions/providers";
import type { ReplyRequestDTO } from "@/modules/reply/dto/reply.dto";
import type { TicketActionRequestDTO, TicketActionType } from "@/modules/ticket-actions/dto/ticketActions.dto";

let inboxTickets: InboxTicketDTO[] = [];

export function setInboxTickets(tickets: InboxTicketDTO[]) {
  inboxTickets = tickets;
}

const ACTION_ENDPOINT_MAP: Record<string, TicketActionType> = {
  "reply-resolve": "CLOSE",
  status: "CUSTOM",
  assign: "CHANGE_ASSIGNEE",
  categorize: "ADD_CATEGORY",
};

let initialized = false;

export function initApiMiddleware() {
  if (initialized) return;
  initialized = true;

  api.interceptors.request.use(async (config) => {
    const url = config.url ?? "";

    if (!url.includes("/zendesk/tickets/") || config.method !== "post") {
      return config;
    }

    const match = url.match(/\/zendesk\/tickets\/(\d+)\/(\w+)/);
    if (!match) return config;

    const ticketId = match[1];
    const actionKey = match[2];
    const ticket = inboxTickets.find((t) => t.ticketNumber === ticketId);
    if (!ticket) return config;

    const body = typeof config.data === "string" ? JSON.parse(config.data) : (config.data ?? {});

    if (actionKey === "reply-resolve") {
      const replyService = new ReplyService(replyProvider);
      const request: ReplyRequestDTO = {
        ticketId, channel: ticket.channel, subChannel: ticket.subChannel,
        message: body.body ?? "", attachments: [], quotedMessage: null, raw: body,
      };
      try {
        await replyService.sendReply(ticket, request);
        return Promise.reject({ _handled: true, message: "Reply routed via provider" });
      } catch { return config; }
    }

    const action = ACTION_ENDPOINT_MAP[actionKey];
    if (action) {
      const actionService = new TicketActionsService(ticketActionsProvider);
      const request: TicketActionRequestDTO = {
        ticketId, channel: ticket.channel, subChannel: ticket.subChannel,
        action, payload: body, raw: body,
      };
      try {
        await actionService.executeAction(ticket, request);
        return Promise.reject({ _handled: true, message: "Action routed via provider" });
      } catch { return config; }
    }

    return config;
  });
}
