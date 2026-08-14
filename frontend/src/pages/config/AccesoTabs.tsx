import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const TABS = [
  { path: "/configuracion/usuarios", label: "Usuarios" },
  { path: "/configuracion/roles", label: "Roles y permisos" },
  { path: "/configuracion/equipos", label: "Equipos" },
];

export function AccesoTabs() {
  return (
    <div className="mb-3 flex items-center gap-1 border-b border-black-10">
      {TABS.map((t) => (
        <NavLink
          key={t.path}
          to={t.path}
          className={({ isActive }) =>
            cn(
              "-mb-px border-b-2 px-3 py-2 text-[11px] font-medium transition-colors",
              isActive ? "border-primary text-primary" : "border-transparent text-black-45 hover:text-black-85",
            )
          }
        >
          {t.label}
        </NavLink>
      ))}
    </div>
  );
}
