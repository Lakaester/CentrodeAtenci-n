import { useMemo } from "react";
import { mapNotes, type NoteUI } from "../mappers/note.mapper";
import type { InternalNoteDTO } from "../dto/internalNote.dto";

export function useInternalNotes(dtos?: InternalNoteDTO[]): NoteUI[] {
  const data = dtos ?? [];
  return useMemo(() => mapNotes(data), [data]);
}
