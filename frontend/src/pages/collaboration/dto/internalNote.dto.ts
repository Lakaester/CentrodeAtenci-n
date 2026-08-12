export type NoteCategory =
  | "general"
  | "technical"
  | "customer"
  | "billing"
  | "deployment"
  | "investigation"
  | "follow-up"
  | "internal";

export type NoteStatus = "activa" | "archivada";

export interface InternalNoteDTO {
  id: string;
  ticketId: string;
  author: string;
  authorRole: string;
  content: string;
  createdAt: string;
  visibility: "team" | "supervisor" | "private";
  category: NoteCategory;
  isPinned: boolean;
  status: NoteStatus;
}
