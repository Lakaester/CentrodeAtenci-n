import { Navigate, useLocation } from "react-router-dom";
import { useAuth, authService } from "@/modules/auth";

export function ProtectedRoute({ children, modulo, submodulos }: {
  children: React.ReactNode;
  modulo?: string;
  submodulos?: string[];
}) {
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

  // Check parent module access
  if (modulo && !authService.moduloVisible(user, modulo)) {
    return <Navigate to="/403" replace />;
  }

  // Check if user has access to at least one submodule
  if (submodulos && submodulos.length > 0) {
    const hasAccess = submodulos.some((sub) => authService.moduloVisible(user, sub));
    if (!hasAccess) {
      return <Navigate to="/403" replace />;
    }
  }

  return <>{children}</>;
}
