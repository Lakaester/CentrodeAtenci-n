import { DashboardWidget } from "@/components/widgets";
import { NotesList } from "./NotesList";
import type { NoteUI } from "../mappers/note.mapper";
import type { CollaborationState } from "../hooks/useCollaboration";

interface Props {
  notes: NoteUI[];
  state: CollaborationState;
  error: string | null;
  onRetry: () => void;
}

export function NotesArea({ notes, state, error, onRetry }: Props) {
  return (
    <DashboardWidget title="Notas internas" subtitle="Notas compartidas del equipo" state={state === "error" ? "error" : "success"}>
      <NotesList items={notes} state={state === "loading" ? "loading" : notes.length === 0 ? "empty" : "success"} error={error} onRetry={onRetry} />
    </DashboardWidget>
  );
}
