import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Sparkles, Clock, Users, AlertTriangle, Bug, Target, TrendingUp, CheckCircle, Star, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";

function ClockWidget() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const horas = time.getHours();
  const saludo = horas < 12 ? "Buenos días" : horas < 18 ? "Buenas tardes" : "Buenas noches";
  const turno = horas < 12 ? "Turno Mañana" : horas < 18 ? "Turno Tarde" : "Turno Noche";
  return { saludo, time, turno };
}

const MOCK = {
  asesor: "Carlos Mendoza",
  resumen: { meta: 3, whaticket: 12, zendesk: 5, total: 20 },
  prioridades: { highTouch: 4, slaProximos: 7, ticketsEsperando: 11, casosDEV: 3 },
  resumenIA: "Hoy tienes 20 tickets pendientes. 4 son de clientes High Touch con SLA crítico. Te sugiero iniciar con el caso de Carlos Mendoza (Facturación — SLA rojo) y luego revisar los 3 tickets DEV en espera.",
  kpis: { slaAyer: 94, tiempoPromedio: "14 min", resueltos: 18, csat: 4.7 },
  objetivos: [
    { icon: CheckCircle, label: "Resolver 15 tickets", color: "text-success bg-success-5" },
    { icon: Star, label: "Mantener SLA > 90%", color: "text-warning bg-warning-5" },
    { icon: TrendingUp, label: "CSAT ≥ 4.5", color: "text-primary bg-primary-5" },
    { icon: Target, label: "Cerrar 2 casos DEV", color: "text-purple bg-purple-5" },
  ],
};

export default function Inicio() {
  const navigate = useNavigate();
  const { saludo, time, turno } = ClockWidget();

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="mx-auto flex h-full max-w-5xl flex-col justify-center gap-6 p-6 lg:p-10"
    >
      {/* Saludo */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-black-85">
            {saludo}, {MOCK.asesor}
          </h1>
          <p className="mt-1 flex items-center gap-2 text-sm text-black-45">
            <span>{time.toLocaleDateString("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}</span>
            <span className="h-1 w-1 rounded-full bg-[#CBD5E1]" />
            <Clock size={14} />
            <span>{time.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" })}</span>
            <span className="h-1 w-1 rounded-full bg-[#CBD5E1]" />
            <span className="rounded-md bg-black-5 px-2 py-0.5 text-xs font-medium text-black-45">{turno}</span>
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Columna principal */}
        <div className="space-y-6 lg:col-span-2">
          {/* Resumen del día */}
          <div className="rounded-xl border border-black-10 bg-white p-5 ">
            <h2 className="text-sm font-semibold text-black-85">Resumen del día</h2>
            <div className="mt-4 grid grid-cols-4 gap-3">
              <SummaryCard label="Meta" value={MOCK.resumen.meta} color="text-purple" bg="bg-purple-5" />
              <SummaryCard label="Whaticket" value={MOCK.resumen.whaticket} color="text-success" bg="bg-success-5" />
              <SummaryCard label="Zendesk" value={MOCK.resumen.zendesk} color="text-primary" bg="bg-primary-5" />
              <SummaryCard label="Total" value={MOCK.resumen.total} color="text-black-85" bg="bg-black-5" />
            </div>
          </div>

          {/* Prioridades */}
          <div className="rounded-xl border border-black-10 bg-white p-5 ">
            <h2 className="text-sm font-semibold text-black-85">Prioridades</h2>
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
              <PriorityCard icon={<Users size={18} />} label="High Touch" value={MOCK.prioridades.highTouch} color="text-purple" />
              <PriorityCard icon={<AlertTriangle size={18} />} label="SLA por vencer" value={MOCK.prioridades.slaProximos} color="text-danger" />
              <PriorityCard icon={<Clock size={18} />} label="Esperando" value={MOCK.prioridades.ticketsEsperando} color="text-warning" />
              <PriorityCard icon={<Bug size={18} />} label="Casos DEV" value={MOCK.prioridades.casosDEV} color="text-aqua" />
            </div>
          </div>

          {/* Resumen IA */}
          <div className="rounded-xl border border-[#2563EB]/20 bg-gradient-to-r from-[#F0F7FF] to-white p-5 ">
            <div className="flex items-start gap-3">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-10 text-primary">
                <Sparkles size={18} />
              </div>
              <div>
                <p className="text-sm font-semibold text-black-85">Resumen del día</p>
                <p className="mt-1 text-sm leading-relaxed text-black-45">{MOCK.resumenIA}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Columna derecha */}
        <div className="space-y-6">
          {/* KPIs personales */}
          <div className="rounded-xl border border-black-10 bg-white p-5 ">
            <h2 className="text-sm font-semibold text-black-85">Tus KPIs</h2>
            <div className="mt-4 space-y-3">
              <KpiRow label="SLA ayer" value={`${MOCK.kpis.slaAyer}%`} ok={MOCK.kpis.slaAyer >= 90} />
              <KpiRow label="Tiempo promedio" value={MOCK.kpis.tiempoPromedio} />
              <KpiRow label="Resueltos" value={String(MOCK.kpis.resueltos)} />
              <KpiRow label="CSAT" value={String(MOCK.kpis.csat)} ok={MOCK.kpis.csat >= 4.5} />
            </div>
          </div>

          {/* Objetivos */}
          <div className="rounded-xl border border-black-10 bg-white p-5 ">
            <h2 className="text-sm font-semibold text-black-85">Objetivos del día</h2>
            <div className="mt-4 space-y-2">
              {MOCK.objetivos.map((obj, i) => (
                <div key={i} className={cn("flex items-center gap-3 rounded-lg border border-black-10 p-3", obj.color.split(" ").slice(1).join(" "))}>
                  <div className={cn("flex h-8 w-8 items-center justify-center rounded-lg", obj.color)}>
                    <obj.icon size={16} />
                  </div>
                  <span className="text-xs font-medium text-black-85">{obj.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Botón Comenzar Jornada */}
      <div className="flex justify-center pt-2">
        <Button
          size="lg"
          variant="primary"
          className="gap-3 px-10 text-base  shadow-[#2563EB]/20"
          onClick={() => navigate("/atenciones")}
        >
          Comenzar Jornada
          <ArrowRight size={20} />
        </Button>
      </div>
    </motion.div>
  );
}

function SummaryCard({ label, value, color, bg }: { label: string; value: number; color: string; bg: string }) {
  return (
    <div className={cn("flex flex-col items-center rounded-xl p-3 text-center", bg)}>
      <span className={cn("text-2xl font-bold", color)}>{value}</span>
      <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wider text-black-45">{label}</span>
    </div>
  );
}

function PriorityCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: number; color: string }) {
  return (
    <div className="flex items-center gap-3 rounded-lg border border-black-5 p-3">
      <div className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", color.replace("text-", "bg-").replace("600", "50") + " " + color)}>
        {icon}
      </div>
      <div>
        <p className={cn("text-lg font-bold", color)}>{value}</p>
        <p className="text-[10px] text-black-45">{label}</p>
      </div>
    </div>
  );
}

function KpiRow({ label, value, ok }: { label: string; value: string; ok?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-black-45">{label}</span>
      <span className={cn("font-semibold", ok === true ? "text-success" : ok === false ? "text-danger" : "text-black-85")}>{value}</span>
    </div>
  );
}
