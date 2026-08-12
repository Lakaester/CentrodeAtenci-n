import { MessageSquare, Send, Clock } from "lucide-react";
import { Button } from "@/components/ui";

export function NoContestoWorkspace() {
  return (
    <div className="flex flex-col items-center gap-4 p-6 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-black-5">
        <MessageSquare size={28} className="text-black-45" />
      </div>
      <div className="w-full space-y-3">
        <div className="rounded-lg border border-black-10 bg-light p-3 text-left text-xs">
          <p className="mb-1 flex items-center gap-1 text-[10px] text-black-25">
            <Clock size={10} /> Último mensaje enviado hace 3 días
          </p>
          <p className="text-black-45 italic">"Estimado Carlos, le confirmamos que el cargo será revertido en 24-48 horas."</p>
        </div>
        <Button size="sm" variant="primary" className="w-full gap-2 text-[11px] h-8">
          <Send size={12} /> Reenviar mensaje
        </Button>
      </div>
    </div>
  );
}
