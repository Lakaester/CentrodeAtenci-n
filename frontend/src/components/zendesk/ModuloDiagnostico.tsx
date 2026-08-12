import { Shield } from "lucide-react";

export function ModuloDiagnostico() {
  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center gap-2 border-b border-black-10 px-2.5 py-1.5">
        <Shield size={11} className="text-[#6366F1]" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-black-45">Diagnóstico</span>
      </div>
      <div className="space-y-1.5 p-2.5">
        <div className="rounded border border-dashed border-black-10 px-2 py-1.5 text-center">
          <p className="text-[10px] font-medium text-black-25">Hipótesis</p>
          <p className="text-[9px] text-black-10">Sin hipótesis registradas</p>
        </div>
        <div>
          <p className="mb-0.5 text-[9px] font-medium text-black-25">Observaciones</p>
          <textarea
            readOnly
            placeholder="Disponible cuando el diagnóstico esté habilitado."
            className="w-full resize-none rounded border border-black-10 bg-light p-1.5 text-[9px] text-black-25 placeholder:text-black-10 focus:outline-none"
            rows={1}
          />
        </div>
      </div>
    </div>
  );
}
