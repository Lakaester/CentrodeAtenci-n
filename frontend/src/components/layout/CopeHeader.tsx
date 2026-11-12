import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
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

  const title = ROUTE_TITLES[location.pathname] ?? "C.O.S.E";

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
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center border-b border-black-10 bg-white">
      {/* Mobile menu */}
      <button
        className="flex h-full items-center px-3 text-black-45 transition-colors hover:bg-light hover:text-black-85 lg:hidden"
        onClick={onMenuClick}
        aria-label="Abrir menú"
      >
        <Menu className="h-5 w-5" />
      </button>

      {/* Identidad institucional */}
      <Link
        to="/dashboard"
        className="flex h-full min-w-0 items-center gap-3 px-3 sm:px-4"
        title="RESTAURANT.PE — Centro de Operaciones de Soporte Especializado (C.O.S.E)"
      >
        <div className="hidden h-14 w-[190px] shrink-0 items-center overflow-hidden md:flex xl:w-[210px]">
          <img
            src="/logos/restaurantpe-logo-2024-principal.png"
            alt="Restaurant.pe"
            className="w-[190px] -my-6 object-contain xl:w-[210px]"
          />
        </div>
        <img
          src="/logos/restaurantpe-logo-2024-fondo-color-07.png"
          alt="Restaurant.pe"
          className="h-9 w-9 shrink-0 object-contain md:hidden"
        />

        <div className="hidden min-w-0 flex-col lg:flex">
          <span className="max-w-[300px] whitespace-nowrap text-[9px] font-semibold leading-4 text-black-85">
            Centro de Operaciones de Soporte Especializado
          </span>
          <span className="text-[9px] font-semibold leading-4 tracking-[0.16em] text-primary">
            (C.O.S.E)
          </span>
        </div>
      </Link>

      <div className="hidden h-7 w-px shrink-0 bg-black-10 sm:block" />

      {/* Módulo actual */}
      <div className="flex min-w-0 flex-1 items-center px-3 sm:px-4">
        <div className="min-w-0">
          <p className="hidden text-[9px] font-semibold uppercase tracking-[0.12em] text-black-25 lg:block">
            Restaurant.pe · C.O.S.E
          </p>
          <h1 className="truncate text-[15px] font-semibold leading-5 text-black-85">{title}</h1>
          <p className="text-[8px] leading-3 text-black-45 lg:hidden">
            RESTAURANT.PE · Centro de Operaciones de Soporte Especializado (C.O.S.E)
          </p>
        </div>
      </div>

      <div className="h-7 w-px shrink-0 bg-black-10" />

      {/* Usuario */}
      <div ref={ref} className="relative flex h-full items-center">
        <button
          className="flex h-full items-center gap-2.5 px-3 outline-none transition-colors hover:bg-light sm:gap-3 sm:px-4"
          onClick={() => setOpen((v) => !v)}
          aria-label="Menú de usuario"
          aria-expanded={open}
        >
          <div className="hidden text-right leading-tight sm:block">
            <p className="text-xs text-black-45">
              Hola, <span className="font-semibold text-black-85">{nombre}</span>
            </p>
            <span className="inline-block rounded-sm bg-black-85 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide text-white">
              {rolLabel}
            </span>
          </div>
          <div className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-white">
            {iniciales(nombre)}
          </div>
          <ChevronDown className="h-3.5 w-3.5 shrink-0 text-black-45" />
        </button>

        {open && (
          <div className="absolute right-2 top-full z-50 mt-1 w-48 rounded-lg border border-black-10 bg-white py-1 shadow-lg">
            <div className="border-b border-black-5 px-3 py-2">
              <p className="text-[12px] font-medium text-black-85">{nombre}{apellido}</p>
              <p className="truncate text-[10px] text-black-45">{user?.correo}</p>
            </div>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-black-85 hover:bg-light"
              onClick={() => { setOpen(false); navigate("/configuracion/usuarios"); }}
            >
              <User className="h-3.5 w-3.5" /> Mi perfil
            </button>
            <button
              className="flex w-full items-center gap-2 px-3 py-2 text-[12px] text-black-85 hover:bg-light"
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
