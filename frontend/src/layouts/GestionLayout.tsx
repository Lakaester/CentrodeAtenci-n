import { NavLink, Outlet } from "react-router-dom";
import { cn } from "@/lib/utils";
import { ClipboardList, HandHelping, CalendarClock } from "lucide-react";
import { useAuth, authService } from "@/modules/auth";

const GESTION_TABS = [
  { path: "/gestion/quejas-devoluciones", label: "Quejas y Devoluciones", icon: ClipboardList, modulo: "Quejas y Devoluciones" },
  { path: "/gestion/apoyos", label: "Apoyos", icon: HandHelping, modulo: "Apoyos" },
  { path: "/gestion/agendas", label: "Agendas", icon: CalendarClock, modulo: "Agendas" },
];

export function GestionLayout() {
  const { user } = useAuth();

  const tabsVisibles = GESTION_TABS.filter((tab) =>
    authService.moduloVisible(user, tab.modulo)
  );

  return (
    <div className="flex flex-col flex-1">
      <div className="flex flex-wrap gap-3 items-end px-5 pt-3 pb-2 md:px-6">
        <h1 className="text-base font-semibold text-black-85">Gestión</h1>
      </div>
      <nav className="flex items-center gap-1 overflow-x-auto border-b border-black-5 bg-white px-3">
        {tabsVisibles.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-2 whitespace-nowrap border-b-2 px-3 py-3 text-sm transition-colors",
                isActive
                  ? "border-primary text-primary font-medium"
                  : "border-transparent text-black-45 hover:text-black-85",
              )
            }
          >
            <Icon size={16} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="flex-1 overflow-y-auto p-5 md:p-6 space-y-4">
        <Outlet />
      </div>
    </div>
  );
}
