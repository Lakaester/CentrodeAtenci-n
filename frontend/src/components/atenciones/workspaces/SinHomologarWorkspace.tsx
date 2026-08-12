import { HelpCircle } from "lucide-react";
import { Button } from "@/components/ui";

export function SinHomologarWorkspace() {
  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black-5">
        <HelpCircle size={28} className="text-black-45" />
      </div>
      <div>
        <p className="text-sm font-semibold text-black-85">Categoría desconocida</p>
        <p className="mt-1 text-xs text-black-45">
          Este ticket no tiene una categoría asignada. Solicite la categorización manual antes de proceder.
        </p>
      </div>
      <Button size="sm" variant="primary" className="text-[11px] h-8">
        Solicitar categorización
      </Button>
    </div>
  );
}
