import { useState, useEffect, useRef, useMemo } from "react";
import { Search, Clock, Star, ArrowRight, Command } from "lucide-react";
import { MOCK_RESULTADOS, MOCK_RECIENTES, MOCK_FAVORITOS, GRUPOS, type SearchResult } from "./buscador-mock";
import { cn } from "@/lib/utils";

interface Props {
  open: boolean;
  onClose: () => void;
}

const ACCIONES_RAPIDAS = [
  { icon: "👤", label: "Abrir Cliente", shortcut: "⌘C" },
  { icon: "🎫", label: "Abrir Ticket", shortcut: "⌘T" },
  { icon: "🌐", label: "Copiar Dominio", shortcut: "⌘D" },
  { icon: "📘", label: "Abrir NotebookLM", shortcut: "⌘N" },
  { icon: "🐛", label: "Abrir DEV", shortcut: "⌘E" },
];

export function BuscadorUniversal({ open, onClose }: Props) {
  const [query, setQuery] = useState("");
  const [selectedIdx, setSelectedIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showRecentes, setShowRecentes] = useState(true);

  const agrupados = useMemo(() => {
    if (!query.trim()) return null;
    const q = query.toLowerCase();
    const filtrados = MOCK_RESULTADOS.filter(
      (r) =>
        r.nombre.toLowerCase().includes(q) ||
        r.descripcion.toLowerCase().includes(q),
    );
    const grupos: Record<string, SearchResult[]> = {};
    for (const g of GRUPOS) {
      const items = filtrados.filter((r) => r.tipo === g);
      if (items.length) grupos[g] = items;
    }
    return grupos;
  }, [query]);

  const flatResults = useMemo(() => {
    if (!agrupados) return [];
    return Object.values(agrupados).flat();
  }, [agrupados]);

  useEffect(() => {
    if (open) {
      setQuery("");
      setSelectedIdx(0);
      setShowRecentes(true);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelectedIdx(0);
    setShowRecentes(false);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (open) onClose();
      }
      if (!open) return;
      if (e.key === "Escape") { onClose(); return; }
      if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx((i) => Math.min(i + 1, flatResults.length - 1)); }
      if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx((i) => Math.max(i - 1, 0)); }
      if (e.key === "Enter" && flatResults[selectedIdx]) {
        alert(`Acción: ${flatResults[selectedIdx].accion} — ${flatResults[selectedIdx].nombre}`);
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, flatResults, selectedIdx, onClose]);

  if (!open) return null;

  const mostrarRecientes = showRecentes && !query.trim();

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 pt-[12vh]" onClick={onClose}>
      <div
        className="w-full max-w-2xl overflow-hidden rounded-2xl border border-black-10 bg-white "
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 border-b border-black-10 px-5 py-4">
          <Search size={18} className="text-black-25" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar clientes, tickets, dominios, DEV..."
            className="flex-1 text-base text-black-85 outline-none placeholder:text-black-25"
          />
          <kbd className="hidden rounded-md border border-black-10 bg-light px-1.5 py-0.5 text-[10px] text-black-25 sm:inline-flex items-center gap-0.5">
            <Command size={10} />K
          </kbd>
        </div>

        {/* Quick actions */}
        {mostrarRecientes && (
          <div className="border-b border-black-10 px-4 py-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-black-25">Acciones rápidas</p>
            <div className="flex flex-wrap gap-2">
              {ACCIONES_RAPIDAS.map((a) => (
                <button
                  key={a.label}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-black-10 bg-light px-3 py-1.5 text-xs text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary"
                >
                  <span>{a.icon}</span>
                  <span>{a.label}</span>
                  <span className="text-[9px] text-black-10">{a.shortcut}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="max-h-[50vh] overflow-y-auto">
          {mostrarRecientes && (
            <>
              <SectionGroup title="Recientes" icon={<Clock size={12} />}>
                {MOCK_RECIENTES.map((r, i) => (
                  <ResultRow key={`rec-${i}`} result={r} selected={false} onSelect={() => {}} />
                ))}
              </SectionGroup>
              <SectionGroup title="Favoritos" icon={<Star size={12} />}>
                {MOCK_FAVORITOS.map((r, i) => (
                  <ResultRow key={`fav-${i}`} result={r} selected={false} onSelect={() => {}} />
                ))}
              </SectionGroup>
            </>
          )}

          {agrupados && Object.keys(agrupados).length === 0 && (
            <div className="flex flex-col items-center py-12 text-center">
              <Search size={32} className="text-black-10" />
              <p className="mt-2 text-sm text-black-45">Sin resultados para "{query}"</p>
              <p className="text-xs text-black-25">Pruebe con otro término</p>
            </div>
          )}

          {agrupados && Object.entries(agrupados).map(([grupo, items]) => (
            <SectionGroup key={grupo} title={grupo} count={items.length}>
              {items.map((r) => {
                const globalIdx = flatResults.indexOf(r);
                return (
                  <ResultRow
                    key={r.id}
                    result={r}
                    selected={globalIdx === selectedIdx}
                    onSelect={() => {}}
                  />
                );
              })}
            </SectionGroup>
          ))}

          {mostrarRecientes && (
            <div className="border-t border-black-10 px-5 py-2.5 text-[10px] text-black-25">
              Presiona <kbd className="mx-0.5 rounded border bg-light px-1 py-0 text-[9px]">Enter</kbd> para abrir · <kbd className="mx-0.5 rounded border bg-light px-1 py-0 text-[9px]">↑↓</kbd> para navegar · <kbd className="mx-0.5 rounded border bg-light px-1 py-0 text-[9px]">Esc</kbd> para cerrar
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SectionGroup({ title, icon, count, children }: { title: string; icon?: React.ReactNode; count?: number; children: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center gap-1.5 px-5 py-2">
        {icon && <span className="text-black-25">{icon}</span>}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-black-25">{title}</span>
        {count !== undefined && <span className="text-[9px] text-black-10">({count})</span>}
      </div>
      {children}
    </div>
  );
}

function ResultRow({ result, selected, onSelect }: { result: SearchResult; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors",
        selected ? "bg-primary-10" : "hover:bg-light",
      )}
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-black-5 text-sm">
        {result.icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-black-85">{result.nombre}</p>
        <p className="truncate text-xs text-black-45">{result.descripcion}</p>
      </div>
      <div className="hidden shrink-0 items-center gap-2 sm:flex">
        <span className="text-[10px] text-black-25">{result.ultimaActualizacion}</span>
        <ArrowRight size={14} className={cn("text-black-25", selected && "text-primary")} />
      </div>
    </button>
  );
}
