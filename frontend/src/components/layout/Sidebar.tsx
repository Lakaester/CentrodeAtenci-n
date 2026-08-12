import { NavLink } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { NAV_ITEMS } from "@/config/navigation";
import { cn } from "@/lib/utils";

export function Sidebar({
  isOpen,
  onToggle,
}: {
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <aside
      className={cn(
        "hidden md:flex flex-col border-r border-black-10 bg-white transition-all duration-300",
        isOpen ? "w-64" : "w-16",
      )}
    >
      <div
        className={cn(
          "h-16 flex items-center border-b border-black-10 shrink-0",
          isOpen ? "gap-3 px-5 justify-start" : "justify-center px-0",
        )}
      >
        <div className="h-8 w-8 rounded bg-primary grid place-items-center text-white font-bold text-sm shrink-0">
          R
        </div>
        {isOpen && (
          <div className="leading-tight truncate">
            <p className="text-sm font-semibold text-black-85">Restaurant.pe</p>
            <p className="text-xs text-black-45">Soporte Especializado · BI</p>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
        {NAV_ITEMS.map(({ path, label, icon: Icon }) => (
          <NavLink
            key={path}
            to={path}
            end={path === "/reportes"}
            className={({ isActive }) =>
              cn(
                "flex items-center rounded px-3 py-2.5 text-sm transition-colors",
                isOpen ? "gap-3" : "justify-center gap-0",
                isActive
                  ? "bg-primary-10 text-primary font-semibold"
                  : "text-black-45 hover:text-black-85 hover:bg-light",
              )
            }
            title={!isOpen ? label : undefined}
          >
            <Icon size={18} className={cn("shrink-0", isOpen ? "" : "m-0")} />
            {isOpen && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className={cn(
          "h-10 shrink-0 border-t border-black-10 text-black-45 hover:text-black-85 hover:bg-light transition-colors grid place-items-center",
        )}
        title={isOpen ? "Colapsar" : "Expandir"}
      >
        {isOpen ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
      </button>
    </aside>
  );
}
