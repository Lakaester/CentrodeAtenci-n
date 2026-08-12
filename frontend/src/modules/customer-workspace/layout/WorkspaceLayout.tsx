import type { CustomerWorkspaceData } from "../types";

interface Props {
  data: CustomerWorkspaceData;
  children: React.ReactNode;
}

export function WorkspaceLayout({ data, children }: Props) {
  return (
    <div className="flex h-full flex-col bg-light">
      {/* Header permanente */}
      <div className="shrink-0 border-b border-black-10 bg-white px-4 py-2.5">
        <div className="flex items-center gap-4 text-[11px] text-black-45">
          <span className="font-semibold text-black-85">{data.dominio}</span>
          <span className="text-black-10">|</span>
          <span>{data.empresa || "—"}</span>
          <span className="text-black-10">|</span>
          <span>{data.producto || "—"}</span>
          <span className="text-black-10">|</span>
          <span>{data.pais || "—"}</span>
          <span className="text-black-10">|</span>
          <span className={data.estado === "activo" ? "text-success" : "text-warning"}>{data.estado || "—"}</span>
          <span className="ml-auto text-[10px] text-black-25">
            Última conexión: {data.ultimaConexion ?? "—"}
          </span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto">
        {children}
      </div>
    </div>
  );
}
