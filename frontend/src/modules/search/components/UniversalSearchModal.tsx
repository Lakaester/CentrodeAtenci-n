import { useEffect, useRef } from "react";
import { Search, X, Clock, Globe, Mail, Phone, Hash, FileText } from "lucide-react";
import { useUniversalSearch } from "../hooks/useUniversalSearch";

interface Props {
  open: boolean;
  onClose: () => void;
  onSelect: (result: any) => void;
}

const TYPE_ICON: Record<string, typeof Globe> = {
  domain: Globe, email: Mail, phone: Phone,
  ticket: Hash, ruc: Hash, local_id: FileText, device_id: FileText,
};

export function UniversalSearchModal({ open, onClose, onSelect }: Props) {
  const { query, setQuery, results, detectedType, loading, recent, addRecent } = useUniversalSearch();
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); onClose(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] bg-black/30" onClick={onClose}>
      <div className="w-full max-w-lg rounded-xl bg-white " onClick={(e) => e.stopPropagation()}>
        <div className="relative flex items-center border-b border-black-10 px-3 py-2">
          <Search size={15} className="shrink-0 text-black-25" />
          <input ref={inputRef} type="text" value={query} onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por dominio, correo, teléfono, RUC, ticket..."
            className="ml-2 flex-1 border-0 text-[13px] text-black-85 placeholder:text-black-25 focus:outline-none"
          />
          {query && <button type="button" onClick={() => setQuery("")} className="text-black-25 hover:text-black-45"><X size={14} /></button>}
          <kbd className="ml-2 rounded border border-black-10 px-1.5 py-0.5 text-[9px] text-black-25">ESC</kbd>
        </div>

        {loading && <div className="px-4 py-3 text-[11px] text-black-25">Buscando...</div>}

        {!query && recent.length > 0 && (
          <div className="px-3 py-2">
            <p className="mb-1 text-[9px] uppercase tracking-wide text-black-25">Recientes</p>
            {recent.map((r) => (
              <button key={r} type="button" onClick={() => setQuery(r)}
                className="flex w-full items-center gap-2 rounded px-2 py-1.5 text-[11px] text-black-45 hover:bg-light">
                <Clock size={12} /> {r}
              </button>
            ))}
          </div>
        )}

        {results.length > 0 && (
          <div className="max-h-64 overflow-y-auto px-1 py-1">
            <p className="px-2 py-1 text-[9px] uppercase tracking-wide text-black-25">
              {results.length} resultado(s) — {detectedType}
            </p>
            {results.map((r) => {
              const Icon = TYPE_ICON[r.type] ?? Search;
              return (
                <button key={r.id} type="button" onClick={() => { addRecent(query); onSelect(r); }}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-light transition-colors">
                  <Icon size={14} className="shrink-0 text-primary" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[12px] font-medium text-black-85">{r.label}</p>
                    <p className="truncate text-[10px] text-black-45">{r.description}</p>
                  </div>
                  <span className="shrink-0 text-[9px] text-black-25">{r.source}</span>
                </button>
              );
            })}
          </div>
        )}

        {query && !loading && results.length === 0 && (
          <div className="px-4 py-6 text-center text-[11px] text-black-25">Sin resultados</div>
        )}
      </div>
    </div>
  );
}
