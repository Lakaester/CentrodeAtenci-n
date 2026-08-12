import { Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui";

export function DuplicadaWorkspace() {
  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black-5">
        <Copy size={28} className="text-black-45" />
      </div>
      <div className="w-full space-y-2 text-left">
        <div className="rounded-lg border border-black-10 bg-light p-3 text-xs">
          <p className="font-medium text-black-85">Ticket relacionado</p>
          <p className="text-black-45">T-2024-0891 — Carlos Mendoza</p>
          <p className="text-[10px] text-black-25">10/07/2025 · En proceso</p>
        </div>
        <Button size="sm" variant="primary" className="w-full gap-2 text-[11px] h-8">
          <ExternalLink size={12} /> Abrir ticket original
        </Button>
      </div>
    </div>
  );
}
