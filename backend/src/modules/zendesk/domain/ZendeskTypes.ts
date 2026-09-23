/** @deprecated Este m�dulo ha sido reemplazado por modules/zendesk-test/. Se eliminar� en M2. */
export type ZendeskTicketStatus = "new" | "open" | "pending" | "solved" | "closed";
export type ZendeskPriority = "low" | "normal" | "high" | "urgent";
export type ZendeskTicketType = "problem" | "incident" | "question" | "task";
export type ZendeskUserRole = string;
export type ZendeskCommentType = "Comment" | "VoiceComment";

export interface ZendeskTicket {
  id: number;
  subject: string;
  description: string;
  status: ZendeskTicketStatus;
  priority: ZendeskPriority | null;
  type: ZendeskTicketType;
  created_at: string;
  updated_at: string;
  requester_id: number;
  assignee_id: number | null;
  group_id: number;
tags: string[];
  custom_fields: { id: number; value: string }[];
  organization_id?: number | null;
  via?: {
    channel?: string;
    source?: { rel?: string | null; from?: { ticket_id?: number | null; subject?: string } };
  } | null;
  followup_ids?: number[];
}

export interface ZendeskUser {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  organization_id: number | null;
  role: ZendeskUserRole;
  created_at: string;
  updated_at: string;
}

export interface ZendeskAttachment {
  id: number;
  file_name: string;
  content_url: string;
}

export interface ZendeskComment {
  id: number;
  body: string;
  html_body?: string;
  author_id: number;
  type: ZendeskCommentType;
  created_at: string;
  public: boolean;
  attachments: ZendeskAttachment[];
}

export interface ZendeskApiError {
  code: number;
  title: string;
  message: string;
}

