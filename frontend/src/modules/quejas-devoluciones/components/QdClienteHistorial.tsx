import { useQdLista } from "@/modules/quejas-devoluciones";
import { EstadoBadge, ResultadoBadge, fmtFecha, fmtMoneda } from "@/modules/quejas-devoluciones/components/qdUI";
import { Link } from "react-router-dom";

export function QdClienteHistorial({ dominios }: { dominios: string[] }) {
  const { data: devoluciones, isLoading: loadD } = useQdLista("devolucion");
  const { data: quejas, isLoading: loadQ } = useQdLista("queja");

  if (loadD || loadQ) return <p className="px-2.5 py-1 text-[10px] text-black-25">Cargando…</p>;

  const casos = [...(devoluciones ?? []), ...(quejas ?? [])].filter(
    (c) => c.dominio && dominios.includes(c.dominio),
  );

  if (casos.length === 0) {
    return <p className="px-2.5 py-1 text-[10px] text-black-25">Sin casos de quejas o devoluciones</p>;
  }

  return (
    <div className="space-y-1 px-2.5 pb-2">
      {casos.map((c) => (
        <div key={c.id} className="rounded border border-black-10 bg-light p-2">
          <div className="flex items-center justify-between gap-2">
            <span className="font-mono text-[9px] font-semibold text-primary">{c.numero}</span>
            <span className="text-[9px] text-black-45">{fmtFecha(c.created_at)}</span>
          </div>
          <p className="mt-0.5 truncate text-[10px] font-medium text-black-85">
            {c.tipo === "devolucion" ? "Devolución" : "Queja"} · {c.dominio || c.ticket_id || "—"}
          </p>
          <div className="mt-1 flex items-center gap-2 text-[9px] text-black-45">
            <span className="truncate">{c.motivo || c.area || c.producto || "—"}</span>
          </div>
          <div className="mt-1 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <EstadoBadge estado={c.estado} />
              <ResultadoBadge resultado={c.resultado} />
            </div>
            <div className="flex items-center gap-2 text-[9px] text-black-45">
              {c.total_interacciones != null && c.total_interacciones > 0 && (
                <span>{c.total_interacciones} interacción(es)</span>
              )}
              {c.tipo === "devolucion" && <span>{fmtMoneda(c.monto_devuelto)}</span>}
            </div>
          </div>
          <Link to="/quejas-devoluciones" className="mt-1 inline-block text-[9px] text-primary hover:underline">Abrir caso operativo</Link>
        </div>
      ))}
    </div>
  );
}
