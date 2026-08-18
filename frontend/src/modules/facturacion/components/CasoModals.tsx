import { useState } from "react";
import { X } from "lucide-react";
import type { FacturacionCaso, CategoriaItem, SubcategoriaItem } from "@/modules/facturacion";
import { cn } from "@/lib/utils";

function ModalShell({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-[400px] max-w-full rounded-lg border border-black-10 bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-black-10 px-4 py-3">
          <h3 className="text-sm font-semibold text-black-85">{titulo}</h3>
          <button type="button" onClick={onClose} className="text-black-45 hover:text-black-65"><X size={16} /></button>
        </div>
        <div className="p-4">{children}</div>
      </div>
    </div>
  );
}

interface AsignarModalProps {
  caso: FacturacionCaso;
  asesores: string[];
  onConfirmar: (asesor: string) => Promise<void>;
  onClose: () => void;
}

export function AsignarCasoModal({ caso, asesores, onConfirmar, onClose }: AsignarModalProps) {
  const [asesor, setAsesor] = useState(caso.asesor_actual ?? "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!asesor.trim()) { setError("Selecciona un asesor."); return; }
    setCargando(true); setError(null);
    try {
      await onConfirmar(asesor.trim());
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo asignar el caso. Intenta nuevamente.");
    } finally { setCargando(false); }
  };

  return (
    <ModalShell titulo="Asignar asesor" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-[11px] text-black-45">Caso: <span className="font-medium text-black-85">{caso.dominio}</span></p>
        <div className="rounded border border-black-5 bg-light px-3 py-2 text-[10px]">
          <span className="text-black-45">Actual: </span>
          <span className="font-medium text-black-85">{caso.asesor_actual || "Sin responsable"}</span>
        </div>
        <select value={asesor} onChange={(e) => setAsesor(e.target.value)} className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
          <option value="">Seleccionar asesor…</option>
          {asesores.map((a) => <option key={a} value={a}>{a}</option>)}
        </select>
        {error && <p className="text-[10px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={cargando} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={guardar} disabled={cargando} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white disabled:opacity-50">{cargando ? "Guardando…" : "Confirmar"}</button>
        </div>
      </div>
    </ModalShell>
  );
}

interface EstadoModalProps {
  caso: FacturacionCaso;
  estadosPermitidos: string[];
  onConfirmar: (estado: string) => Promise<void>;
  onClose: () => void;
}

export function CambiarEstadoModal({ caso, estadosPermitidos, onConfirmar, onClose }: EstadoModalProps) {
  const [estado, setEstado] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    if (!estado) { setError("Selecciona un estado."); return; }
    setCargando(true); setError(null);
    try {
      await onConfirmar(estado);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo cambiar el estado. Intenta nuevamente.");
    } finally { setCargando(false); }
  };

  return (
    <ModalShell titulo="Cambiar estado" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-[11px] text-black-45">Caso: <span className="font-medium text-black-85">{caso.dominio}</span> · <span>Actual: <strong>{caso.estado_operativo}</strong></span></p>
        <div className="flex flex-wrap gap-1.5">
          {estadosPermitidos.map((e) => (
            <button key={e} type="button" onClick={() => setEstado(e)}
              className={cn("rounded px-2 py-1 text-[10px] font-medium", estado === e ? "bg-primary text-white" : "bg-black-5 text-black-45 hover:bg-black-10")}>
              {e}
            </button>
          ))}
        </div>
        {estadosPermitidos.length === 0 && <p className="text-[10px] text-black-25">No hay transiciones válidas desde este estado.</p>}
        {error && <p className="text-[10px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={cargando} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={guardar} disabled={cargando || !estado} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white disabled:opacity-50">{cargando ? "Guardando…" : "Confirmar"}</button>
        </div>
      </div>
    </ModalShell>
  );
}

interface CategoriaModalProps {
  caso: FacturacionCaso;
  categorias: CategoriaItem[];
  subcategorias: SubcategoriaItem[];
  onCategoriaChange: (categoriaId: string) => void;
  onConfirmar: (categoriaId: string | null, subcategoriaId: string | null) => Promise<void>;
  onClose: () => void;
}

export function CategorizarCasoModal({ caso, categorias, subcategorias, onCategoriaChange, onConfirmar, onClose }: CategoriaModalProps) {
  const [categoriaId, setCategoriaId] = useState(caso.categoria_id ?? "");
  const [subcategoriaId, setSubcategoriaId] = useState(caso.subcategoria_id ?? "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const guardar = async () => {
    setCargando(true); setError(null);
    try {
      await onConfirmar(categoriaId || null, subcategoriaId || null);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo categorizar el caso. Intenta nuevamente.");
    } finally { setCargando(false); }
  };

  return (
    <ModalShell titulo="Categorizar caso" onClose={onClose}>
      <div className="space-y-3">
        <div>
          <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Categoría</p>
          <select value={categoriaId} onChange={(e) => { setCategoriaId(e.target.value); setSubcategoriaId(""); onCategoriaChange(e.target.value); }}
            className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
            <option value="">Sin categoría</option>
            {categorias.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Subcategoría</p>
          <select value={subcategoriaId} onChange={(e) => setSubcategoriaId(e.target.value)}
            className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none">
            <option value="">Sin subcategoría</option>
            {subcategorias.map((s) => <option key={s.id} value={s.id}>{s.nombre}</option>)}
          </select>
        </div>
        {error && <p className="text-[10px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={cargando} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={guardar} disabled={cargando} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white disabled:opacity-50">{cargando ? "Guardando…" : "Confirmar"}</button>
        </div>
      </div>
    </ModalShell>
  );
}

interface SnapshotModalProps {
  caso: FacturacionCaso;
  onConfirmar: (facturas: number | null, boletas: number | null) => Promise<void>;
  onClose: () => void;
}

export function RegistrarSnapshotModal({ caso, onConfirmar, onClose }: SnapshotModalProps) {
  const [facturas, setFacturas] = useState(caso.ultimas_facturas != null ? String(caso.ultimas_facturas) : "");
  const [boletas, setBoletas] = useState(caso.ultimas_boletas != null ? String(caso.ultimas_boletas) : "");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const f = facturas !== "" ? Number(facturas) : 0;
  const b = boletas !== "" ? Number(boletas) : 0;
  const total = f + b;

  const guardar = async () => {
    setCargando(true); setError(null);
    try {
      await onConfirmar(f, b);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo registrar el snapshot. Intenta nuevamente.");
    } finally { setCargando(false); }
  };

  return (
    <ModalShell titulo="Registrar snapshot" onClose={onClose}>
      <div className="space-y-3">
        <p className="text-[11px] text-black-45">Caso: <span className="font-medium text-black-85">{caso.dominio}</span></p>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Facturas</p>
            <input value={facturas} onChange={(e) => setFacturas(e.target.value)} type="number" min="0" placeholder="0" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
          </div>
          <div>
            <p className="mb-1 text-[9px] uppercase tracking-wider text-black-45">Boletas</p>
            <input value={boletas} onChange={(e) => setBoletas(e.target.value)} type="number" min="0" placeholder="0" className="h-8 w-full rounded border border-black-10 px-2 text-[11px] focus:border-primary focus:outline-none" />
          </div>
        </div>
        <div className="rounded border border-black-5 bg-light px-3 py-2 text-[11px]">
          <span className="text-black-45">Total: </span><span className={cn("font-semibold", total > 0 ? "text-danger" : "text-success")}>{total}</span>
          <span className="ml-2 text-[9px] text-black-25">Origen: MANUAL</span>
        </div>
        {error && <p className="text-[10px] text-danger">{error}</p>}
        <div className="flex justify-end gap-2 pt-1">
          <button type="button" onClick={onClose} disabled={cargando} className="rounded border border-black-10 px-3 py-1 text-[10px] text-black-45 hover:bg-light disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={guardar} disabled={cargando} className="rounded bg-primary px-3 py-1 text-[10px] font-medium text-white disabled:opacity-50">{cargando ? "Guardando…" : "Guardar"}</button>
        </div>
      </div>
    </ModalShell>
  );
}
