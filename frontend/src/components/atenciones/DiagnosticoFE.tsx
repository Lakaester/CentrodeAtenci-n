import { useState } from "react";
import { CheckCircle2, Circle, ExternalLink, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

const DIAGNOSTICO = [
  { label: "Identificar dominio del cliente", key: "dominio" },
  { label: "Verificar estado del certificado digital", key: "certificado" },
  { label: "Verificar comprobantes encolados", key: "comprobantes" },
  { label: "Consultar Dashboard FE", key: "dashboard" },
  { label: "Revisar errores recientes", key: "errores" },
];

const ACCIONES = [
  { label: "Abrir Dashboard FE", url: "#" },
  { label: "Abrir Restafact", url: "#" },
  { label: "Abrir Dominio", url: "#" },
];

const INFO_FALTANTE = [
  { label: "Dominio del cliente", presente: false },
  { label: "RUC del cliente", presente: false },
];

const CHECKLIST_FINAL = [
  { label: "Cliente informado de la resolución", key: "informado" },
  { label: "Diagnóstico completado", key: "diagnostico" },
  { label: "Solución aplicada", key: "solucion" },
  { label: "Caso categorizado correctamente", key: "categorizado" },
  { label: "Ticket listo para cerrar", key: "cierre" },
];

function BlockCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="border-b border-black-10 px-3 py-2">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-black-85">{title}</p>
      </div>
      <div className="space-y-1.5 p-3">{children}</div>
    </div>
  );
}

export function DiagnosticoFE() {
  const [diagState, setDiagState] = useState<Record<string, boolean>>({
    dominio: false, certificado: false, comprobantes: false, dashboard: false, errores: false,
  });
  const [checkState, setCheckState] = useState<Record<string, boolean>>({
    informado: false, diagnostico: false, solucion: false, categorizado: false, cierre: false,
  });

  return (
    <div className="space-y-2">
      {/* Diagnóstico */}
      <BlockCard title="Diagnóstico">
        <p className="text-[10px] text-black-45 mb-1.5">
          Pasos para diagnosticar problemas de comprobantes electrónicos:
        </p>
        {DIAGNOSTICO.map((item) => {
          const checked = diagState[item.key];
          return (
            <button
              key={item.key}
              onClick={() => setDiagState((s) => ({ ...s, [item.key]: !s[item.key] }))}
              className="flex w-full items-center gap-2 rounded-lg border border-black-5 p-2 text-xs text-left transition-colors hover:bg-light"
            >
              {checked ? (
                <CheckCircle2 size={14} className="shrink-0 text-success" />
              ) : (
                <Circle size={14} className="shrink-0 text-black-10" />
              )}
              <span className={cn("text-black-85", checked && "text-black-25 line-through")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </BlockCard>

      {/* Acciones sugeridas */}
      <BlockCard title="Acciones sugeridas">
        <div className="flex flex-wrap gap-1.5">
          {ACCIONES.map((a) => (
            <button
              key={a.label}
              className="inline-flex items-center gap-1 rounded-md border border-[#2563EB]/30 bg-[#F0F7FF] px-2.5 py-1.5 text-[11px] font-medium text-primary transition-colors hover:bg-primary hover:text-white"
            >
              <ExternalLink size={11} />
              {a.label}
            </button>
          ))}
        </div>
      </BlockCard>

      {/* Información faltante */}
      <BlockCard title="Información faltante">
        <div className="space-y-1">
          {INFO_FALTANTE.map((item) => (
            <div key={item.label} className="flex items-center gap-2 rounded-lg border border-amber-100 bg-warning-5/50 p-2 text-xs">
              <AlertCircle size={14} className="shrink-0 text-warning" />
              <span className="text-black-85">{item.label}</span>
              <span className="ml-auto text-[10px] font-medium text-warning">Falta registrar</span>
            </div>
          ))}
        </div>
      </BlockCard>

      {/* Checklist final */}
      <BlockCard title="Checklist de resolución">
        {CHECKLIST_FINAL.map((item) => {
          const checked = checkState[item.key];
          return (
            <button
              key={item.key}
              onClick={() => setCheckState((s) => ({ ...s, [item.key]: !s[item.key] }))}
              className="flex w-full items-center gap-2 rounded-lg border border-black-5 p-2 text-xs text-left transition-colors hover:bg-light"
            >
              {checked ? (
                <CheckCircle2 size={14} className="shrink-0 text-success" />
              ) : (
                <Circle size={14} className="shrink-0 text-black-10" />
              )}
              <span className={cn("text-black-85", checked && "text-black-25 line-through")}>
                {item.label}
              </span>
            </button>
          );
        })}
      </BlockCard>
    </div>
  );
}
