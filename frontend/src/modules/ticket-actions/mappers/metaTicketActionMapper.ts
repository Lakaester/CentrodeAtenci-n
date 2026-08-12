import type { TicketActionRequestDTO } from "../dto/ticketActions.dto";

export interface MetaTicketActionPayload {
  status: string;
  userId?: number;
  withFarewellMessage?: boolean;
  category?: string;
}

export function metaTicketActionMapper(request: TicketActionRequestDTO): MetaTicketActionPayload {
  const actionMap: Record<string, { status: string; withFarewellMessage?: boolean }> = {
    CLOSE: { status: "closed", withFarewellMessage: true },
    REOPEN: { status: "open" },
    MARK_PENDING: { status: "pending" },
    MARK_OPEN: { status: "open" },
  };

  return {
    ...(actionMap[request.action] ?? { status: "open" }),
    userId: request.payload.userId as number | undefined,
    category: request.payload.category as string | undefined,
  };
}
