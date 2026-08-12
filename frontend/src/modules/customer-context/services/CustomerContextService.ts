import type { CustomerContextProvider } from "../providers/CustomerContextProvider";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { CustomerContextDTO } from "../dto/customerContext.dto";

export class CustomerContextService {
  constructor(private provider: CustomerContextProvider) {}

  async getCustomerContext(ticket: InboxTicketDTO): Promise<CustomerContextDTO> {
    return this.provider.getCustomerContext(ticket);
  }
}
