import { Headphones, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";

export function OperativoWorkspace() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black-5">
        <Headphones size={28} className="text-black-45" />
      </div>
      <div>
        <p className="text-sm font-semibold text-black-85">Soporte en Línea</p>
        <p className="mt-1 text-xs text-black-45">
          Este caso pertenece a Soporte en Línea.
        </p>
      </div>
      <Button size="sm" variant="primary" className="gap-2">
        Derivar <ArrowRight size={14} />
      </Button>
    </div>
  );
}
