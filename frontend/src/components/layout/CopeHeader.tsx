import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Menu, ChevronDown, LogOut, User, Users } from "lucide-react";
import { ROUTE_TITLES } from "@/config/cope-navigation";
import { useAuth } from "@/modules/auth";

interface Props {
  onMenuClick: () => void;
  isWorkspace?: boolean;
}

function iniciales(nombre: string): string {
  return nombre.split(" ").map((s) => s[0]).filter(Boolean).join("").slice(0, 2).toUpperCase() || "U";
}

export function CopeHeader({ onMenuClick }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const title = ROUTE_TITLES[location.pathname] ?? "COPE";

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const rolLabel = user?.rol ?? "Usuario";
  const nombre = user?.nombre ?? "Usuario";
  const apellido = user?.apellido ? ` ${user.apellido}` : "";

  const cerrarSesion = async () => {
    setOpen(false);
    await logout();
    navigate("/login", { replace: true });
  };

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
        <img src="/logos/restaurantpe-logo-2024-02.png" alt="Restaurant.pe" className="h-[16px] w-auto" />
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
      <div ref={ref} className="relative flex items-center h-full">
        <button
          className="flex items-center gap-3 px-4 h-full hover:bg-light transition-colors outline-none"
          onClick={() => setOpen((v) => !v)}
        >
          <div className="hidden sm:block text-right leading-tight">
            <p className="text-xs text-black-45">
              Hola, <span className="font-semibold text-black-85">{nombre}</span>
            </p>
            <span className="inline-block text-[9px] font-bold uppercase tracking-wide bg-black-85 text-white px-2 py-0.5 rounded-sm">
              {rolLabel}
            </span>
          </div>
          <div className="grid h-8 w-8 place-items-center rounded-full bg-primary text-white text-[11px] font-bold shrink-0">
            {iniciales(nombre)}
          </div>
          <ChevronDown className="h-3.5 w-3.5 text-black-45 shrink-0" />
        </button>

        {open && (
          <div className="absolute right-2 top-full mt-1 w-48 rounded-lg border border-black-10 bg-white z-50 py-1">
            <div className="border-b border-black-5 px-3 py-2">
              <p className="text-[12px] font-medium text-black-85">{nombre}{apellido}</p>
              <p className="truncate text-[10px] text-black-45">{user?.correo}</p>
            </div>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-black-45 hover:bg-light"
              onClick={() => { setOpen(false); navigate("/configuracion/usuarios"); }}
            >
              <User className="h-3.5 w-3.5" /> Mi perfil
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-black-45 hover:bg-light"
              onClick={() => { setOpen(false); navigate("/configuracion/equipos"); }}
            >
              <Users className="h-3.5 w-3.5" /> Mi equipo
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-danger hover:bg-danger-5"
              onClick={cerrarSesion}
            >
              <LogOut className="h-3.5 w-3.5" /> Cerrar sesión
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
