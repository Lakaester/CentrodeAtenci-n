import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { CustomerContextDTO } from "../dto/customerContext.dto";

export interface CustomerContextProvider {
  getCustomerContext(ticket: InboxTicketDTO): Promise<CustomerContextDTO>;
}
