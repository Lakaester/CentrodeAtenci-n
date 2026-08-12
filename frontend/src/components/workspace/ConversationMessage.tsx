import { useState, memo } from "react";
import { Bot, Info, User, ChevronDown, ChevronRight, EyeOff, Eye } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TicketComentario, ContentBlock } from "@/hooks/useTicketDetail";
import { ImagePreview } from "@/components/message/ImagePreview";
import { AttachmentRenderer } from "@/components/message/AttachmentRenderer";
import { HtmlRenderer } from "@/components/message/HtmlRenderer";

type TipoAutor = "cliente" | "asesor" | "nota_interna" | "bot" | "sistema";

function determinarTipo(msg: TicketComentario): TipoAutor {
  const map: Record<string, TipoAutor> = { bot: "bot", sistema: "sistema", agente: "asesor", nota_interna: "nota_interna", cliente: "cliente" };
  return map[msg.tipo] ?? "cliente";
}

const AVATAR: Record<TipoAutor, React.ReactNode> = {
  cliente: <User size={12} />,
  asesor: <User size={12} />,
  nota_interna: <User size={12} />,
  bot: <Bot size={12} />,
  sistema: <Info size={12} />,
};

const AVATAR_BG: Record<TipoAutor, string> = {
  cliente: "bg-black-5 text-black-45",
  asesor: "bg-primary-10 text-primary",
  nota_interna: "bg-warning-10 text-warning",
  bot: "bg-purple-10 text-purple",
  sistema: "bg-light text-black-25",
};

const BALLOON_STYLE: Record<TipoAutor, { align: string; balloon: string; text: string; time: string; label: string }> = {
  cliente: { align: "", balloon: "bg-black-5 text-black-85 rounded-bl-sm", text: "text-black-45", time: "text-black-25", label: "Cliente" },
  asesor: { align: "flex-row-reverse", balloon: "bg-primary text-white rounded-br-sm", text: "text-white/80", time: "text-white/50", label: "Asesor" },
  nota_interna: { align: "", balloon: "bg-warning-5 text-black-85 border border-warning-25 rounded", text: "text-warning-65", time: "text-black-25", label: "Nota Interna" },
  bot: { align: "", balloon: "bg-purple-5 text-black-85 border border-purple-25 rounded-bl-sm", text: "text-purple", time: "text-black-25", label: "Bot" },
  sistema: { align: "justify-center", balloon: "bg-light text-black-45 text-center text-[11px] mx-auto max-w-[90%] rounded-lg", text: "text-black-25", time: "text-black-25", label: "Sistema" },
};

function BloquesRenderer({ bloques, esAsesor }: { bloques: ContentBlock[]; esAsesor: boolean }) {
  return (
    <>
      {bloques.map((block, i) => {
        switch (block.type) {
          case "text":
            return <p key={i} className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{block.content}</p>;
          case "image":
            return <ImagePreview key={i} src={block.url} alt={block.alt} onDownload={() => { const a = document.createElement("a"); a.href = block.url; a.download = block.alt; a.click(); }} />;
          case "link":
            return (
              <a key={i} href={block.url} target="_blank" rel="noopener noreferrer"
                className={cn("inline-flex items-center gap-1 text-[13px] underline", esAsesor ? "text-white/80 hover:text-white" : "text-primary hover:text-primary-85")}>
                {block.text}
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
              </a>
            );
          case "code":
            return (
              <pre key={i} className={cn("mt-1 overflow-x-auto rounded p-2 text-[11px] leading-relaxed", esAsesor ? "bg-white/10 text-white/80" : "bg-light text-black-85")}>
                <code>{block.content}</code>
              </pre>
            );
          case "signature": return <CollapsibleBlock key={i} block={block} icon="F" label="Firma del remitente" esAsesor={esAsesor} />;
          case "disclaimer": return <CollapsibleBlock key={i} block={block} icon={<EyeOff size={10} />} label="Aviso legal oculto" esAsesor={esAsesor} />;
          case "history": return <CollapsibleBlock key={i} block={block} icon="H" label={`Historial del correo (${(block as any).lineas ?? "?"} líneas)`} esAsesor={esAsesor} />;
          default: return null;
        }
      })}
    </>
  );
}

