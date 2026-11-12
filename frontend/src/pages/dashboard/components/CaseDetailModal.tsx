import { useState } from "react";
import { Link } from "react-router-dom";
import { Check, Copy, ExternalLink, X } from "lucide-react";
import type { CasoAlerta } from "../dto/dashboard.dto";
import { fmtDateTime, fmtInt, fmtMin } from "../utils/format";

interface Props {
  caso: CasoAlerta | null;
  onClose: () => void;
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 border-b border-black-5 py-2">
      <p className="text-[9px] font-semibold uppercase tracking-[0.08em] text-black-25">{label}</p>
      <p className="mt-0.5 break-words text-[12px] text-black-85">{value}</p>
    </div>
  );
}

export function CaseDetailModal({ caso, onClose }: Props) {
  const [copied, setCopied] = useState(false);
  if (!caso) return null;

  const copy = async () => {
    if (!caso.ticketId) return;
    try {
      await navigator.clipboard.writeText(caso.ticketId);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  const href = caso.ticketId
    ? `/atenciones?ticket=${encodeURIComponent(caso.ticketId)}&canal=${encodeURIComponent(caso.canal)}`
    : "/atenciones";

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black-85/45 p-3 sm:items-center" role="dialog" aria-modal="true">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-black-10 bg-white shadow-2xl">
        <div className="flex items-start justify-between gap-3 border-b border-black-5 px-4 py-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.1em] text-primary">Detalle del caso</p>
            <h3 className="mt-0.5 text-base font-semibold text-black-85">
              Ticket {caso.ticketId ?? "sin identificador"}
            </h3>
            <p className="mt-0.5 text-[11px] text-black-25">
              {caso.canal} · {caso.estado} · {fmtDateTime(caso.fecha, caso.hora)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-black-45 hover:bg-light hover:text-black-85"
            aria-label="Cerrar detalle"
          >
            <X size={18} />
          </button>
        </div>

        <div className="grid grid-cols-1 gap-x-4 px-4 sm:grid-cols-2">
          <Row label="Asesor" value={caso.asesor} />
          <Row label="Categoría" value={caso.categoria} />
          <Row label="Contacto" value={caso.contacto ?? "No identificado"} />
          <Row label="Número / correo" value={caso.numero ?? "—"} />
          <Row label="Dominio" value={caso.dominio ?? "Sin dominio"} />
          <Row label="Antigüedad" value={fmtMin(caso.edadMin)} />
          <Row label="Primera respuesta" value={fmtMin(caso.primera)} />
          <Row label="SLA primera respuesta" value={fmtMin(caso.slaPrimera)} />
          <Row label="SLA resolución" value={fmtMin(caso.slaResolucion)} />
          <Row
            label="Clasificación"
            value={[
              caso.critico ? "Crítico >72 h" : null,
              caso.fueraSla ? "Fuera de SLA" : null,
              caso.proximo ? "Próximo a vencer" : null,
              caso.antiguo ? "Antiguo >7 d" : null,
            ]
              .filter(Boolean)
              .join(" · ") || "En seguimiento"}
          />
        </div>

        <div className="mx-4 mt-3 rounded-lg bg-black-5 px-3 py-2 text-[10px] leading-4 text-black-45">
          La vista no contiene un campo de prioridad. La clasificación se calcula por antigüedad y por los umbrales
          SLA configurados para el canal ({fmtInt(caso.slaPrimera)} min primera respuesta /{" "}
          {fmtInt(caso.slaResolucion)} min resolución).
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 px-4 py-3">
          <button
            type="button"
            onClick={copy}
            disabled={!caso.ticketId}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-black-10 px-3 text-[11px] font-medium text-black-85 hover:bg-light disabled:opacity-40"
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? "Copiado" : "Copiar ticket"}
          </button>
          <Link
            to={href}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-primary px-3 text-[11px] font-semibold text-white hover:bg-primary-85"
          >
            <ExternalLink size={13} /> Abrir en Atenciones
          </Link>
        </div>
      </div>
    </div>
  );
}
