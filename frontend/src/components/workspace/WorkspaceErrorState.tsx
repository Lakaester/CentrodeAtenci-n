import { AlertCircle, RotateCcw } from "lucide-react";

interface Props {
  message?: string;
  onRetry: () => void;
}

export function WorkspaceErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 px-8">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-5">
        <AlertCircle size={28} className="text-danger" />
      </div>
      <div className="text-center">
        <p className="text-sm font-medium text-black-85">Error al cargar el ticket</p>
        {message && (
          <p className="mt-1 text-xs text-black-45">{message}</p>
        )}
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex items-center gap-1.5 rounded border border-black-10 bg-white px-3 py-1.5 text-xs font-medium text-black-85 hover:bg-light"
      >
        <RotateCcw size={13} />
        Reintentar
      </button>
    </div>
  );
}
