import type { FeatureFlag } from "../types/FeatureFlag";

interface Props {
  flags: FeatureFlag[];
  loading: boolean;
  dominio: string;
  onToggle: (dominio: string, nombre: string, habilitado: boolean) => void;
}

export function FeatureFlagsTable({ flags, loading, dominio, onToggle }: Props) {
  if (loading) {
    return <div className="p-4 text-sm text-black-45">Cargando feature flags...</div>;
  }

  if (flags.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 p-8 text-center">
        <p className="text-sm text-black-45">Sin datos</p>
        <p className="text-[11px] text-black-25">Presione "Obtener Feature Flags" para cargar.</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-black-10 text-left text-[11px] uppercase text-black-45">
            <th className="px-4 py-2 font-medium">Nombre</th>
            <th className="px-4 py-2 font-medium">Descripción</th>
            <th className="px-4 py-2 font-medium">Estado</th>
            <th className="px-4 py-2 font-medium">Acción</th>
          </tr>
        </thead>
        <tbody>
          {flags.map((flag) => (
            <tr key={flag.nombre} className="border-b border-black-5">
              <td className="px-4 py-2 font-mono text-[12px] text-black-85">{flag.nombre}</td>
              <td className="px-4 py-2 text-[12px] text-black-45">{flag.descripcion}</td>
              <td className="px-4 py-2">
                <span className={`inline-block rounded px-2 py-0.5 text-[11px] font-medium ${flag.habilitado ? "bg-success-10 text-success" : "bg-black-10 text-black-65"}`}>
                  {flag.habilitado ? "Activado" : "Desactivado"}
                </span>
              </td>
              <td className="px-4 py-2">
                <button
                  type="button"
                  onClick={() => {
                    const accion = flag.habilitado ? "desactivar" : "activar";
                    if (window.confirm(`¿Está seguro de ${accion} "${flag.nombre}"?`)) {
                      onToggle(dominio, flag.nombre, !flag.habilitado);
                    }
                  }}
                  className={`rounded px-2 py-1 text-[11px] font-medium ${flag.habilitado ? "bg-danger-5 text-danger hover:bg-danger-10" : "bg-success-5 text-success hover:bg-success-10"}`}
                >
                  {flag.habilitado ? "Desactivar" : "Activar"}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
