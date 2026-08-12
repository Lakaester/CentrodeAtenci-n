import { useState } from "react";
import { Download, X, Maximize2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  src: string;
  alt: string;
  onDownload?: () => void;
}

export function ImagePreview({ src, alt, onDownload }: Props) {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);

  return (
    <>
      <div className="group relative mt-1.5 inline-block max-w-[280px] cursor-pointer overflow-hidden rounded-lg border border-black-10">
        <div className={cn("absolute inset-0 z-10 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/30", loaded ? "" : "hidden")}>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setOpen(true); }}
            className="hidden rounded-md bg-white/90 p-1 text-black-85 group-hover:block"
            title="Ver tamaño completo"
          >
            <Maximize2 size={14} />
          </button>
          {onDownload && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDownload(); }}
              className="ml-1 hidden rounded-md bg-white/90 p-1 text-black-85 group-hover:block"
              title="Descargar"
            >
              <Download size={14} />
            </button>
          )}
        </div>
        {!loaded && (
          <div className="flex h-32 w-full items-center justify-center bg-black-5 text-[10px] text-black-25">
            Cargando imagen...
          </div>
        )}
        <img
          src={src}
          alt={alt}
          onLoad={() => setLoaded(true)}
          className={cn("max-h-48 w-auto object-contain", loaded ? "block" : "hidden")}
        />
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
          onClick={() => setOpen(false)}
        >
          <div className="relative max-h-[90vh] max-w-[90vw]">
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute -right-3 -top-3 z-10 rounded-full bg-white p-1 "
            >
              <X size={16} />
            </button>
            <img src={src} alt={alt} className="max-h-[90vh] max-w-[90vw] rounded-lg object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
