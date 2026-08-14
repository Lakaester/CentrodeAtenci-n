import { Link } from "react-router-dom";
import { ShieldX } from "lucide-react";

export default function Forbidden() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-light p-4 text-center">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-danger-5 text-danger">
        <ShieldX size={26} />
      </div>
      <h1 className="text-lg font-semibold text-black-85">403 — Acceso no autorizado</h1>
      <p className="mt-1 max-w-sm text-sm text-black-45">Tu usuario no tiene permisos para acceder a esta sección.</p>
      <Link to="/dashboard" className="mt-4 inline-flex items-center rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-85">
        Volver al inicio
      </Link>
    </div>
  );
}
