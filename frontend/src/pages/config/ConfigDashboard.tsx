import { Link } from "react-router-dom";
import { ChevronRight, Users, Headphones, BarChart3, BookOpen, Plug } from "lucide-react";

const DOMINIOS = [
  {
    titulo: "Usuarios y acceso",
    desc: "Usuarios, roles, equipos y permisos",
    path: "/configuracion/usuarios",
    icon: Users,
  },
  {
    titulo: "Operación",
    desc: "Atención y Control de Facturación",
    path: "/configuracion/atencion",
    icon: Headphones,
  },
  {
    titulo: "Reportería",
    desc: "Parámetros de reportes y SLA",
    path: "/configuracion/reporteria",
    icon: BarChart3,
  },
  {
    titulo: "Contenido",
    desc: "Categorías y guías de conocimiento",
    path: "/configuracion/conocimiento",
    icon: BookOpen,
  },
  {
    titulo: "Sistema",
    desc: "Integraciones, notificaciones y auditoría",
    path: "/configuracion/integraciones",
    icon: Plug,
  },
];

export default function ConfigDashboard() {
  return (
    <div className="p-6">
      <div className="mx-auto max-w-2xl">
        <h2 className="text-sm font-semibold text-black-85">Configuración</h2>
        <p className="mt-0.5 text-xs text-black-45">Administra usuarios, acceso y parámetros operativos de COPE.</p>

        <div className="mt-4 divide-y divide-black-5 rounded-lg border border-black-10 bg-white">
          {DOMINIOS.map((d) => (
            <Link key={d.titulo} to={d.path} className="group flex items-center gap-3 px-4 py-2.5 transition-colors hover:bg-primary-5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-10 text-primary">
                <d.icon size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[12px] font-medium text-black-85">{d.titulo}</p>
                <p className="truncate text-[10px] text-black-45">{d.desc}</p>
              </div>
              <ChevronRight size={14} className="shrink-0 text-black-25 group-hover:text-primary" />
            </Link>
          ))}
        </div>

        <div className="mt-3 text-[10px] text-black-25">
          Selecciona un dominio administrativo desde el menú lateral para gestionar sus parámetros.
        </div>
      </div>
    </div>
  );
}
