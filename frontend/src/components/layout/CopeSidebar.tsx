import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { LayoutDashboard, Inbox, ReceiptText, Users, BarChart3, BookOpen, Settings, LogOut, X, RefreshCcw, type LucideIcon } from "lucide-react";
import { useAuth, authService } from "@/modules/auth";

interface SidebarItem {
  path: string;
  label: string;
  icon: LucideIcon;
  modulo: string;
}

const ITEMS: SidebarItem[] = [
  { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, modulo: "Dashboard" },
  { path: "/atenciones", label: "Atenciones", icon: Inbox, modulo: "Atenciones" },
  { path: "/control-facturacion", label: "Control de Facturación", icon: ReceiptText, modulo: "Control de Facturación" },
  { path: "/quejas-devoluciones", label: "Quejas y Dev.", icon: RefreshCcw, modulo: "Quejas y Devoluciones" },
  { path: "/clientes", label: "Clientes", icon: Users, modulo: "Clientes" },
  { path: "/reportes", label: "Reportes", icon: BarChart3, modulo: "Reportes" },
  { path: "/admin/guias", label: "Conocimiento", icon: BookOpen, modulo: "Conocimiento" },
  { path: "/configuracion", label: "Configuración", icon: Settings, modulo: "Configuración" },
];

interface Props {
  mobileOpen: boolean;
  onClose: () => void;
}

export function CopeSidebar({ mobileOpen, onClose }: Props) {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Comportamiento visual: solo mostrar módulos con permiso. La seguridad real la aplica el backend.
  const visibles = ITEMS.filter((item) => authService.moduloVisible(user, item.modulo));

  const cerrarSesion = async () => {
    onClose();
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <aside
      className={[
        "fixed lg:sticky lg:top-14",
        "inset-y-0 left-0 z-50",
        "w-[72px] bg-white border-r border-black-5",
        "flex flex-col shrink-0 overflow-y-auto",
        "h-screen lg:h-[calc(100vh-3.5rem)]",
        "transition-transform duration-200",
        mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      ].join(" ")}
    >
      {/* Mobile close button */}
      <div className="lg:hidden h-14 flex items-center justify-end px-2 border-b border-black-5 shrink-0">
        <button onClick={onClose} className="p-1.5 rounded text-black-45 hover:bg-light">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Logo (escritorio) */}
      <div className="hidden lg:flex flex-col items-center justify-center border-b border-black-5 py-3 px-1 shrink-0">
        <img src="/logos/restaurantpe-logo-2024-02.png" alt="Restaurant.pe" className="h-[16px] w-auto" />
        <span className="mt-1 text-[9px] font-bold text-primary uppercase tracking-widest">COPE</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col">
        {visibles.map((item) => {
          const active = location.pathname === item.path || location.pathname.startsWith(item.path + "/");
          return (
            <div key={item.path}>
              <NavLink
                to={item.path}
                onClick={onClose}
                className={[
                  "relative flex flex-col items-center gap-1 w-full py-3 px-1 text-center transition-colors",
                  "after:absolute after:left-0 after:top-1.5 after:bottom-1.5 after:w-[3px] after:rounded-r after:transition-colors",
                  active
                    ? "bg-primary text-white after:bg-white"
                    : "text-black-45 hover:bg-light hover:text-black-85 after:bg-transparent",
                ].join(" ")}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-tight">{item.label}</span>
              </NavLink>
              <div className="mx-3 border-b border-black-5" />
            </div>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="border-t border-black-5 shrink-0">
        <button
          onClick={cerrarSesion}
          className="flex flex-col items-center gap-1 w-full py-3 px-1 text-black-45 hover:bg-danger-5 hover:text-danger transition-colors text-center"
        >
          <LogOut className="h-5 w-5" />
          <span className="text-[10px] font-medium leading-tight">Salir</span>
        </button>
      </div>
    </aside>
  );
}
