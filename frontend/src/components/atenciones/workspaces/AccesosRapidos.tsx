import { ExternalLink } from "lucide-react";

const MAP_ACCESOS: Record<string, string[]> = {
  "Facturación Electrónica": ["Abrir Restafact", "Abrir Dashboard FE", "Abrir SUNAT", "Abrir NotebookLM FE", "Macros FE"],
  Logística: ["Abrir Dashboard Logística", "Abrir Inventarios", "Abrir NotebookLM"],
  Integraciones: ["Abrir Monitor", "Abrir Carta", "Abrir Productos", "Abrir Dashboard", "Abrir NotebookLM"],
  Software: ["Abrir Configuración", "Abrir Actualizaciones", "Abrir NotebookLM"],
  Capacitación: ["Abrir Cursos", "Abrir Videos", "Abrir Manual", "Abrir NotebookLM"],
  Gestión: ["Abrir Trámite", "Abrir Dashboard", "Abrir NotebookLM"],
  Administrativo: ["Abrir Pagos", "Abrir Contratos", "Abrir Dashboard"],
};

export function AccesosRapidos({ categoria }: { categoria: string }) {
  const items = MAP_ACCESOS[categoria] ?? ["Abrir NotebookLM"];
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((a) => (
        <button
          key={a}
          className="inline-flex items-center gap-1 rounded-md border border-black-10 bg-white px-2 py-1 text-[9px] text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary"
        >
          <ExternalLink size={8} />
          {a}
        </button>
      ))}
    </div>
  );
}
