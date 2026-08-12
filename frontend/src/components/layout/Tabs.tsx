import { NavLink } from "react-router-dom";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

/** Navegacion principal en pestañas horizontales (reemplaza la barra lateral). */
export function Tabs() {
  return (
    <nav className="flex items-center gap-1 overflow-x-auto border-b border-black-5 bg-white px-3">
      {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
        <NavLink
          key={path}
          to={path}
          end
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
  );
}
