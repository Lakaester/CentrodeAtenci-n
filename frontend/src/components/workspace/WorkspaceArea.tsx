import { useState, useRef } from "react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";
import { ConversationPanel } from "./ConversationPanel";
import { ConversationSkeleton } from "./ConversationSkeleton";
import { ReplyEditor } from "@/components/editor";
import { api } from "@/lib/api";

function htmlToText(html: string): string {
  const d = document.createElement("div");
  d.innerHTML = html;
  return (d.textContent || d.innerText || "").trim();
}
import { AssignModal } from "./AssignModal";
import { CategoryModal } from "./CategoryModal";
import type { TicketDetail as TicketDetailType, TicketComentario } from "@/hooks/useTicketDetail";

interface TicketDetailHookResult {
  ticket: TicketDetailType | null;
  comentarios: TicketComentario[];
  customer: any;
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

function estadoLabel(status: string, nextAction?: string | null): string {
  if (status === "new") return "Nuevo";
  if (status === "solved") return "Resuelto";
  if (status === "closed") return "Cerrado";
  if (nextAction === "advisor") return "Pendiente";
  return "Abierto";
}

function estadoBadge(status: string, nextAction?: string | null): "success" | "warning" | "danger" | "default" {
  if (status === "new") return "success";
  if (status === "solved" || status === "closed") return "default";
  if (nextAction === "advisor") return "warning";
  return "success";
}

const PRIORIDAD_BADGE: Record<string, { label: string; variant: "default" | "warning" | "danger" | "yellow" | "success" }> = {
  low:    { label: "Baja",   variant: "default" },
  normal: { label: "Normal", variant: "success" },
  high:   { label: "Alta",   variant: "warning" },
  urgent: { label: "Urgente",variant: "danger" },
};

interface Props {
  ticketId: string | null;
  ticketDetail: TicketDetailHookResult;
  onRefresh?: () => void;
}

function TimelineSimple({ ticket }: { ticket: TicketDetailType }) {
  const eventos: { time: string; label: string }[] = [];
  if (ticket.createdAt) eventos.push({ time: ticket.createdAt, label: "Ticket creado" });
  if (ticket.updatedAt && ticket.updatedAt !== ticket.createdAt) eventos.push({ time: ticket.updatedAt, label: "Última actualización" });
  if (eventos.length === 0) return null;
  return (
    <div className="shrink-0 border-t border-black-10 bg-light px-3 py-2">
      <p className="mb-1 text-[9px] font-medium uppercase tracking-wider text-black-45">Historial de la atención</p>
      <div className="space-y-1">
        {eventos.map((ev, i) => (
          <div key={i} className="flex items-center gap-2 text-[10px] text-black-45">
            <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-black-10" />
            <span>{ev.label}</span>
            <span className="ml-auto text-[9px] text-black-25">
              {new Date(ev.time).toLocaleString("es-PE", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyWorkspace() {
  return (
    <div className="flex h-full items-center justify-center text-[11px] text-black-25">
      Seleccione una conversación para empezar
    </div>
  );
}

export function WorkspaceArea({ ticketId, ticketDetail, onRefresh }: Props) {
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const [attachFiles, setAttachFiles] = useState<{ name: string; base64: string; contentType: string }[]>([]);
  const [dragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { ticket, comentarios, loading, error } = ticketDetail;

  const accion = async (endpoint: string, body?: Record<string, unknown>) => {
    if (!ticketId) return;
    setSending(true);
    try {
      const res = await api.post(`/zendesk/tickets/${ticketId}/${endpoint}`, { ...body, autor: "COPE" });
      const result = res.data as any;
      if (result?.data?.nuevoEstado && ticket) {
        ticket.ticketOriginalStatus = result.data.nuevoEstado;
      }
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(`[Workspace] Error en ${endpoint}:`, err.message);
    } finally {
      setSending(false);
      setReplyText("");
    }
  };

  const sinAsignar = ticket && !ticket.assigneeId;

  const handleReply = async () => {
    const plain = htmlToText(replyText);
    if (!ticketId || !plain) return;
    if (sinAsignar) {
      alert("Debe asignar un responsable antes de responder.");
      return;
    }
    setSending(true);
    try {
      await api.post(`/zendesk/tickets/${ticketId}/reply-resolve`, {
        body: plain,
        autor: "COPE",
        resolver: false,
        archivos: attachFiles,
      });
      setAttachFiles([]);
      setReplyText("");
      if (onRefresh) onRefresh();
    } catch (err: any) {
      console.error(`[Workspace] Error al enviar:`, err.message);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = async () => {
    if (!ticketId) return;
    if (ticket?.ticketOriginalStatus === "solved" || ticket?.ticketOriginalStatus === "closed") {
      alert("Este ticket ya se encuentra resuelto.");
      return;
    }
    if (sinAsignar) {
      alert("Debe asignar un responsable antes de resolver.");
      return;
    }
    if (!ticket?.tags?.[0]) {
      alert("Falta categorizar el ticket antes de resolverlo.");
      return;
    }
    if (!window.confirm("¿Marcar este ticket como resuelto?")) return;
    setSending(true);
    try {
      const plain = htmlToText(replyText);
      if (plain) {
        await api.post(`/zendesk/tickets/${ticketId}/reply-resolve`, {
          body: plain,
          autor: "COPE",
          resolver: false,
          archivos: attachFiles,
        });
        setAttachFiles([]);
        setReplyText("");
      }
      const res = await api.post(`/zendesk/tickets/${ticketId}/status`, { status: "solved", autor: "COPE" });
      const newStatus = res.data?.data?.nuevoEstado;
      if (newStatus !== "solved") {
        throw new Error(`Zendesk respondió con estado "${newStatus}" en lugar de "solved"`);
      }
      if (ticket) ticket.ticketOriginalStatus = "solved";
      if (onRefresh) onRefresh();
    } catch (err: any) {
      const zdError = err?.response?.data?.detail ?? err?.response?.data?.error ?? err.message ?? "Error desconocido";
      alert(`No fue posible resolver el ticket.\n${zdError}`);
      console.error(`[Workspace] Error al resolver #${ticketId}:`, zdError);
    } finally {
      setSending(false);
    }
  };

  const addFiles = (files: FileList | File[]) => {
    const nuevos = Array.from(files).map((f) => ({
      name: f.name,
      base64: "",
      contentType: f.type,
      file: f,
    }));
    nuevos.forEach((item) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1];
        setAttachFiles((prev) => [...prev.filter((x) => x.name !== item.name), { name: item.name, base64, contentType: item.contentType }]);
      };
      reader.readAsDataURL(item.file);
    });
  };

  if (!ticketId) return <EmptyWorkspace />;
  if (loading) return <ConversationSkeleton />;
  if (error || !ticket) {
    return <div className="flex h-full items-center justify-center text-[11px] text-black-25">{error ?? "Ticket no disponible"}</div>;
  }

  const eLabel = estadoLabel(ticket.ticketOriginalStatus);
  const eVariant = estadoBadge(ticket.ticketOriginalStatus);
  const p = PRIORIDAD_BADGE[ticket.prioridad] ?? { label: ticket.prioridad ?? "—", variant: "default" as const };

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 border-b border-black-10 bg-white px-3 py-2">
        <div className="flex items-center gap-1.5">
          <Badge variant={eVariant}>{eLabel}</Badge>
          <Badge variant={p.variant}>{p.label}</Badge>
          <Badge variant="correo">Correo</Badge>
          <span className="ml-auto font-mono text-[9px] text-black-45">#{ticket.ticketOriginalId}</span>
        </div>
        <h2 className="mt-1 text-[13px] font-semibold text-black-85 leading-snug">{ticket.asunto}</h2>
        <div className="mt-1 flex items-center gap-2 text-[10px] text-black-45">
          <span className="font-medium text-black-85">{ticket.clienteNombre}</span>
          {ticket.clienteEmail && <span className="text-black-25">· {ticket.clienteEmail}</span>}
        </div>
      </div>

      <ConversationPanel comentarios={comentarios} loading={loading} />
      <TimelineSimple ticket={ticket} />

      <div className="shrink-0 border-t border-black-10 bg-white p-2">
        {sinAsignar && (
          <div className="mb-2 flex items-center gap-1.5 rounded bg-warning-5 px-2 py-1.5 text-[10px] text-warning-65">
            Ticket sin responsable. Use <strong>Asignar</strong> antes de responder.
          </div>
        )}
        {dragOver && (
          <div className="mb-2 rounded border-2 border-dashed border-primary bg-primary-5 py-3 text-center text-[10px] text-primary">
            Suelte aquí los archivos para adjuntarlos
          </div>
        )}
        {attachFiles.length > 0 && (
          <div className="mb-2 space-y-1">
            {attachFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-1.5 rounded bg-light px-2 py-1 text-[10px] text-black-45">
                <span className="flex-1 truncate">{f.name}</span>
                <button type="button" onClick={() => setAttachFiles(attachFiles.filter((_, j) => j !== i))} className="text-black-25 hover:text-danger">x</button>
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-1.5">
          <div className="flex-1">
            <ReplyEditor
              value={replyText}
              onChange={setReplyText}
              onSend={handleReply}
              placeholder={sending ? "Enviando..." : "Escriba su respuesta..."}
              disabled={sending}
              minHeight={36}
              maxHeight={200}
            />
          </div>
          <div className="flex shrink-0 flex-col gap-1 pt-[5px]">
            <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }} />
            <button type="button" onClick={() => fileInputRef.current?.click()}
              className="rounded border border-black-10 px-2 py-1.5 text-[10px] text-black-45 hover:bg-light">Adj</button>
            <button type="button" onClick={handleReply}
              disabled={!htmlToText(replyText) || sending}
              className="rounded bg-primary px-2.5 py-1.5 text-[10px] font-medium text-white hover:bg-primary-85 disabled:opacity-40">
              {sending ? "..." : "Enviar"}
            </button>
          </div>
        </div>
        <div className="mt-1 flex flex-wrap gap-1.5">
          <button type="button" onClick={() => { const texto = window.prompt("Escriba la nota interna:"); if (texto && texto.trim()) accion("internal-note", { body: texto.trim() }); }}
            disabled={sending}
            className="rounded border border-black-10 px-1.5 py-0.5 text-[9px] text-black-45 hover:bg-light disabled:opacity-40">
            + Nota interna
          </button>
          <button type="button" onClick={() => setAssignOpen(true)}
            disabled={sending}
            className="rounded border border-black-10 px-1.5 py-0.5 text-[9px] text-black-45 hover:bg-light disabled:opacity-40">
            Asignar
          </button>
          <AssignModal open={assignOpen} onClose={() => setAssignOpen(false)}
            onAssign={(agentId) => accion("assign", { assigneeId: agentId })} />
          <button type="button" onClick={() => setCategoryOpen(true)}
            disabled={sending}
            className="rounded border border-black-10 px-1.5 py-0.5 text-[9px] text-black-45 hover:bg-light disabled:opacity-40">
            Categorizar
          </button>
          <CategoryModal open={categoryOpen} onClose={() => setCategoryOpen(false)}
            onSave={(c, s) => { setCategoryOpen(false); accion("categorize", { categoria: c, subcategoria: s }); }}
            currentSubcategory={ticket?.tags?.[0]} />
          <button type="button" onClick={handleResolve}
            disabled={sending || ticket?.ticketOriginalStatus === "solved" || ticket?.ticketOriginalStatus === "closed"}
            className={cn(
              "rounded border px-1.5 py-0.5 text-[9px] disabled:opacity-40",
              ticket?.ticketOriginalStatus === "solved" || ticket?.ticketOriginalStatus === "closed"
                ? "border-black-10 text-black-25"
                : "border-black-10 text-black-45 hover:bg-light",
            )}>
            {ticket?.ticketOriginalStatus === "solved" ? "Resuelto" : ticket?.ticketOriginalStatus === "closed" ? "Cerrado" : "Resolver"}
          </button>
        </div>
      </div>

    </div>
  );
}
