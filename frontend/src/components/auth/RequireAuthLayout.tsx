import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/modules/auth";

/**
 * Envuelve la aplicación COPE completa: sin sesión → /login.
 * La autorización por módulo se aplica con rutas protegidas específicas.
 */
export function RequireAuthLayout() {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-light">
        <div className="text-[12px] text-black-25">Cargando…</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />;
  }

  return <Outlet />;
}
