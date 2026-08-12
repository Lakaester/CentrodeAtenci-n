import { useQuery } from "@tanstack/react-query";
import { CustomerContextService } from "../services/CustomerContextService";
import { customerContextProvider } from "../providers";
import type { InboxTicketDTO } from "../../inbox/dto/inbox.dto";
import type { CustomerContextDTO } from "../dto/customerContext.dto";

const service = new CustomerContextService(customerContextProvider);

interface CustomerContextResult {
  context: CustomerContextDTO | null;
  isLoading: boolean;
  isError: boolean;
  error: string | null;
}

export function useCustomerContext(ticket: InboxTicketDTO | null): CustomerContextResult {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["customer-context", ticket?.id, ticket?.subChannel],
    queryFn: () => service.getCustomerContext(ticket!),
    enabled: !!ticket,
    staleTime: 60_000,
    retry: 1,
  });

  return {
    context: data ?? null,
    isLoading: isLoading && !!ticket,
    isError,
    error: error instanceof Error ? error.message : isError ? "Error al cargar contexto del cliente" : null,
  };
}
