import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/modules/auth";
import { cn } from "@/lib/utils";

type LoginState = "INITIAL" | "LOADING" | "SUCCESS" | "INVALID_CREDENTIALS" | "USER_DISABLED" | "SERVER_ERROR" | "NETWORK_ERROR" | "SESSION_EXPIRED";

const MSG: Partial<Record<LoginState, string>> = {
  INVALID_CREDENTIALS: "Correo o contraseña incorrectos.",
  USER_DISABLED: "Tu usuario está desactivado. Contacta al administrador.",
  SERVER_ERROR: "No pudimos iniciar sesión. Inténtalo nuevamente.",
  NETWORK_ERROR: "No se pudo conectar con el servidor.",
  SESSION_EXPIRED: "Tu sesión ha expirado. Inicia sesión nuevamente.",
};

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [state, setState] = useState<LoginState>("INITIAL");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (params.get("expired")) {
      setState("SESSION_EXPIRED");
      setError(MSG.SESSION_EXPIRED ?? "");
    }
  }, [params]);

  // Si ya hay sesión válida, redirigir al módulo principal.
  if (user) return <Navigate to="/dashboard" replace />;

  const validar = (): string | null => {
    if (!email.trim()) return "Ingresa tu correo.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return "Ingresa un correo válido.";
    if (!password) return "Ingresa tu contraseña.";
    return null;
  };

  const onSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const v = validar();
    if (v) { setError(v); setState("SERVER_ERROR"); return; }
    setState("LOADING");
    setError(null);
    try {
      await login(email.trim(), password);
      setState("SUCCESS");
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      const kind = err?.kind as LoginState | undefined;
      const st: LoginState = kind ?? "SERVER_ERROR";
      setState(st);
      setError(MSG[st] ?? "No pudimos iniciar sesión. Inténtalo nuevamente.");
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-light p-4">
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
        className="w-full max-w-sm"
      >
        <div className="rounded-xl border border-black-10 bg-white p-8">
          <div className="mb-6 text-center">
            <img src="/logos/restaurantpe-logo-2024-02.png" alt="Restaurant.pe" className="mx-auto h-6 w-auto" />
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-primary">COPE</p>
            <h1 className="mt-4 text-base font-semibold text-black-85">Iniciar sesión</h1>
          </div>

          <form onSubmit={onSubmit} noValidate className="space-y-4">
            <div>
              <label htmlFor="email" className="mb-1 block text-[11px] font-medium text-black-45">Correo electrónico</label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={state === "LOADING"}
                aria-invalid={state === "INVALID_CREDENTIALS"}
                className="h-10 w-full rounded border border-black-10 bg-white px-3 text-sm text-black-85 placeholder:text-black-25 focus:border-primary focus:outline-none disabled:opacity-60"
                placeholder="usuario@restaurant.pe"
              />
            </div>

            <div>
              <label htmlFor="password" className="mb-1 block text-[11px] font-medium text-black-45">Contraseña</label>
              <div className="relative">
                <input
                  id="password"
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={state === "LOADING"}
                  aria-invalid={state === "INVALID_CREDENTIALS"}
                  className="h-10 w-full rounded border border-black-10 bg-white px-3 pr-10 text-sm text-black-85 placeholder:text-black-25 focus:border-primary focus:outline-none disabled:opacity-60"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-black-45 hover:text-black-65"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="rounded border border-danger-25 bg-danger-5 px-3 py-2 text-[11px] text-danger"
                role="alert"
                aria-live="polite"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={state === "LOADING"}
              className={cn(
                "flex h-10 w-full items-center justify-center gap-2 rounded bg-primary text-sm font-medium text-white transition-colors",
                "hover:bg-primary-85 disabled:opacity-60",
              )}
            >
              {state === "LOADING" ? (
                <>
                  <Loader2 size={15} className="animate-spin" /> Iniciando sesión...
                </>
              ) : (
                "Ingresar"
              )}
            </button>
          </form>

          <p className="mt-5 text-center text-[11px] text-black-45">
            ¿Problemas para acceder?{" "}
            <span className="text-black-85">Si olvidaste tu contraseña, contacta al administrador.</span>
          </p>
        </div>
      </motion.div>
    </div>
  );
}
