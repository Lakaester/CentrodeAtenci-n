import { FileText, Shield, Globe, Clock, BookOpen, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { ChecklistFE } from "./ChecklistFE";
import { AccesosRapidos } from "./AccesosRapidos";

function Widget({ icon, label, value, ok }: { icon: React.ReactNode; label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black-10 bg-light p-2.5">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-10 text-primary">{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-[10px] text-black-45">{label}</p>
        <p className={cn("text-sm font-semibold", ok === true ? "text-success" : ok === false ? "text-danger" : "text-black-85")}>{value}</p>
      </div>
    </div>
  );
}

function ErrorRow({ msg }: { msg: string }) {
  return <p className="text-[10px] text-danger">• {msg}</p>;
}

const MOCK = {
  cdt: "Vigente — vence 31/12/2025",
  cert: "OK (vence 15/08/2025)",
  sunat: "Aceptado",
  cola: 2,
  rechazados: 1,
  errores: ["CDR rechazado (10/07)", "Firma inválida (08/07)"],
};

export function FacturacionWorkspace() {
  return (
    <div className="space-y-2 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Widget icon={<FileText size={16} />} label="Estado CDT" value={MOCK.cdt} ok />
        <Widget icon={<Shield size={16} />} label="Certificado" value={MOCK.cert} ok />
        <Widget icon={<Globe size={16} />} label="Estado SUNAT" value={MOCK.sunat} ok />
        <Widget icon={<Clock size={16} />} label="Comprob. pendientes" value={String(MOCK.cola)} ok={MOCK.cola === 0} />
      </div>

      <div className="rounded-lg border border-black-10 bg-light p-2.5">
        <p className="mb-1 text-[10px] font-medium text-black-25">Últimos errores FE</p>
        {MOCK.errores.length > 0 ? MOCK.errores.map((e, i) => <ErrorRow key={i} msg={e} />) : <p className="text-[10px] text-success">Sin errores</p>}
      </div>

      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-black-45">
          <BookOpen size={11} /> NotebookLM FE
        </p>
        <p className="text-[10px] text-black-25">Documentación disponible sobre facturación electrónica y resolución de errores comunes.</p>
      </div>

      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 flex items-center gap-1 text-[10px] font-medium text-black-45">
          <Sparkles size={11} /> Macros FE
        </p>
        <p className="text-[10px] text-black-25">Macro: Revisión rápida de CDT · Macro: Corrección de comprobantes</p>
      </div>

      <div className="rounded-lg border border-black-10 p-2.5">
        <p className="mb-1 text-[10px] font-medium text-black-45">Checklist</p>
        <ChecklistFE />
      </div>

      <div>
        <p className="mb-1 text-[10px] font-medium text-black-45">Accesos rápidos</p>
        <AccesosRapidos categoria="Facturación Electrónica" />
      </div>
    </div>
  );
}
