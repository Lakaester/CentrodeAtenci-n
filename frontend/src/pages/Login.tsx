import { useState, useEffect } from "react";
import { useNavigate, Navigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye, EyeOff, Loader2, Mail, LockKeyhole, ShieldCheck, AlertCircle,
  ArrowRight, BarChart3, Headphones, Layers, Database,
} from "lucide-react";
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

// Identidad oficial Restaurant.pe: naranja de marca, carbón y neutros del sistema.
function FullLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logos/restaurantpe-logo-2024-principal.png"
      alt="Restaurant.pe"
      className={className}
    />
  );
}

function CompactLogo({ className = "" }: { className?: string }) {
  return (
    <img
      src="/logos/restaurantpe-logo-2024-fondo-color-07.png"
      alt="Restaurant.pe"
      className={className}
    />
  );
}

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

  const loading = state === "LOADING";

  return (
    <div className="grid min-h-screen grid-cols-1 overflow-x-hidden bg-light md:grid-cols-[40%_60%] lg:grid-cols-[44%_56%]">
      {/* Panel institucional */}
      <aside className="relative hidden min-h-screen overflow-hidden border-r border-black-10 bg-white px-8 py-10 md:flex md:flex-col lg:px-14 lg:py-12">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            backgroundImage: "radial-gradient(#D8DEE0 0.8px, transparent 0.8px)",
            backgroundSize: "24px 24px",
          }}
        />
        <div className="pointer-events-none absolute -right-24 top-24 h-64 w-64 rounded-full border border-primary/15" />
        <div className="pointer-events-none absolute -bottom-28 -left-20 h-80 w-80 rounded-full bg-primary/[0.055]" />
        <div className="pointer-events-none absolute right-10 top-1/2 h-24 w-px bg-gradient-to-b from-transparent via-primary/30 to-transparent" />

        <div className="relative z-10">
          <FullLogo className="w-full max-w-[340px] -my-7 object-contain" />
          <div className="mt-1 h-1 w-12 rounded-full bg-primary-45" />
          <p className="mt-6 text-[13px] font-semibold leading-5 text-black-85">
            Centro de Operaciones de Soporte Especializado
          </p>
          <p className="mt-1 text-[12px] font-semibold tracking-[0.18em] text-primary">
            (C.O.S.E)
          </p>
          <h1 className="mt-7 max-w-lg text-[30px] font-semibold leading-[1.18] tracking-[-0.02em] text-black-85 lg:text-[38px]">
            Gestionamos y fortalecemos la operación de soporte especializado.
          </h1>

          <div className="mt-7 flex flex-wrap gap-2">
            {[
              { icon: Headphones, label: "Soporte" },
              { icon: Layers, label: "Gestión" },
              { icon: BarChart3, label: "Análisis" },
            ].map(({ icon: Icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 rounded-full border border-black-10 bg-white/70 px-3 py-1.5 text-[11px] font-medium text-black-85"
              >
                <Icon size={13} className="text-primary" /> {label}
              </span>
            ))}
          </div>
        </div>

        <div className="relative z-10 mt-auto">
          <div className="hidden max-w-md md:block">
          <div className="rounded-2xl border border-black-10 bg-white/75 p-5 shadow-[0_1px_2px_rgba(76,91,95,0.04)]">
            <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-[0.14em] text-black-25">
              <span>Operación de soporte</span>
              <BarChart3 size={16} className="text-primary" />
            </div>
            <div className="mt-5 flex h-24 items-end gap-2">
              {[34, 52, 42, 66, 57, 80, 70, 88].map((height, index) => (
                <div
                  key={index}
                  className="flex-1 rounded-t-md bg-primary-45"
                  style={{ height: `${height}%`, opacity: 0.22 + index * 0.075 }}
                />
              ))}
            </div>
            <div className="mt-4 h-px bg-black-10" />
            <div className="mt-3 flex items-center gap-2 text-[11px] text-black-45">
              <Database size={13} className="text-black-85" />
              Gestión centralizada de la operación
            </div>
          </div>
        </div>

          <div className="mt-8 text-[11px] text-black-45">
            © 2026 Restaurant.pe · C.O.S.E
          </div>
        </div>
      </aside>

      {/* Panel de acceso */}
      <main className="flex min-h-screen min-w-0 items-center justify-center px-5 py-8 sm:px-8 md:px-10 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.22, ease: "easeOut" }}
          className="w-full min-w-0 max-w-[430px]"
        >
          <div className="mb-6 flex flex-col items-center text-center md:hidden">
            <FullLogo className="w-[240px] -my-6 object-contain" />
            <p className="text-[10px] font-semibold tracking-[0.18em] text-primary">(C.O.S.E)</p>
          </div>

          <div className="rounded-2xl border border-black-10 bg-white p-6 shadow-[0_20px_60px_rgba(76,91,95,0.09)] sm:p-8">
            <div className="mb-7">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-primary-25 bg-primary-5 px-2.5 py-1 text-[11px] font-medium text-primary">
                <ShieldCheck size={13} /> Acceso seguro
              </div>
              <h2 className="mt-4 text-[28px] font-semibold tracking-[-0.025em] text-black-85 sm:text-[30px]">
                Bienvenido a C.O.S.E
              </h2>
              <p className="mt-1.5 text-[14px] leading-6 text-black-45">
                Ingresa tus credenciales para continuar.
              </p>
            </div>

            <form onSubmit={onSubmit} noValidate className="space-y-5" aria-busy={loading}>
              <div>
                <label htmlFor="email" className="mb-1.5 block text-[13px] font-medium text-black-85">
                  Correo electrónico
                </label>
                <div className="relative">
                  <Mail size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black-25" />
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    autoFocus
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={loading}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "login-error" : undefined}
                    className="h-12 w-full rounded-xl border border-black-10 bg-white pl-11 pr-3 text-[15px] text-black-85 placeholder:text-black-25 transition-colors focus:border-primary focus:outline-none disabled:bg-black-5 disabled:opacity-60"
                    placeholder="tu@restaurant.pe"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-1.5 block text-[13px] font-medium text-black-85">
                  Contraseña
                </label>
                <div className="relative">
                  <LockKeyhole size={18} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-black-25" />
                  <input
                    id="password"
                    type={showPw ? "text" : "password"}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={loading}
                    aria-invalid={Boolean(error)}
                    aria-describedby={error ? "login-error" : undefined}
                    className="h-12 w-full rounded-xl border border-black-10 bg-white pl-11 pr-12 text-[15px] text-black-85 placeholder:text-black-25 transition-colors focus:border-primary focus:outline-none disabled:bg-black-5 disabled:opacity-60"
                    placeholder="Ingresa tu contraseña"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    aria-label={showPw ? "Ocultar contraseña" : "Mostrar contraseña"}
                    aria-pressed={showPw}
                    className="absolute right-2.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-black-45 transition-colors hover:bg-light hover:text-black-85 focus:outline-none focus-visible:bg-light"
                  >
                    {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  id="login-error"
                  className="flex items-start gap-2 rounded-xl border border-danger-25 bg-danger-5 px-3.5 py-3 text-[13px] leading-5 text-danger"
                  role="alert"
                  aria-live="polite"
                >
                  <AlertCircle size={16} className="mt-0.5 shrink-0" />
                  <span>{error}</span>
                </motion.div>
              )}

              <button
                type="submit"
                disabled={loading}
                className={cn(
                  "group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-primary text-[15px] font-semibold text-white shadow-sm transition-colors",
                  "hover:bg-primary-85 focus:outline-none focus-visible:bg-primary-85 disabled:cursor-not-allowed disabled:opacity-60",
                )}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" /> Iniciando sesión…
                  </>
                ) : (
                  <>
                    Iniciar sesión
                    <ArrowRight size={17} className="text-white transition-transform group-hover:translate-x-0.5" />
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 rounded-xl border border-black-10 bg-black-5 px-4 py-3 text-[12px] leading-5 text-black-45">
              <span className="font-medium text-black-85">¿Problemas para acceder?</span>{" "}
              Si olvidaste tu contraseña, contacta al administrador.
            </div>
          </div>

          <div className="mt-6 flex flex-col items-center gap-2 text-center">
            <div className="flex items-center gap-2">
              <CompactLogo className="h-8 w-8 object-contain" />
              <span className="text-[12px] font-semibold tracking-[0.16em] text-black-85">RESTAURANT.PE</span>
            </div>
            <p className="text-[10px] text-black-45">
              Centro de Operaciones de Soporte Especializado · (C.O.S.E)
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