function CollapsibleBlock({ block, icon, label, esAsesor }: { block: ContentBlock & { content: string }; icon: React.ReactNode; label: string; esAsesor: boolean }) {
  const [open, setOpen] = useState(false);
  const baseMuted = esAsesor ? "text-white/60" : "text-black-25";
  const baseBg = esAsesor ? "bg-white/10" : "bg-light";
  const borderCls = esAsesor ? "border-white/20" : "border-black-10";
  return (
    <div className={cn("mt-2 rounded border px-2.5 py-1.5", borderCls, baseBg)}>
      <button type="button" onClick={() => setOpen(!open)} className="flex w-full items-center gap-1.5 text-[10px]">
        <span>{typeof icon === "string" ? icon : icon}</span>
        <span className={cn("font-medium", esAsesor ? "text-white" : "text-black-85")}>{label}</span>
        {open ? <ChevronDown size={10} className={baseMuted} /> : <ChevronRight size={10} className={baseMuted} />}
      </button>
      {open && <pre className={cn("mt-1 whitespace-pre-wrap text-[11px] leading-relaxed", baseMuted)}>{block.content}</pre>}
    </div>
  );
}

export const ConversationMessage = memo(function ConversationMessage({ msg }: { msg: TicketComentario }) {
  const tipo = determinarTipo(msg);
  const style = BALLOON_STYLE[tipo];
  const [verHtml, setVerHtml] = useState(true);
  const tieneHtml = !!msg.html;

  if (tipo === "sistema") {
    return (
      <div className={cn("flex", style.align)}>
        <div className={cn("px-3 py-1.5", style.balloon)}>
          <p className="text-[11px]">{msg.contenido}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-2.5", style.align)}>
      <div className={cn("flex h-7 w-7 shrink-0 items-center justify-center rounded-full", AVATAR_BG[tipo])}>
        {AVATAR[tipo]}
      </div>
      <div className={cn("max-w-[72%] flex-1 rounded-lg px-3 py-2 text-[14px] leading-relaxed", style.balloon)}>
        <div className="mb-1 flex items-center gap-2">
          <span className={cn("text-[11px] font-medium", style.text)}>
            {tipo === "nota_interna" ? "NOTA INTERNA" : msg.emisor}
          </span>
          <span className={cn("text-[10px]", style.time)}>
            {msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}
          </span>
          {tieneHtml && (
            <button
              type="button"
              onClick={() => setVerHtml(!verHtml)}
              className={cn("ml-auto flex items-center gap-1 rounded px-1 py-0.5 text-[9px]", verHtml ? "bg-primary-10 text-primary" : "text-black-25 hover:text-black-45")}
              title={verHtml ? "Ver texto plano" : "Ver HTML"}
            >
              {verHtml ? <Eye size={10} /> : <EyeOff size={10} />}
              {verHtml ? "HTML" : "Texto"}
            </button>
          )}
          <span className={cn("text-[9px]", style.time)}>{style.label}</span>
        </div>

        {tieneHtml && verHtml ? (
          <HtmlRenderer html={msg.html!} />
        ) : msg.bloques && msg.bloques.length > 0 ? (
          <BloquesRenderer bloques={msg.bloques} esAsesor={tipo === "asesor"} />
        ) : (
          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{msg.contenido}</p>
        )}

        {msg.adjuntos && msg.adjuntos.length > 0 && (
          <div className="mt-2 space-y-1">
            {msg.adjuntos.map((adj) => (
              <AttachmentRenderer key={adj.id} adjunto={adj} esAgente={tipo === "asesor"} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
});
