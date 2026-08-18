import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  pagina: number;
  total: number;
  porPagina: number;
  onCambiar: (n: number) => void;
  etiqueta: string;
}

export function Pagination({ pagina, total, porPagina, onCambiar, etiqueta }: Props) {
  if (total === 0) return null;
  const paginas = Math.max(1, Math.ceil(total / porPagina));
  const desde = total === 0 ? 0 : (pagina - 1) * porPagina + 1;
  const hasta = Math.min(total, pagina * porPagina);

  return (
    <div className="flex items-center justify-between gap-2 px-3 py-2">
      <span className="text-[10px] text-black-45">
        {desde}–{hasta} de {total} {etiqueta}
      </span>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => onCambiar(pagina - 1)}
          disabled={pagina <= 1}
          className="inline-flex h-7 items-center rounded border border-black-10 px-2 text-[10px] text-black-65 hover:bg-light disabled:opacity-40"
          aria-label="Página anterior"
        >
          <ChevronLeft size={13} />
        </button>
        <span className="px-1.5 text-[10px] text-black-45 tabular-nums">
          {pagina} / {paginas}
        </span>
        <button
          type="button"
          onClick={() => onCambiar(pagina + 1)}
          disabled={pagina >= paginas}
          className={cn("inline-flex h-7 items-center rounded border border-black-10 px-2 text-[10px] text-black-65 hover:bg-light disabled:opacity-40")}
          aria-label="Página siguiente"
        >
          <ChevronRight size={13} />
        </button>
      </div>
    </div>
  );
}
