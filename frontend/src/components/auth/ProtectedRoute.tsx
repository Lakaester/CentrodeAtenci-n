import { Navigate, useLocation } from "react-router-dom";
import { useAuth, authService } from "@/modules/auth";

export function ProtectedRoute({ children, modulo }: { children: React.ReactNode; modulo?: string }) {
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

  if (modulo && !authService.moduloVisible(user, modulo)) {
    return <Navigate to="/403" replace />;
  }

  return <>{children}</>;
}
