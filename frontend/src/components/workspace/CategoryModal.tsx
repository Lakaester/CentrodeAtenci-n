import { useState, useEffect } from "react";
import { Search, X, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { CATEGORY_HIERARCHY, categoriaDesdeSubcategoria, getZendeskValue } from "./CategoryData";

interface Props {
  open: boolean;
  onClose: () => void;
  onSave: (categoria: string, subcategoria: string) => void;
  currentSubcategory?: string;
}

type Step = "categoria" | "subcategoria";

export function CategoryModal({ open, onClose, onSave, currentSubcategory }: Props) {
  const [step, setStep] = useState<Step>("categoria");
  const [categoria, setCategoria] = useState("");
  const [subcategoria, setSubcategoria] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (open) {
      const catInicial = currentSubcategory ? categoriaDesdeSubcategoria(currentSubcategory) : null;
      setCategoria(catInicial ?? "");
      setSubcategoria(currentSubcategory ?? "");
      setStep(catInicial ? "subcategoria" : "categoria");
      setSearch("");
    }
  }, [open, currentSubcategory]);

  if (!open) return null;

  const categorias = Object.keys(CATEGORY_HIERARCHY).filter((c) =>
    !search || c.toLowerCase().includes(search.toLowerCase()),
  );

  const subcategorias = categoria
    ? CATEGORY_HIERARCHY[categoria].filter((s) =>
        !search || s.label.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] bg-black/30" onClick={onClose}>
      <div className="w-full max-w-sm rounded-lg bg-white border border-black-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <h3 className="text-sm font-semibold text-black-85">
            {step === "categoria" ? "Seleccionar categoria" : "Seleccionar subcategoria"}
          </h3>
          <button type="button" onClick={onClose} className="text-black-45 hover:text-black-65"><X size={16} /></button>
        </div>

        {step === "subcategoria" && (
          <div className="flex items-center gap-1 border-b border-black-10 bg-light px-3 py-1.5 text-[10px] text-black-45">
            <button type="button" onClick={() => setStep("categoria")} className="hover:text-primary">{categoria}</button>
            <ChevronRight size={10} />
            <span className="font-medium text-black-85">{subcategoria || "Seleccionar"}</span>
          </div>
        )}

        <div className="relative border-b border-black-10 px-3 py-2">
          <Search size={13} className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-black-45" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={step === "categoria" ? "Buscar categoria..." : "Buscar subcategoria..."}
            autoFocus
            className="w-full h-9 rounded border border-black-10 bg-white py-1.5 pl-7 pr-2 text-[12px] text-black-85 placeholder:text-black-25 focus:border-primary focus:outline-none"
          />
        </div>

        <div className="max-h-52 overflow-y-auto p-1">
          {step === "categoria" ? (
            categorias.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-black-25">Sin resultados</div>
            ) : (
              categorias.map((cat) => (
                <button key={cat} type="button" onClick={() => { setCategoria(cat); setSubcategoria(""); setSearch(""); setStep("subcategoria"); }}
                  className="flex w-full items-center justify-between rounded px-3 py-2.5 text-left text-[12px] text-black-85 hover:bg-light">
                  <span>{cat}</span>
                  <ChevronRight size={12} className="text-black-45" />
                </button>
              ))
            )
          ) : (
            subcategorias.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-black-25">Sin resultados</div>
            ) : (
              subcategorias.map((sub) => (
                <button key={sub.label} type="button" onClick={() => setSubcategoria(sub.label)}
                  className={cn("flex w-full items-center rounded px-3 py-2.5 text-left text-[12px] transition-colors hover:bg-light",
                    subcategoria === sub.label ? "bg-primary-5 font-medium text-primary" : "text-black-85"
                  )}>
                  {sub.label}
                </button>
              ))
            )
          )}
        </div>

        <div className="flex gap-2 border-t border-black-10 px-3 py-2.5">
          <button type="button" onClick={() => { onSave(categoria, getZendeskValue(subcategoria)); onClose(); }}
            disabled={!subcategoria}
            className="flex-1 rounded bg-primary py-1.5 text-[11px] font-medium text-white hover:bg-primary-85 disabled:opacity-40">
            Guardar
          </button>
          <button type="button" onClick={onClose}
            className="rounded border border-black-10 px-3 py-1.5 text-[11px] text-black-45 hover:bg-light">
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
