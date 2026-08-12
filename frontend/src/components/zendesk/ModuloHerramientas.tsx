import { Wrench } from "lucide-react";

export function ModuloHerramientas() {
  return (
    <div className="rounded-lg border border-black-10 bg-white">
      <div className="flex items-center gap-2 border-b border-black-10 px-2.5 py-1.5">
        <Wrench size={11} className="text-primary" />
        <span className="text-[9px] font-semibold uppercase tracking-wider text-black-45">Herramientas</span>
      </div>
      <div className="grid grid-cols-2 gap-1 p-2.5 text-[10px]">
        <Categoria nombre="Facturación" />
        <Categoria nombre="Integraciones" />
        <Categoria nombre="Software" />
        <Categoria nombre="Logística" />
        <Categoria nombre="Administrativo" />
      </div>
    </div>
  );
}

function Categoria({ nombre }: { nombre: string }) {
  return (
    <div className="rounded border border-dashed border-black-10 px-2 py-1.5 text-center">
      <span className="text-black-25">{nombre}</span>
      <p className="text-[8px] text-black-10">No disponible</p>
    </div>
  );
}
