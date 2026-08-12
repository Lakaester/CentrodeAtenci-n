import { getNoteCategoryConfig } from "../registry/note.registry";
import type { InternalNoteDTO } from "../dto/internalNote.dto";

export interface NoteUI {
  id: string;
  ticketId: string;
  author: string;
  authorRole: string;
  content: string;
  createdAt: string;
  timeAgo: string;
  visibility: string;
  category: string;
  categoryColor: string;
  isPinned: boolean;
  status: string;
}

function formatTimeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
  if (diff < 1) return "Ahora";
  if (diff < 60) return `Hace ${diff} min`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `Hace ${h}h`;
  const d = Math.floor(h / 24);
  return `Hace ${d}d`;
}

export function mapNote(dto: InternalNoteDTO): NoteUI {
  const cc = getNoteCategoryConfig(dto.category);
  return {
    id: dto.id,
    ticketId: dto.ticketId,
    author: dto.author,
    authorRole: dto.authorRole,
    content: dto.content,
    createdAt: dto.createdAt,
    timeAgo: formatTimeAgo(dto.createdAt),
    visibility: dto.visibility,
    category: cc.label,
    categoryColor: cc.color,
    isPinned: dto.isPinned,
    status: dto.status,
  };
}

export function mapNotes(dtos: InternalNoteDTO[]): NoteUI[] {
  return dtos
    .map(mapNote)
    .sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
}
