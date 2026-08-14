import { Info } from "lucide-react";

export function SeccionNoConfigurada({ titulo, descripcion }: { titulo: string; descripcion: string }) {
  return (
    <div className="flex h-full items-center justify-center p-8">
      <div className="max-w-sm text-center">
        <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-black-5 text-black-45">
          <Info size={18} />
        </div>
        <h3 className="text-sm font-semibold text-black-85">{titulo}</h3>
        <p className="mt-1 text-xs text-black-45">{descripcion}</p>
        <p className="mt-3 inline-block rounded bg-black-5 px-2 py-1 text-[10px] text-black-45">No configurado</p>
      </div>
    </div>
  );
}
