import { useState } from "react";
import { Pencil, Check, X, Loader2, Tag, Star, Link2 } from "lucide-react";
import type { AtencionOperativa } from "@/hooks/useTicketDetail";
import {
  registrarClasificacion,
  registrarCalificacion,
} from "@/modules/atenciones/services/atencionesOperativaService";

interface Props {
  operativa: AtencionOperativa | null;
  ticketId: string | null;
  onRefrescar?: () => void;
}

const CATEGORIAS = [
  "INTEGRACIONES",
  "SOFTWARE",
  "FACTURACION",
  "SOPORTE",
  "GESTION",
  "QUEJA",
  "DEVOLUCION",
  "OTRO",
];

const CALIFICACIONES = ["1", "2", "3", "4", "5"];

const TIPO_IDENTIFICACION_LABEL: Record<string, string> = {
  AUTO: "Automática",
  MANUAL: "Manual",
  ZENDESK_EXPLICITO: "Zendesk",
  HISTORIAL: "Historial del contacto",
  SIN_IDENTIFICAR: "Sin identificar",
};

const ORIGEN_LABEL: Record<string, string> = {
  cope: "COPE",
  zendesk: "Zendesk",
};

export function RegistroOperativo({ operativa, ticketId, onRefrescar }: Props) {
  const [editandoClasificacion, setEditandoClasificacion] = useState(false);
  const [editandoCalificacion, setEditandoCalificacion] = useState(false);
  const [categoriaSel, setCategoriaSel] = useState("");
  const [subcategoriaSel, setSubcategoriaSel] = useState("");
  const [calificacionSel, setCalificacionSel] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const atencion = operativa?.atencion;
  const auditoria = operativa?.auditoria ?? [];

  const iniciarEdicionClasificacion = () => {
    setCategoriaSel(atencion?.categoria ?? "");
    setSubcategoriaSel(atencion?.subcategoria ?? "");
    setEditandoClasificacion(true);
    setError(null);
  };

  const iniciarEdicionCalificacion = () => {
    setCalificacionSel(atencion?.calificacion ?? "");
    setEditandoCalificacion(true);
    setError(null);
  };

  const guardarClasificacion = async () => {
    if (!ticketId || !categoriaSel.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      await registrarClasificacion(ticketId, {
        categoria: categoriaSel.trim(),
        subcategoria: subcategoriaSel.trim() || null,
      });
      setEditandoClasificacion(false);
      onRefrescar?.();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo guardar la clasificación.");
    } finally {
      setGuardando(false);
    }
  };

  const guardarCalificacion = async () => {
    if (!ticketId || !calificacionSel) return;
    setGuardando(true);
    setError(null);
    try {
      await registrarCalificacion(ticketId, { calificacion: calificacionSel });
      setEditandoCalificacion(false);
      onRefrescar?.();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo guardar la calificación.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="mb-3 space-y-2 rounded border border-black-5 bg-white p-2">
      <p className="text-[9px] font-semibold uppercase tracking-wider text-black-45">
        Registro operativo de la atención
      </p>

      {/* ── Identificación (snapshot) ── */}
      <div className="space-y-0.5 text-[9px]">
        <p className="flex items-center gap-1 text-black-65">
          <Link2 size={9} className="text-primary" />
          <span className="font-medium">Dominio:</span>
          <span className="font-mono text-black-85">{atencion?.dominio_identificado || "Sin identificar"}</span>
        </p>
        {atencion?.tipo_identificacion && (
          <p className="text-black-45">
            Identificación: {TIPO_IDENTIFICACION_LABEL[atencion.tipo_identificacion] ?? atencion.tipo_identificacion}
            {atencion.identificado_por ? ` · ${atencion.identificado_por}` : ""}
          </p>
        )}
        {atencion?.dominio_origen && (
          <p className="text-black-35">Origen: {ORIGEN_LABEL[atencion.dominio_origen] ?? atencion.dominio_origen}</p>
        )}
      </div>

      {/* ── Clasificación ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1 text-[9px] text-black-65">
            <Tag size={9} className="text-primary" />
            <span className="font-medium">Clasificación:</span>
          </p>
          {!editandoClasificacion && (
            <button
              type="button"
              onClick={iniciarEdicionClasificacion}
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] text-primary hover:bg-primary-5"
            >
              <Pencil size={8} /> Editar
            </button>
          )}
        </div>

        {editandoClasificacion ? (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {CATEGORIAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoriaSel(c)}
                  className={`rounded px-1.5 py-0.5 text-[8px] font-medium transition-colors ${
                    categoriaSel === c
                      ? "bg-primary text-white"
                      : "border border-black-10 text-black-45 hover:bg-light"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <input
              type="text"
              value={subcategoriaSel}
              onChange={(e) => setSubcategoriaSel(e.target.value)}
              placeholder="Subcategoría"
              className="h-6 w-full rounded border border-black-10 px-1.5 text-[9px] focus:border-primary focus:outline-none"
            />
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={guardarClasificacion}
                disabled={guardando || !categoriaSel.trim()}
                className="inline-flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[8px] font-medium text-white disabled:opacity-50"
              >
                {guardando ? <Loader2 size={8} className="animate-spin" /> : <Check size={8} />} Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditandoClasificacion(false)}
                className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-0.5 text-[8px] text-black-45"
              >
                <X size={8} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[9px] text-black-85">
            {atencion?.categoria ? (
              <>
                <span className="font-medium">{atencion.categoria}</span>
                {atencion.subcategoria ? ` / ${atencion.subcategoria}` : ""}
                {atencion.categorizado_por ? <span className="text-black-35"> · {atencion.categorizado_por}</span> : ""}
              </>
            ) : (
              <span className="text-black-35">Sin clasificar</span>
            )}
          </p>
        )}
      </div>

      {/* ── Calificación ── */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <p className="flex items-center gap-1 text-[9px] text-black-65">
            <Star size={9} className="text-warning" />
            <span className="font-medium">Calificación:</span>
          </p>
          {!editandoCalificacion && (
            <button
              type="button"
              onClick={iniciarEdicionCalificacion}
              className="inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[8px] text-primary hover:bg-primary-5"
            >
              <Pencil size={8} /> Editar
            </button>
          )}
        </div>

        {editandoCalificacion ? (
          <div className="space-y-1">
            <div className="flex gap-1">
              {CALIFICACIONES.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCalificacionSel(c)}
                  className={`rounded px-2 py-0.5 text-[9px] font-medium transition-colors ${
                    calificacionSel === c
                      ? "bg-primary text-white"
                      : "border border-black-10 text-black-45 hover:bg-light"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={guardarCalificacion}
                disabled={guardando || !calificacionSel}
                className="inline-flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[8px] font-medium text-white disabled:opacity-50"
              >
                {guardando ? <Loader2 size={8} className="animate-spin" /> : <Check size={8} />} Guardar
              </button>
              <button
                type="button"
                onClick={() => setEditandoCalificacion(false)}
                className="inline-flex items-center gap-1 rounded border border-black-10 px-2 py-0.5 text-[8px] text-black-45"
              >
                <X size={8} /> Cancelar
              </button>
            </div>
          </div>
        ) : (
          <p className="text-[9px] text-black-85">
            {atencion?.calificacion ? (
              <>
                <span className="font-medium">{"★".repeat(Number(atencion.calificacion) || 0)}</span>{" "}
                {atencion.calificacion}/5
                {atencion.calificado_por ? <span className="text-black-35"> · {atencion.calificado_por}</span> : ""}
              </>
            ) : (
              <span className="text-black-35">Sin calificar</span>
            )}
          </p>
        )}
      </div>

      {/* ── Auditoría reciente ── */}
      {auditoria.length > 0 && (
        <div className="border-t border-black-5 pt-1">
          <p className="mb-1 text-[8px] font-medium text-black-45">Historial de acciones</p>
          <div className="max-h-24 space-y-0.5 overflow-y-auto">
            {auditoria.slice(0, 8).map((a) => (
              <p key={a.id} className="truncate text-[8px] text-black-45">
                <span className="font-mono text-black-35">
                  {a.created_at ? new Date(a.created_at).toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }) : ""}
                </span>{" "}
                {a.usuario ? `${a.usuario}: ` : ""}{a.detalle ?? a.accion}
              </p>
            ))}
          </div>
        </div>
      )}

      {error && <p className="text-[8px] text-danger">{error}</p>}
    </div>
  );
}