import { NavLink, Outlet, useLocation } from "react-router-dom";
import {
  Settings, SlidersHorizontal, Users, Headphones, ReceiptText, BarChart3,
  BookOpen, Plug, Bell, ScrollText, RefreshCcw,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Item = { path: string; label: string; icon: typeof Users; matchPrefix?: string[] };
type Grupo = { titulo: string; items: Item[] };

const GRUPOS: Grupo[] = [
  {
    titulo: "General",
    items: [{ path: "/configuracion/preferencias", label: "Preferencias", icon: SlidersHorizontal }],
  },
  {
    titulo: "Acceso",
    items: [{ path: "/configuracion/usuarios", label: "Usuarios y acceso", icon: Users, matchPrefix: ["/configuracion/usuarios", "/configuracion/roles", "/configuracion/equipos"] }],
  },
  {
    titulo: "Operación",
    items: [
      { path: "/configuracion/atencion", label: "Atención", icon: Headphones },
      { path: "/configuracion/facturacion", label: "Control de Facturación", icon: ReceiptText },
      { path: "/configuracion/quejas-devoluciones", label: "Quejas y Devoluciones", icon: RefreshCcw },
    ],
  },
  {
    titulo: "Reportería",
    items: [{ path: "/configuracion/reporteria", label: "Reportería", icon: BarChart3 }],
  },
  {
    titulo: "Contenido",
    items: [{ path: "/configuracion/conocimiento", label: "Conocimiento", icon: BookOpen }],
  },
  {
    titulo: "Sistema",
    items: [
      { path: "/configuracion/integraciones", label: "Integraciones", icon: Plug },
      { path: "/configuracion/notificaciones", label: "Notificaciones", icon: Bell },
      { path: "/configuracion/auditoria", label: "Auditoría", icon: ScrollText },
    ],
  },
];

function esActivo(pathname: string, item: Item): boolean {
  if (item.matchPrefix) return item.matchPrefix.some((p) => pathname === p || pathname.startsWith(p + "/"));
  return pathname === item.path;
}

export function ConfigLayout() {
  const { pathname } = useLocation();

  return (
    <div className="flex flex-1 min-h-0 flex-col">
      <div className="shrink-0 border-b border-black-10 px-6 py-3">
        <div className="flex items-center gap-2">
          <Settings size={16} className="text-primary" />
          <h1 className="text-sm font-semibold text-black-85">Configuración</h1>
        </div>
      </div>

      <div className="flex flex-1 min-h-0">
        <aside className="flex w-56 shrink-0 flex-col border-r border-black-10 bg-white">
          <nav className="flex-1 overflow-y-auto py-2">
            {GRUPOS.map((grupo) => (
              <div key={grupo.titulo} className="mb-1">
                <p className="px-4 pb-0.5 pt-1 text-[9px] font-semibold uppercase tracking-wider text-black-25">{grupo.titulo}</p>
                {grupo.items.map((item) => (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-2 px-4 py-1.5 text-[12px] font-medium transition-colors",
                        isActive || esActivo(pathname, item)
                          ? "border-l-[3px] border-primary bg-primary-5 text-primary"
                          : "border-l-[3px] border-transparent text-black-45 hover:bg-light hover:text-black-85",
                      )
                    }
                  >
                    <item.icon size={14} className="shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </NavLink>
                ))}
              </div>
            ))}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 overflow-y-auto bg-light">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
