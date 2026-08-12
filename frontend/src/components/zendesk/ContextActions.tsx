import { useState } from "react";
import { Reply, FileText, UserPlus, ArrowRightLeft, Tags, CheckCircle2, Send, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { AutoResizeTextarea } from "@/components/ui/AutoResizeTextarea";
import { useZendeskActions } from "./useZendeskActions";

interface Props {
  ticketId: string | null;
}

type AccionId = "reply" | "note" | "assign" | "status" | "categorize";

export function ContextActions({ ticketId }: Props) {
  const [accionActiva, setAccionActiva] = useState<AccionId | null>(null);
  const [inputValue, setInputValue] = useState("");
  const actions = useZendeskActions(ticketId);
  const ASESOR = "Asesor COPE";

  const ACCIONES: { id: AccionId; label: string; icon: typeof Reply; inputLabel: string; placeholder: string }[] = [
    { id: "reply",     label: "Responder",      icon: Reply,        inputLabel: "Respuesta al cliente", placeholder: "Escriba su respuesta..." },
    { id: "note",      label: "Nota interna",   icon: FileText,     inputLabel: "Nota interna",          placeholder: "Escriba la nota..." },
    { id: "assign",    label: "Asignar",        icon: UserPlus,     inputLabel: "ID del agente",         placeholder: "Ingrese ID del agente..." },
    { id: "status",    label: "Estado",         icon: ArrowRightLeft, inputLabel: "Nuevo estado",         placeholder: "new/open/pending/solved/closed" },
    { id: "categorize",label: "Categorizar",    icon: Tags,         inputLabel: "Categoría / Subcategoría", placeholder: "cat / subcat" },
  ];

  const ejecutar = () => {
    if (!inputValue.trim()) return;
    switch (accionActiva) {
      case "reply":
        actions.reply(inputValue, ASESOR);
        break;
      case "note":
        actions.internalNote(inputValue, ASESOR);
        break;
      case "status":
        actions.changeStatus(inputValue, ASESOR);
        break;
      case "categorize": {
        const [cat, subcat = ""] = inputValue.split("/").map((s) => s.trim());
        actions.categorize(cat, subcat, ASESOR);
        break;
      }
      case "assign": {
        const id = Number(inputValue);
        if (!isNaN(id)) actions.assign(id, ASESOR);
        break;
      }
    }
    setInputValue("");
    setAccionActiva(null);
  };

  if (!ticketId) return null;

  return (
    <div className="shrink-0 border-t border-black-10 bg-white">
      {/* Botones de acción */}
      <div className="flex flex-wrap gap-1 px-2 py-1.5">
        {ACCIONES.map((a) => {
          const Icon = a.icon;
          const activa = accionActiva === a.id;
          return (
            <button key={a.id} onClick={() => setAccionActiva(activa ? null : a.id)}
              className={cn(
                "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[10px] font-medium transition-colors",
                activa ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10",
              )}
            >
              <Icon size={11} />
              <span>{a.label}</span>
            </button>
          );
        })}
      </div>

      {/* Panel de entrada */}
      {accionActiva && (
        <div className="border-t border-black-10 px-2 py-1.5">
          {actions.loading === accionActiva ? (
            <p className="text-[10px] text-black-25">Enviando...</p>
          ) : actions.result === "ok" ? (
            <div className="flex items-center gap-1 text-[10px] text-success">
              <CheckCircle2 size={10} /> Acción completada
              <button onClick={() => setAccionActiva(null)} className="ml-auto text-black-25"><X size={10} /></button>
            </div>
          ) : (
            <div className="space-y-1">
              {accionActiva === "reply" ? (
                <AutoResizeTextarea value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                  placeholder={ACCIONES.find((a) => a.id === accionActiva)?.placeholder ?? ""}
                  minHeight={60}
                  maxHeight={200}
                  className="text-[11px] px-2 py-1.5"
                  rows={2}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && e.ctrlKey) {
                      e.preventDefault();
                      ejecutar();
                    }
                  }} />
              ) : (
                <input type="text" value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                  placeholder={ACCIONES.find((a) => a.id === accionActiva)?.placeholder ?? ""}
                  className="w-full rounded border border-black-10 px-1.5 py-1 text-[11px] text-black-85 placeholder:text-black-10 focus:border-[#2563EB] focus:outline-none"
                />
              )}
              <div className="flex justify-between items-center">
                {accionActiva === "reply" && <span className="text-[9px] text-black-25">Respuesta pública al cliente</span>}
                {accionActiva === "note" && <span className="text-[9px] text-warning">🔒 Nota interna (solo agentes)</span>}
                {accionActiva === "categorize" && <span className="text-[9px] text-black-25">Formato: categoría / subcategoría</span>}
                {accionActiva === "status" && <span className="text-[9px] text-black-25">new · open · pending · solved · closed</span>}
                {accionActiva === "assign" && <span className="text-[9px] text-black-25">ID del agente (ver /agents)</span>}
                <button onClick={ejecutar} disabled={!inputValue.trim()}
                  className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white hover:bg-primary-85 disabled:opacity-50">
                  <Send size={11} className="inline mr-0.5" /> Enviar
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
