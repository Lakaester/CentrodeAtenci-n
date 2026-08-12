import { useState } from "react";
import { Shield, Circle, CheckCircle2, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

type EstadoDiag = "sin_analizar" | "analizando" | "validando" | "escalado" | "resuelto";

const ESTADOS: { key: EstadoDiag; label: string; color: string }[] = [
  { key: "sin_analizar", label: "Sin analizar", color: "bg-black-10 text-black-65" },
  { key: "analizando",   label: "Analizando",   color: "bg-primary-5 text-primary" },
  { key: "validando",    label: "Validando",    color: "bg-warning-5 text-warning-65" },
  { key: "escalado",     label: "Escalado",     color: "bg-purple-5 text-purple" },
  { key: "resuelto",     label: "Resuelto",     color: "bg-success-5 text-success" },
];

interface HipBitacora {
  hora: string;
  desde: string;
  hasta: string;
  motivo: string;
}

export function ModuloDiagnosticoOperativo() {
  const [estado, setEstado] = useState<EstadoDiag>("sin_analizar");
  const [hipotesis, setHipotesis] = useState("");
  const [bitacora, setBitacora] = useState<HipBitacora[]>([]);
  const [pendiente, setPendiente] = useState("");

  const cambiarHipotesis = () => {
    if (!hipotesis.trim()) return;
    const anterior = bitacora.length > 0 ? bitacora[bitacora.length - 1].hasta : "Sin hipótesis";
    setBitacora((prev) => [
      ...prev,
      { hora: new Date().toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" }), desde: anterior, hasta: hipotesis, motivo: "Manual" },
    ]);
  };

  return (
    <div>
      <div className="flex items-center gap-1.5 mb-2">
        <Shield size={11} className="text-[#6366F1]" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-black-25">Diagnóstico</span>
        <div className="ml-auto flex gap-0.5">
          {ESTADOS.map((e) => (
            <button key={e.key} onClick={() => setEstado(e.key)}
              className={cn("h-2 flex-1 rounded-full transition-colors", estado === e.key ? e.color.split(" ")[0] : "bg-black-10")}
              title={e.label}
            />
          ))}
        </div>
      </div>

      <div className="space-y-2 text-[11px]">
        {/* Estado actual */}
        <div className="flex items-center gap-1.5">
          {estado === "resuelto"
            ? <CheckCircle2 size={12} className="text-success" />
            : <Circle size={12} className={cn(estado === "sin_analizar" ? "text-black-10" : "text-primary")} />
          }
          <span className="font-medium text-black-85">{ESTADOS.find((e) => e.key === estado)?.label}</span>
        </div>

        {/* Hipótesis actual */}
        <div>
          <p className="text-[9px] font-medium text-black-25 uppercase tracking-wider mb-0.5">Hipótesis actual</p>
          <div className="flex gap-1">
            <input type="text" value={hipotesis} onChange={(e) => setHipotesis(e.target.value)}
              placeholder="Ej: Problema de facturación..."
              className="flex-1 rounded border border-black-10 bg-light px-1.5 py-1 text-[11px] text-black-85 placeholder:text-black-10 focus:border-[#2563EB] focus:outline-none"
            />
            <button onClick={cambiarHipotesis}
              className="rounded bg-primary px-2 py-1 text-[10px] font-medium text-white hover:bg-primary-85">
              OK
            </button>
          </div>
        </div>

        {/* Información pendiente */}
        <div>
          <p className="text-[9px] font-medium text-black-25 uppercase tracking-wider mb-0.5">Información pendiente</p>
          <div className="flex gap-1">
            <input type="text" value={pendiente} onChange={(e) => setPendiente(e.target.value)}
              placeholder="¿Qué falta investigar?"
              className="flex-1 rounded border border-dashed border-amber-200 bg-warning-5/30 px-1.5 py-1 text-[11px] text-black-85 placeholder:text-black-10 focus:border-[#2563EB] focus:outline-none"
            />
          </div>
        </div>

        {/* Bitácora */}
        {bitacora.length > 0 && (
          <div>
            <p className="text-[9px] font-medium text-black-25 uppercase tracking-wider mb-0.5">Bitácora</p>
            <div className="space-y-0.5">
              {bitacora.map((b, i) => (
                <div key={i} className="flex items-start gap-1.5 rounded bg-light p-1.5 text-[10px]">
                  <Clock size={9} className="mt-0.5 shrink-0 text-black-25" />
                  <div className="min-w-0 flex-1">
                    <span className="text-black-25">{b.hora}</span>
                    <p className="text-black-85">
                      <span className="text-black-10 line-through">{b.desde}</span>
                      <span className="mx-1">→</span>
                      <span className="font-medium">{b.hasta}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
