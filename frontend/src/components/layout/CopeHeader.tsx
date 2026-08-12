import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { Menu, ChevronDown, LogOut } from "lucide-react";
import { ROUTE_TITLES } from "@/config/cope-navigation";

interface Props {
  onMenuClick: () => void;
  isWorkspace?: boolean;
}

function UserDropdown({ firstName, initials, role, onLogout }: {
  firstName: string;
  initials: string;
  role: string;
  onLogout: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div ref={ref} className="relative flex items-center h-full">
      <button
        className="flex items-center gap-3 px-4 h-full hover:bg-light transition-colors outline-none"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="hidden sm:block text-right leading-tight">
          <p className="text-xs text-black-45">
            Hola, <span className="font-semibold text-black-85">{firstName}</span>
          </p>
          <span className="inline-block text-[9px] font-bold uppercase tracking-wide bg-black-85 text-white px-2 py-0.5 rounded-sm">
            {role}
          </span>
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white text-[11px] font-bold shrink-0">
          {initials}
        </div>
        <ChevronDown className="h-3.5 w-3.5 text-black-45 shrink-0" />
      </button>

      {open && (
        <div className="absolute right-2 top-full mt-1 w-44 rounded-lg border border-black-10 bg-white  z-50">
          <button
            className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-danger hover:bg-danger-5 rounded-lg transition-colors"
            onClick={() => { setOpen(false); onLogout(); }}
          >
            <LogOut className="h-4 w-4" />
            Cerrar sesion
          </button>
        </div>
      )}
    </div>
  );
}

export function CopeHeader({ onMenuClick }: Props) {
  const location = useLocation();
  const title = ROUTE_TITLES[location.pathname] ?? "COPE";

  return (
    <header className="shrink-0 h-14 flex items-center bg-white border-b border-black-10 sticky top-0 z-30">
      {/* Mobile hamburger */}
      <button
        className="lg:hidden px-4 h-full flex items-center text-black-45 hover:bg-light transition-colors"
        onClick={onMenuClick}
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Logo + addon name */}
      <div className="flex flex-col items-start justify-center px-4 h-full gap-0.5">
        <img src="/logo-restaurantpe.svg" alt="Restaurant.pe" className="h-[14px] w-auto" />
        <span className="text-[9px] font-bold text-primary uppercase tracking-widest leading-none">
          COPE
        </span>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-black-10 shrink-0" />

      {/* Page title */}
      <div className="flex-1 flex items-center px-4 min-w-0">
        <span className="text-sm font-semibold text-black-85 truncate">{title}</span>
      </div>

      {/* Separator */}
      <div className="w-px h-6 bg-black-10 shrink-0" />

      {/* User section */}
      <UserDropdown
        firstName="Admin"
        initials="A"
        role="Admin"
        onLogout={() => console.log("Logout")}
      />
    </header>
  );
}
