import { useState, memo } from "react";
import { FileText, FileSpreadsheet, FileImage, FileArchive, FileAudio, FileVideo, File, Download, ExternalLink, FileCode, X, Maximize2, ZoomIn, Minimize2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Attachment {
  id: string;
  nombre: string;
  url: string;
  content_type?: string;
  size?: number;
}

const EXT_MAP: Record<string, { label: string; icon: typeof File; color: string }> = {
  pdf:  { label: "PDF",  icon: FileText,       color: "text-red-600 bg-danger-5" },
  xls:  { label: "Excel",icon: FileSpreadsheet, color: "text-success bg-success-5" },
  xlsx: { label: "Excel",icon: FileSpreadsheet, color: "text-success bg-success-5" },
  doc:  { label: "Word", icon: FileText,        color: "text-primary bg-primary-5" },
  docx: { label: "Word", icon: FileText,        color: "text-primary bg-primary-5" },
  ppt:  { label: "PPT",  icon: FileImage,       color: "text-warning bg-orange-50" },
  pptx: { label: "PPT",  icon: FileImage,       color: "text-warning bg-orange-50" },
  zip:  { label: "ZIP",  icon: FileArchive,     color: "text-warning bg-warning-5" },
  rar:  { label: "RAR",  icon: FileArchive,     color: "text-warning bg-warning-5" },
  csv:  { label: "CSV",  icon: FileSpreadsheet, color: "text-success bg-success-5" },
  mp3:  { label: "Audio",icon: FileAudio,       color: "text-purple bg-purple-5" },
  wav:  { label: "Audio",icon: FileAudio,       color: "text-purple bg-purple-5" },
  mp4:  { label: "Video",icon: FileVideo,       color: "text-pink-600 bg-pink-50" },
  mov:  { label: "Video",icon: FileVideo,       color: "text-pink-600 bg-pink-50" },
  txt:  { label: "Texto", icon: FileText,       color: "text-black-65 bg-black-5" },
  js:   { label: "JS",    icon: FileCode,       color: "text-yellow-600 bg-yellow-5" },
  ts:   { label: "TS",    icon: FileCode,       color: "text-primary bg-primary-5" },
  json: { label: "JSON",  icon: FileCode,       color: "text-gray-600 bg-gray-50" },
  xml:  { label: "XML",   icon: FileCode,       color: "text-gray-600 bg-gray-50" },
  html: { label: "HTML",  icon: FileCode,       color: "text-warning bg-orange-50" },
  css:  { label: "CSS",   icon: FileCode,       color: "text-primary bg-primary-5" },
};

function detectarTipo(nombre: string) {
  const ext = nombre.split(".").pop()?.toLowerCase() ?? "";
  return EXT_MAP[ext] ?? { label: "Archivo", icon: File, color: "text-black-65 bg-black-5" };
}

function formatSize(bytes?: number): string {
  if (!bytes || bytes <= 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
}

function esImagen(adj: Attachment): boolean {
  if (adj.content_type?.startsWith("image/")) return true;
  const ext = adj.nombre.split(".").pop()?.toLowerCase();
  return ["jpg", "jpeg", "png", "webp", "gif", "bmp"].includes(ext ?? "");
}

function ImageThumb({ adj }: { adj: Attachment }) {
  const [open, setOpen] = useState(false);
  const [zoom, setZoom] = useState(false);

  return (
    <>
      <div className="group relative mt-1 inline-block max-w-[240px] cursor-pointer overflow-hidden rounded-lg border border-black-10">
        <img
          src={adj.url}
          alt={adj.nombre}
          className="max-h-36 w-auto object-contain"
          onClick={() => setOpen(true)}
        />
        <div className="absolute inset-0 flex items-center justify-center gap-1 bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
          <button type="button" onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="rounded-md bg-white/90 p-1 text-black-85 hover:bg-white" title="Ver">
            <Maximize2 size={14} />
          </button>
          <a href={adj.url} download={adj.nombre}
            className="rounded-md bg-white/90 p-1 text-black-85 hover:bg-white" title="Descargar">
            <Download size={14} />
          </a>
          <a href={adj.url} target="_blank" rel="noopener noreferrer"
            className="rounded-md bg-white/90 p-1 text-black-85 hover:bg-white" title="Abrir original">
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => !zoom && setOpen(false)}>
          <div className="relative max-h-[92vh] max-w-[92vw]">
            <div className="absolute -right-3 -top-3 z-10 flex gap-1">
              <button type="button" onClick={() => setZoom(!zoom)}
                className="rounded-full bg-white p-1.5  hover:bg-black-5" title={zoom ? "Reducir" : "Zoom"}>
                {zoom ? <Minimize2 size={14} /> : <ZoomIn size={14} />}
              </button>
              <a href={adj.url} download={adj.nombre}
                className="rounded-full bg-white p-1.5  hover:bg-black-5" title="Descargar">
                <Download size={14} />
              </a>
              <a href={adj.url} target="_blank" rel="noopener noreferrer"
                className="rounded-full bg-white p-1.5  hover:bg-black-5" title="Abrir original">
                <ExternalLink size={14} />
              </a>
              <button type="button" onClick={() => setOpen(false)}
                className="rounded-full bg-white p-1.5  hover:bg-black-5" title="Cerrar">
                <X size={14} />
              </button>
            </div>
            <img
              src={adj.url}
              alt={adj.nombre}
              className={cn(
                "max-h-[90vh] max-w-[90vw] rounded-lg object-contain transition-transform",
                zoom ? "scale-150 cursor-zoom-out" : "cursor-zoom-in",
              )}
              onClick={() => setZoom(!zoom)}
            />
          </div>
        </div>
      )}
    </>
  );
}

function FileCard({ adj, esAgente }: { adj: Attachment; esAgente: boolean }) {
  const tipo = detectarTipo(adj.nombre);
  const Icon = tipo.icon;
  return (
    <div className={cn("flex items-center gap-2 rounded-lg border p-2", esAgente ? "border-white/20 bg-white/10" : "border-black-10 bg-white")}>
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-md", tipo.color)}>
        <Icon size={14} />
      </div>
      <div className="min-w-0 flex-1">
        <p className={cn("truncate text-[11px] font-medium", esAgente ? "text-white" : "text-black-85")}>{adj.nombre}</p>
        <p className={cn("text-[9px]", esAgente ? "text-white/60" : "text-black-25")}>
          {tipo.label}{adj.size ? ` · ${formatSize(adj.size)}` : ""}
        </p>
      </div>
      <div className="flex shrink-0 gap-1">
        <a href={adj.url} target="_blank" rel="noopener noreferrer"
          className={cn("flex h-7 w-7 items-center justify-center rounded", esAgente ? "text-white/70 hover:bg-white/15 hover:text-white" : "text-black-45 hover:bg-black-5")} title="Abrir">
          <ExternalLink size={12} />
        </a>
        <a href={adj.url} download={adj.nombre}
          className={cn("flex h-7 w-7 items-center justify-center rounded", esAgente ? "text-white/70 hover:bg-white/15 hover:text-white" : "text-black-45 hover:bg-black-5")} title="Descargar">
          <Download size={12} />
        </a>
      </div>
    </div>
  );
}

interface Props {
  adjunto: Attachment;
  esAgente: boolean;
}

export const AttachmentRenderer = memo(function AttachmentRenderer({ adjunto, esAgente }: Props) {
  if (esImagen(adjunto)) {
    return <ImageThumb adj={adjunto} />;
  }
  return <FileCard adj={adjunto} esAgente={esAgente} />;
});
