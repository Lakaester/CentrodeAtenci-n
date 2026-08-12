/** @deprecated Este módulo ha sido reemplazado por modules/zendesk-test/. Se eliminará en M2. */
export type {
  ZendeskTicketStatus, ZendeskPriority, ZendeskTicketType, ZendeskUserRole, ZendeskCommentType,
  ZendeskTicket, ZendeskUser, ZendeskAttachment, ZendeskComment, ZendeskApiError,
} from "./ZendeskTypes";
export type { ZendeskEnvConfig } from "./ZendeskConfig";
export { loadZendeskConfig, isZendeskConfigurado } from "./ZendeskConfig";
export type { ZendeskErrorCode, ZendeskError } from "./ZendeskErrorHandler";
export { ZendeskErrorHandler } from "./ZendeskErrorHandler";

