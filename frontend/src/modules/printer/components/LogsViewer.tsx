import { useState } from "react";
import { Copy } from "lucide-react";
import type { PrinterLog } from "../types/PrinterLog";

const TIPOS = ["controlado", "nocontrolado"] as const;
const LINEAS = [100, 500, 1000, 5000, 10000];

interface Props {
  logs: PrinterLog | null;
  loading: boolean;
  dominio: string;
  onConsultar: (dominio: string, lineas: number, tipo: string) => void;
}

export function LogsViewer({ logs, loading, dominio, onConsultar }: Props) {
  const [tipo, setTipo] = useState<string>("controlado");
  const [lineas, setLineas] = useState(100);

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-end gap-4">
        <div>
          <label className="mb-1 block text-[11px] font-medium text-black-45">Tipo</label>
          <select value={tipo} onChange={(e) => setTipo(e.target.value)}
            className="rounded-md border border-black-10 px-2 py-1.5 text-[12px] text-black-85">
            {TIPOS.map((t) => <option key={t} value={t}>{t === "controlado" ? "Controlado" : "No controlado"}</option>)}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[11px] font-medium text-black-45">Líneas</label>
          <select value={lineas} onChange={(e) => setLineas(Number(e.target.value))}
            className="rounded-md border border-black-10 px-2 py-1.5 text-[12px] text-black-85">
            {LINEAS.map((n) => <option key={n} value={n}>{n.toLocaleString()}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => onConsultar(dominio, lineas, tipo)} disabled={loading}
          className="rounded-md bg-primary px-4 py-1.5 text-[12px] font-medium text-white hover:bg-primary-85 disabled:opacity-40">
          {loading ? "Consultando..." : "Consultar"}
        </button>
      </div>

      {loading && <div className="rounded-md bg-light p-4 text-[12px] text-black-45">Cargando logs...</div>}

      {logs && !loading && (
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-[11px] text-black-45">
            <span>Archivo: <strong className="text-black-85">{logs.nombreArchivo}</strong></span>
            <span>Tamaño: <strong className="text-black-85">{(logs.tamañoArchivo / 1024).toFixed(1)} KB</strong></span>
            <span>Líneas: <strong className="text-black-85">{logs.totalLineas.toLocaleString()}</strong></span>
            <button type="button" onClick={() => navigator.clipboard.writeText(logs.contenido)}
              className="ml-auto inline-flex items-center gap-1 rounded border border-black-10 px-2 py-1 text-[11px] text-black-45 hover:bg-black-5">
              <Copy size={12} /> Copiar
            </button>
          </div>
          <pre className="max-h-96 overflow-y-auto rounded-md bg-dark p-4 text-[11px] leading-relaxed text-[#E2E8F0] font-mono whitespace-pre-wrap">
            {logs.contenido || "(sin contenido)"}
          </pre>
        </div>
      )}
    </div>
  );
}
