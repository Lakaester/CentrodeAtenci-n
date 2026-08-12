import type { CustomerWorkspaceData } from "../types";

interface Props {
  data: CustomerWorkspaceData;
}

export function ResumenTab({ data }: Props) {
  return (
    <div className="space-y-4 p-4">
      <h2 className="text-sm font-semibold text-black-85">Resumen del cliente</h2>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">
        <InfoCard label="Dominio" value={data.dominio} />
        <InfoCard label="Empresa" value={data.empresa ?? "—"} />
        <InfoCard label="Producto" value={data.producto ?? "—"} />
        <InfoCard label="País" value={data.pais ?? "—"} />
        <InfoCard label="Estado" value={data.estado ?? "—"} />
        <InfoCard label="Última conexión" value={data.ultimaConexion ?? "—"} />
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-black-10 bg-white p-3">
      <p className="text-[10px] uppercase tracking-wide text-black-25">{label}</p>
      <p className="mt-1 text-[13px] font-medium text-black-85">{value}</p>
    </div>
  );
}
