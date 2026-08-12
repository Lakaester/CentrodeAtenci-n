import { AlertTriangle } from "lucide-react";
import { Button } from "./Button";

interface Props {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({ message, onRetry }: Props) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="mx-auto max-w-sm text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger-5">
          <AlertTriangle size={28} className="text-danger" />
        </div>
        <h3 className="text-base font-semibold text-black-85">Error al cargar</h3>
        <p className="mt-1 text-sm text-black-45">
          {message ?? "No se pudieron obtener los datos. Intente nuevamente."}
        </p>
        {onRetry && (
          <Button variant="primary" size="sm" className="mt-4" onClick={onRetry}>
            Reintentar
          </Button>
        )}
      </div>
    </div>
  );
}
