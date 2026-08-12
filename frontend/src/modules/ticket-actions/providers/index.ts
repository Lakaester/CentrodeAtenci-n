import type { TicketActionsProvider } from "./TicketActionsProvider";
import { mergedTicketActionsProvider } from "./MergedTicketActionsProvider";

export const ticketActionsProvider: TicketActionsProvider = mergedTicketActionsProvider;
