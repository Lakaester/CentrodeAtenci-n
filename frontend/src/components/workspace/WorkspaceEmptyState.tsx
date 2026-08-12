import { Inbox } from "lucide-react";

export function WorkspaceEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center px-8">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-light">
        <Inbox size={28} className="text-black-45" />
      </div>
      <p className="text-sm text-black-45">
        Seleccione un ticket para ver su detalle
      </p>
    </div>
  );
}
