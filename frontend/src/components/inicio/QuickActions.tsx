import { Headphones, Search, Globe, FileText, Codepen } from "lucide-react";

const ACTIONS = [
  { icon: Headphones, label: "Ir a Atenciones", desc: "Gestiona tickets y asignaciones", href: "/atenciones" },
  { icon: Search, label: "Buscar Cliente", desc: "Consulta datos del cliente", href: "#" },
  { icon: Globe, label: "Buscar Dominio", desc: "Información de dominio", href: "#" },
  { icon: FileText, label: "Buscar Ticket", desc: "Localiza un ticket por ID", href: "#" },
  { icon: Codepen, label: "Buscar DEV", desc: "Seguimiento de incidencias DEV", href: "#" },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {ACTIONS.map(({ icon: Icon, label, desc, href }) => (
        <a
          key={label}
          href={href}
          className="flex flex-col items-center gap-1.5 rounded-xl border border-black-10 bg-white p-4 text-center  transition-all hover:-translate-y-0.5 hover:border-[#F97316]/30"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-10 text-primary">
            <Icon size={20} />
          </div>
          <span className="text-sm font-semibold text-black-85">{label}</span>
          <span className="text-[10px] leading-tight text-black-25">{desc}</span>
        </a>
      ))}
    </div>
  );
}
