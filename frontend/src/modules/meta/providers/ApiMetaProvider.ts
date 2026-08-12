import type { MetaProvider } from "./MetaProvider";

export const apiMetaProvider: MetaProvider = {
  getTickets: () => { throw new Error("Not implemented"); },
  getConversation: () => { throw new Error("Not implemented"); },
  sendMessage: () => { throw new Error("Not implemented"); },
  closeTicket: () => { throw new Error("Not implemented"); },
};
