import { Activity, Building2, Globe, Clock, Tag, Ticket, Phone, Mail, User, List } from "lucide-react";
import { useZendeskCustomer } from "./useZendeskCustomer";
import { useZendeskTimeline } from "./useZendeskTimeline";
import { cn } from "@/lib/utils";

function ND() { return <span className="text-black-10">—</span>; }

export function ModuloCliente360Real({ clienteId }: { clienteId: string | undefined }) {
  const { data, loading } = useZendeskCustomer(clienteId ?? null);
  const { data: timeline } = useZendeskTimeline(clienteId ?? null);

  if (!clienteId) {
    return (
      <div className="text-[11px] text-black-25 py-2">
        <p>Seleccione un ticket para ver los datos del cliente.</p>
      </div>
    );
  }

  if (loading) {
    return <div className="text-[11px] text-black-25 py-2">Cargando datos del cliente...</div>;
  }

  if (!data) {
    return (
      <div className="text-[11px] text-black-25 py-2">
        <p>Información del cliente no disponible.</p>
      </div>
    );
  }

  return (
    <div className="space-y-1 text-[11px]">
      <Field icon={<User size={10} />} label="Nombre" value={data.nombre} />
      <Field icon={<Mail size={10} />} label="Correo" value={data.correo} />
      <Field icon={<Phone size={10} />} label="Teléfono" value={data.telefono} />
      <Field icon={<Building2 size={10} />} label="Empresa" value={data.empresa} />
      <Field icon={<Globe size={10} />} label="Zona horaria" value={data.zonaHoraria} />
      <Field icon={<Clock size={10} />} label="Creado" value={data.fechaCreacion ? new Date(data.fechaCreacion).toLocaleDateString("es-PE", { day: "numeric", month: "short", year: "numeric" }) : null} />
      <Field icon={<Activity size={10} />} label="Última actividad" value={data.ultimaActividad ? new Date(data.ultimaActividad).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : null} />
      <Field icon={<Ticket size={10} />} label="Tickets" value={`${data.totalTickets} totales · ${data.ticketsAbiertos} abiertos`} />
      {data.tags.length > 0 && (
        <div className="flex items-start gap-2 pt-0.5">
          <Tag size={10} className="mt-0.5 shrink-0 text-black-25" />
          <div className="flex flex-wrap gap-0.5">
            {data.tags.map((t) => (
              <span key={t} className="rounded bg-black-5 px-1 py-0.5 text-[9px] text-black-45">{t}</span>
            ))}
          </div>
        </div>
      )}

      {/* Timeline de tickets del cliente */}
      {timeline.length > 0 && (
        <div className="mt-2 pt-2 border-t border-black-10">
          <p className="flex items-center gap-1 text-[9px] font-semibold uppercase tracking-wider text-black-25 mb-1">
            <List size={10} /> Últimos tickets
          </p>
          <div className="space-y-0.5">
            {timeline.slice(0, 5).map((t) => (
              <div key={t.ticketId} className="flex items-center gap-1.5 rounded bg-light px-1.5 py-1 text-[10px]">
                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full",
                  t.estado === "new" ? "bg-success-50" : t.estado === "open" ? "bg-primary-50" : t.estado === "pending" ? "bg-amber-400" : "bg-slate-300")} />
                <span className="truncate font-medium text-black-85">{t.asunto}</span>
                <span className="ml-auto shrink-0 text-black-25">{t.fecha ? new Date(t.fecha).toLocaleDateString("es-PE", { day: "numeric", month: "short" }) : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function Field({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | null }) {
  return (
    <div className="flex items-center gap-2">
      <span className="shrink-0 text-black-25">{icon}</span>
      <span className="text-black-25 min-w-[80px]">{label}</span>
      <span className="font-medium text-black-85 truncate">{value ?? <ND />}</span>
    </div>
  );
}
