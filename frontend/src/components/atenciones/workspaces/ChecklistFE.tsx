import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

const ITEMS = [
  { label: "Revisar CDT (Estado y vencimiento)", done: true },
  { label: "Revisar Certificado Digital", done: true },
  { label: "Revisar comprobantes en cola", done: false },
  { label: "Revisar estado SUNAT", done: false },
  { label: "Revisar Restafact", done: false },
  { label: "Revisar historial FE del cliente", done: false },
];

export function ChecklistFE() {
  return (
    <div className="space-y-1">
      {ITEMS.map((item, i) => (
        <div key={i} className="flex items-center gap-2 rounded-lg border border-black-5 p-2 text-xs">
          {item.done ? (
            <CheckCircle2 size={14} className="shrink-0 text-success" />
          ) : (
            <Circle size={14} className="shrink-0 text-black-10" />
          )}
          <span className={cn("text-black-85", item.done && "text-black-25 line-through")}>
            {item.label}
          </span>
        </div>
      ))}
    </div>
  );
}
