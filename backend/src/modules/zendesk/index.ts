/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
export { zendeskRouter } from "./presentation/ZendeskRoutes";
export { ZendeskRepository } from "./infrastructure/ZendeskRepository";
export { ZendeskProvider } from "./application/ZendeskProvider";
export { MockZendeskProvider } from "./application/MockZendeskProvider";
export { ZendeskMapper } from "./application/mapper/ZendeskMapper";
export type {
  TicketZendeskDTO, MensajeZendeskDTO, ClienteZendeskDTO,
  BandejaZendeskDTO, ConversacionZendeskDTO,
} from "./application/dto/ZendeskDTOs";
export type { ZendeskEnvConfig } from "./domain/ZendeskConfig";
export { loadZendeskConfig, isZendeskConfigurado } from "./domain/ZendeskConfig";
export type { ZendeskError, ZendeskErrorCode } from "./domain/ZendeskErrorHandler";
export { ZendeskErrorHandler } from "./domain/ZendeskErrorHandler";

