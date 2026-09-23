import { useState, useMemo, useEffect } from "react";
import { Plus, CalendarClock, Clock, CheckCircle2, XCircle, X, ChevronLeft, ChevronRight, PlayCircle, Download, Timer, ExternalLink, RefreshCw, FileText, Save, Video } from "lucide-react";
import {
  useAgendaLista, useAgendaDetalle, useAgendaKpis, useAgendaCrear, useAgendaActualizar,
  useAgendaActualizarEstado, useApoyoAsesores, useAgendaExportar,
  useAgendaRegistrarInicioReal, useAgendaRegistrarFinReal,
  useAgendaSetResultado,
  useAgendaSincronizarCalendar, useAgendaReintentarSyncCalendar,
  useGoogleCalendarStatus, useGoogleCalendarConnect, useGoogleCalendarDisconnect,
  useGoogleCalendarInfo, useVerificarDisponibilidad,
  type Agenda, type CrearAgendaInput,
} from "@/modules/gestion";
import { KpiCard } from "@/components/ui/KpiCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { Input, Select, Textarea } from "@/components/ui/Input";
import { useAuth, authService } from "@/modules/auth";
import { normalizeDomain } from "@/domain/normalizacion";
import { ActaForm } from "./ActaForm";

const ESTADO_BADGE: Record<string, "warning" | "primary" | "success" | "danger"> = {
  PENDIENTE: "warning",
  ACTIVA: "primary",
  FINALIZADA: "success",
  CANCELADA: "danger",
};

const RESULTADO_BADGE: Record<string, "success" | "danger" | "warning"> = {
  REALIZADA: "success",
  SIN_REALIZAR: "danger",
  CANCELADA: "warning",
};

const RESULTADO_LABEL: Record<string, string> = {
  REALIZADA: "Realizada",
  SIN_REALIZAR: "Sin realizar",
  CANCELADA: "Cancelada",
};

const TIPO_LABEL: Record<string, string> = {
  REUNION: "Reunión",
  CAPACITACION: "Capacitación",
};

/** Transiciones permitidas desde cada estado */
const TRANSICIONES: Record<string, { label: string; next: string; variant: "success" | "danger" | "outline"; icon: React.ElementType }[]> = {
  PENDIENTE: [
    { label: "Iniciar", next: "ACTIVA", variant: "success", icon: PlayCircle },
    { label: "Cancelar", next: "CANCELADA", variant: "danger", icon: XCircle },
  ],
  ACTIVA: [
    { label: "Finalizar", next: "FINALIZADA", variant: "success", icon: CheckCircle2 },
    { label: "Cancelar", next: "CANCELADA", variant: "danger", icon: XCircle },
  ],
};

function fmtHora(v: string): string {
  if (!v) return "—";
  if (v.includes("T")) {
    const m = v.match(/T(\d{2}):(\d{2})/);
    return m ? `${m[1]}:${m[2]}` : v;
  }
  const parts = v.split(":");
  return `${parts[0]}:${parts[1]}`;
}

function extractDate(v: string): string {
  if (!v) return "";
  if (v.includes("T")) return v.split("T")[0];
  return v;
}

function extractTime(v: string): string {
  if (!v) return "";
  if (v.includes("T")) {
    const m = v.match(/T(\d{2}:\d{2})/);
    return m ? m[1] : "";
  }
  return v.substring(0, 5);
}

function fmtFecha(v: string): string {
  if (!v) return "—";
  const d = new Date(extractDate(v) + "T00:00:00");
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" });
}

function fmtDuracion(min: number | null): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}min`;
}

function getWeekRange(refDate: Date): { desde: string; hasta: string; label: string } {
  const d = new Date(refDate);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d);
  monday.setDate(diff);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  const fmt = (dt: Date) => dt.toISOString().split("T")[0];
  const label = `${monday.toLocaleDateString("es-PE", { day: "2-digit", month: "short" })} – ${sunday.toLocaleDateString("es-PE", { day: "2-digit", month: "short", year: "numeric" })}`;
  return { desde: fmt(monday), hasta: fmt(sunday), label };
}

/** Genera las horas de 09:00 a 23:00 */
const HORAS_CALendARIO = Array.from({ length: 15 }, (_, i) => {
  const h = 9 + i;
  return `${String(h).padStart(2, "0")}:00`;
});

const ESTADO_CALENDARIO_CLASES: Record<string, string> = {
  PENDIENTE: "bg-light hover:bg-primary-5 border-black-5",
  ACTIVA: "bg-success-10 hover:bg-success-25 border-success-25",
  CANCELADA: "bg-warning-10 hover:bg-warning-25 border-warning-25",
};

function CalendarView({ agendas, onVerDetalle }: { agendas: Agenda[]; onVerDetalle: (a: Agenda) => void }) {
  const [refDate, setRefDate] = useState(() => new Date());
  const week = useMemo(() => getWeekRange(refDate), [refDate]);

  const dias = useMemo(() => {
    const result: { fecha: string; label: string; agendas: Agenda[] }[][] = [[], []];
    const d = new Date(week.desde + "T00:00:00");
    for (let i = 0; i < 7; i++) {
      const fecha = d.toISOString().split("T")[0];
      const label = d.toLocaleDateString("es-PE", { weekday: "short", day: "2-digit", month: "short" });
      const diaAgendas = agendas.filter((a) => a.fecha === fecha).sort((a, b) => a.hora_inicio.localeCompare(b.hora_inicio));
      result[0].push({ fecha, label, agendas: diaAgendas });
      result[1].push({ fecha, label, agendas: diaAgendas });
      d.setDate(d.getDate() + 1);
    }
    return result[0];
  }, [week, agendas]);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <button onClick={() => setRefDate((d) => { const n = new Date(d); n.setDate(n.getDate() - 7); return n; })} className="p-1 rounded hover:bg-light text-black-45 hover:text-black-85">
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs font-medium text-black-85">{week.label}</span>
          <button onClick={() => setRefDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 7); return n; })} className="p-1 rounded hover:bg-light text-black-45 hover:text-black-85">
            <ChevronRight size={16} />
          </button>
        </div>
        <Button variant="ghost" size="sm" onClick={() => setRefDate(new Date())}>Hoy</Button>
      </div>

      {/* Grid de horas: 09:00 a 23:00 */}
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Header: días */}
          <div className="grid grid-cols-[60px_repeat(7,1fr)] gap-px bg-black-5 border border-black-5 rounded-t">
            <div className="bg-light px-1 py-2 text-[9px] font-medium text-black-45" />
            {dias.map((dia) => (
              <div key={dia.fecha} className="bg-light px-1 py-2 text-center text-[10px] font-semibold text-black-85">
                {dia.label}
              </div>
            ))}
          </div>

          {/* Body: franjas horarias */}
          <div className="border-x border-b border-black-5 rounded-b">
            {HORAS_CALendARIO.map((hora) => (
              <div key={hora} className="grid grid-cols-[60px_repeat(7,1fr)] gap-px border-b border-black-5 last:border-b-0">
                <div className="bg-light/50 px-1 py-2 text-[9px] font-medium text-black-45 text-right tabular-nums">
                  {hora}
                </div>
                {dias.map((dia) => {
                  const eventos = dia.agendas.filter((a) => a.hora_inicio.substring(0, 5) === hora);
                  return (
                    <div key={`${dia.fecha}-${hora}`} className="bg-white px-0.5 py-1 min-h-[28px]">
                      {eventos.map((a) => (
                        <button
                          key={a.id}
                          onClick={() => onVerDetalle(a)}
                          className={`w-full text-left p-1 rounded text-[9px] border transition-colors mb-0.5 ${ESTADO_CALENDARIO_CLASES[a.estado] ?? "bg-light hover:bg-primary-5 border-black-5"}`}
                        >
                          <div className="font-medium text-black-85 truncate">{fmtHora(a.hora_inicio)}–{fmtHora(a.hora_fin)}</div>
                          <div className="text-black-45 truncate">{a.asesor_nombre}</div>
                          <div className="truncate" style={{ color: a.estado === "CANCELADA" ? "var(--color-danger)" : a.estado === "FINALIZADA" ? "var(--color-success)" : undefined }}>
                            {TIPO_LABEL[a.tipo]}
                          </div>
                        </button>
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function FormularioAgenda({ onCancelar, onGuardar, initial }: {
  onCancelar: () => void;
  onGuardar: (input: CrearAgendaInput) => void;
  initial?: Agenda;
}) {
  const { data: asesoresData } = useApoyoAsesores();
  const asesores = asesoresData?.data ?? [];

  const [form, setForm] = useState<CrearAgendaInput>({
    tipo: initial?.tipo ?? "REUNION",
    asesorId: initial?.asesor_id ?? "",
    asesorNombre: initial?.asesor_nombre ?? "",
    asesorCorreo: initial?.asesor_correo ?? "",
    dominio: initial?.dominio ?? "",
    clienteNombre: initial?.cliente_nombre ?? "",
    clienteNumero: initial?.cliente_numero ?? "",
    fecha: initial?.fecha ?? new Date().toISOString().split("T")[0],
    horaInicio: initial?.hora_inicio ?? "09:00",
    horaFin: initial?.hora_fin ?? "10:00",
    estado: initial?.estado ?? "PENDIENTE",
    descripcion: initial?.descripcion ?? "",
  });

  const set = (k: keyof CrearAgendaInput, v: any) => setForm((f) => ({ ...f, [k]: v }));

  // Disponibilidad: construir rango y consultar
  const dispDesde = form.fecha && form.horaInicio ? `${form.fecha}T${form.horaInicio}:00-05:00` : "";
  const dispHasta = form.fecha && form.horaFin ? `${form.fecha}T${form.horaFin}:00-05:00` : "";
  const { data: dispData, isLoading: dispLoading } = useVerificarDisponibilidad(
    dispDesde && dispHasta && dispDesde < dispHasta ? dispDesde : "",
    dispDesde && dispHasta && dispDesde < dispHasta ? dispHasta : ""
  );
  const busySlots = dispData?.data?.busy ?? [];
  const horarioDisponible = busySlots.length === 0;
  const showDisponibilidad = Boolean(dispDesde && dispHasta && dispDesde < dispHasta && !dispLoading);

  const seleccionarAsesor = (asesorId: string) => {
    const a = asesores.find((x) => x.id === asesorId);
    if (a) {
      set("asesorId", a.id);
      set("asesorNombre", [a.nombre, a.apellido].filter(Boolean).join(" "));
      set("asesorCorreo", a.email);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-black-10 px-5 py-4">
          <h3 className="text-sm font-semibold text-black-85">{initial ? "Editar Agenda" : "Nueva Agenda"}</h3>
          <button onClick={onCancelar} className="text-black-45 hover:text-black-85"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Tipo *</label>
              <Select
                options={[
                  { value: "REUNION", label: "Reunión" },
                  { value: "CAPACITACION", label: "Capacitación" },
                ]}
                value={form.tipo}
                onChange={(e) => set("tipo", e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Fecha *</label>
              <Input type="date" value={form.fecha} onChange={(e) => set("fecha", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Asesor *</label>
              <Select
                options={[{ value: "", label: "Seleccionar..." }, ...asesores.map((a) => ({ value: a.id, label: [a.nombre, a.apellido].filter(Boolean).join(" ") }))]}
                value={form.asesorId}
                onChange={(e) => seleccionarAsesor(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Hora inicio *</label>
              <Input type="time" value={form.horaInicio} onChange={(e) => set("horaInicio", e.target.value)} />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Hora fin *</label>
              <Input type="time" value={form.horaFin} onChange={(e) => set("horaFin", e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Dominio</label>
              <Input value={form.dominio ?? ""} onChange={(e) => set("dominio", e.target.value)} placeholder="ej: restaurant.pe" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] font-medium text-black-45">Cliente</label>
              <Input value={form.clienteNombre ?? ""} onChange={(e) => set("clienteNombre", e.target.value)} />
            </div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-black-45">Teléfono cliente</label>
            <Input value={form.clienteNumero ?? ""} onChange={(e) => set("clienteNumero", e.target.value)} />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[10px] font-medium text-black-45">Descripción</label>
            <Textarea value={form.descripcion ?? ""} onChange={(e) => set("descripcion", e.target.value)} rows={3} />
          </div>

          <div className="rounded bg-light p-3 text-[10px] text-black-45 space-y-1">
            <p><strong className="text-black-65">Google Calendar:</strong> La agenda se sincronizará automáticamente al crear/editar.</p>
          </div>

          {/* Disponibilidad */}
          {showDisponibilidad && (
            <div className={`text-[10px] px-2 py-1 rounded ${horarioDisponible ? "text-success bg-success-5" : "text-danger bg-danger-5"}`}>
              {dispLoading ? (
                "Verificando disponibilidad..."
              ) : horarioDisponible ? (
                "Horario disponible"
              ) : (
                "El horario seleccionado no está disponible."
              )}
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-black-10 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onCancelar}>Cancelar</Button>
          <Button
            size="sm"
            onClick={() => {
              if (!form.fecha || !form.horaInicio || !form.horaFin || !form.asesorId) return;
              onGuardar({ ...form, dominio: form.dominio ? normalizeDomain(form.dominio) : null });
            }}
            disabled={!form.fecha || !form.horaInicio || !form.horaFin || !form.asesorId || (showDisponibilidad && !horarioDisponible)}
          >
            {initial ? "Guardar cambios" : "Crear"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function DetalleAgenda({ agenda: agendaInitial, onCerrar, onEditar, onVerActa }: {
  agenda: Agenda;
  onCerrar: () => void;
  onEditar: (a: Agenda) => void;
  onVerActa: (a: Agenda) => void;
}) {
  const { user } = useAuth();
  const puedeEditar = authService.hasPermiso(user, "Agendas", "editar");
  const { data: agendaLive } = useAgendaDetalle(agendaInitial.id);
  const agenda = agendaLive?.data ?? agendaInitial;
  const estadoMut = useAgendaActualizarEstado();
  const editarMut = useAgendaActualizar();
  const registrarInicio = useAgendaRegistrarInicioReal();
  const registrarFin = useAgendaRegistrarFinReal();
  const setResultadoMut = useAgendaSetResultado();
  const syncCalendarMut = useAgendaSincronizarCalendar();
  const retrySyncMut = useAgendaReintentarSyncCalendar();
  const transiciones = TRANSICIONES[agenda.estado] ?? [];

  const [horaInicioReal, setHoraInicioReal] = useState(agenda.hora_inicio_real ?? agenda.hora_inicio);
  const [horaFinReal, setHoraFinReal] = useState(agenda.hora_fin_real ?? agenda.hora_fin);
  const [errorTiempoReal, setErrorTiempoReal] = useState<string | null>(null);
  const [editandoGrabacion, setEditandoGrabacion] = useState(false);
  const [grabacionInput, setGrabacionInput] = useState(agenda.grabacion_url ?? "");

  const puedeRegistrarTiempoReal = agenda.estado === "ACTIVA" || (agenda.estado === "PENDIENTE" && !agenda.hora_inicio_real);
  const tieneInicioReal = Boolean(agenda.hora_inicio_real);
  const tieneFinReal = Boolean(agenda.hora_fin_real);

  const handleRegistrarInicioReal = () => {
    setErrorTiempoReal(null);
    registrarInicio.mutate(
      { id: agenda.id, hora: horaInicioReal },
      {
        onError: (e: any) => setErrorTiempoReal(e?.message ?? "Error al registrar inicio real"),
      }
    );
  };

  const handleRegistrarFinReal = () => {
    setErrorTiempoReal(null);
    if (horaFinReal <= agenda.hora_inicio_real!) {
      setErrorTiempoReal("La hora fin real debe ser posterior a la hora inicio real");
      return;
    }
    registrarFin.mutate(
      { id: agenda.id, hora: horaFinReal },
      {
        onError: (e: any) => setErrorTiempoReal(e?.message ?? "Error al registrar fin real"),
      }
    );
  };

  const guardarGrabacion = () => {
    const trimmed = grabacionInput.trim();
    if (trimmed && !/^https?:\/\/.+/.test(trimmed)) {
      setErrorTiempoReal("URL inválida. Debe comenzar con http:// o https://");
      return;
    }
    setErrorTiempoReal(null);
    editarMut.mutate(
      { id: agenda.id, input: { grabacionUrl: trimmed || null } },
      {
        onSuccess: () => setEditandoGrabacion(false),
        onError: (e: any) => setErrorTiempoReal(e?.message ?? "Error al guardar grabación"),
      }
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-black-10 px-5 py-4">
          <h3 className="text-sm font-semibold text-black-85">Detalle de Agenda</h3>
          <div className="flex items-center gap-2">
            {puedeEditar && (
              <Button variant="outline" size="sm" onClick={() => { onCerrar(); onEditar(agenda); }}>
                Editar agenda
              </Button>
            )}
            <button onClick={onCerrar} className="text-black-45 hover:text-black-85"><X size={18} /></button>
          </div>
        </div>
        <div className="px-5 py-4 space-y-3">
          <div className="grid grid-cols-2 gap-3 text-xs">
            <div><span className="text-black-45">Tipo:</span> <span className="font-medium">{TIPO_LABEL[agenda.tipo]}</span></div>
            <div><span className="text-black-45">Estado:</span> <Badge variant={ESTADO_BADGE[agenda.estado]}>{agenda.estado}</Badge></div>
            <div>
              <span className="text-black-45">Resultado:</span>{" "}
              {agenda.resultado ? (
                <Badge variant={RESULTADO_BADGE[agenda.resultado]}>{RESULTADO_LABEL[agenda.resultado]}</Badge>
              ) : (
                <span className="text-black-45 font-medium">—</span>
              )}
            </div>
            <div><span className="text-black-45">Fecha:</span> <span className="font-medium">{fmtFecha(agenda.fecha)}</span></div>
            <div><span className="text-black-45">Ticket:</span> <span className="font-medium font-mono">{agenda.ticket}</span></div>
            <div><span className="text-black-45">Asesor:</span> <span className="font-medium">{agenda.asesor_nombre}</span></div>
            {agenda.dominio && <div><span className="text-black-45">Dominio:</span> <span className="font-medium">{agenda.dominio}</span></div>}
            {agenda.cliente_nombre && <div><span className="text-black-45">Cliente:</span> <span className="font-medium">{agenda.cliente_nombre}</span></div>}
          </div>

          {/* Horario programado */}
          <div className="rounded bg-light p-3 text-xs space-y-1">
            <div className="font-medium text-black-65 flex items-center gap-1.5">
              <Clock size={12} /> Horario programado
            </div>
            <div className="flex items-center gap-2 tabular-nums">
              <span>{fmtHora(agenda.hora_inicio)} – {fmtHora(agenda.hora_fin)}</span>
              <span className="text-black-45">({fmtDuracion(agenda.duracion_min)})</span>
            </div>
          </div>

          {/* Tiempo real */}
          <div className="rounded border border-black-10 p-3 text-xs space-y-2">
            <div className="font-medium text-black-65 flex items-center gap-1.5">
              <Timer size={12} /> Tiempo real
            </div>

            {tieneInicioReal && tieneFinReal ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-black-45">Inicio:</span>
                  <span className="font-medium">{fmtHora(agenda.hora_inicio_real!)}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-black-45">Fin:</span>
                  <span className="font-medium">{fmtHora(agenda.hora_fin_real!)}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums font-semibold text-primary">
                  <span>Duración real:</span>
                  <span>{fmtDuracion(agenda.duracion_real_min)}</span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {!tieneInicioReal ? (
                  <div className="flex items-center gap-2">
                    <label className="text-black-45 w-12">Inicio:</label>
                    <Input
                      type="time"
                      value={horaInicioReal}
                      onChange={(e) => setHoraInicioReal(e.target.value)}
                      className="h-7 text-xs w-[110px]"
                      disabled={!puedeRegistrarTiempoReal || !puedeEditar}
                    />
                    {puedeRegistrarTiempoReal && puedeEditar && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={handleRegistrarInicioReal}
                        disabled={registrarInicio.isPending || !horaInicioReal}
                      >
                        {registrarInicio.isPending ? "..." : "Registrar"}
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2 tabular-nums">
                    <span className="text-black-45 w-12">Inicio:</span>
                    <span className="font-medium">{fmtHora(agenda.hora_inicio_real!)}</span>
                    <CheckCircle2 size={12} className="text-success" />
                  </div>
                )}

                {tieneInicioReal && !tieneFinReal && (
                  <div className="flex items-center gap-2">
                    <label className="text-black-45 w-12">Fin:</label>
                    <Input
                      type="time"
                      value={horaFinReal}
                      onChange={(e) => setHoraFinReal(e.target.value)}
                      className="h-7 text-xs w-[110px]"
                      disabled={!puedeEditar}
                    />
                    {puedeEditar && (
                      <Button
                        size="sm"
                        variant="success"
                        onClick={handleRegistrarFinReal}
                        disabled={registrarFin.isPending || !horaFinReal}
                      >
                        {registrarFin.isPending ? "..." : "Registrar"}
                      </Button>
                    )}
                  </div>
                )}

                {tieneInicioReal && !tieneFinReal && (
                  <div className="text-[10px] text-black-45">
                    Fin real pendiente de registrar
                  </div>
                )}
              </div>
            )}

            {errorTiempoReal && (
              <div className="text-[10px] text-danger bg-danger-5 px-2 py-1 rounded">
                {errorTiempoReal}
              </div>
            )}
          </div>

          {/* Resultado — selector manual para agendas finalizadas/canceladas */}
          {(agenda.estado === "FINALIZADA" || agenda.estado === "CANCELADA") && puedeEditar && (
            <div className="rounded border border-black-10 p-3 text-xs space-y-2">
              <div className="font-medium text-black-65">Resultado</div>
              {agenda.estado === "FINALIZADA" ? (
                <div className="flex items-center gap-2">
                  <span className="text-black-45">Marcar como:</span>
                  <Button
                    size="sm"
                    variant={agenda.resultado === "REALIZADA" ? "success" : "outline"}
                    onClick={() => setResultadoMut.mutate({ id: agenda.id, resultado: "REALIZADA" })}
                    disabled={setResultadoMut.isPending || agenda.resultado === "REALIZADA"}
                  >
                    Realizada
                  </Button>
                  <Button
                    size="sm"
                    variant={agenda.resultado === "SIN_REALIZAR" ? "danger" : "outline"}
                    onClick={() => setResultadoMut.mutate({ id: agenda.id, resultado: "SIN_REALIZAR" })}
                    disabled={setResultadoMut.isPending || agenda.resultado === "SIN_REALIZAR"}
                  >
                    Sin realizar
                  </Button>
                </div>
              ) : (
                <div className="text-[10px] text-black-45">
                  Resultado: <Badge variant="warning">CANCELADA</Badge> (asignado automáticamente)
                </div>
              )}
            </div>
          )}

          {agenda.descripcion && (
            <div className="text-xs">
              <span className="text-black-45">Descripción:</span>
              <p className="mt-1 text-black-85">{agenda.descripcion}</p>
            </div>
          )}

          {/* Grabación */}
          <div className="rounded border border-black-10 p-3 text-xs space-y-2">
            <div className="font-medium text-black-65 flex items-center gap-1.5">
              <Video size={12} /> Grabación
            </div>
            {editandoGrabacion ? (
              <div className="space-y-2">
                <label className="mb-0.5 block text-[10px] font-medium text-black-45">URL de grabación</label>
                <Input
                  value={grabacionInput}
                  onChange={(e) => setGrabacionInput(e.target.value)}
                  placeholder="https://..."
                />
                {errorTiempoReal && (
                  <div className="text-[10px] text-danger bg-danger-5 px-2 py-1 rounded">{errorTiempoReal}</div>
                )}
                <div className="flex gap-2">
                  <Button size="sm" onClick={guardarGrabacion} disabled={editarMut.isPending}>
                    <Save size={12} /> {editarMut.isPending ? "Guardando..." : "Guardar"}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => { setEditandoGrabacion(false); setGrabacionInput(agenda.grabacion_url ?? ""); setErrorTiempoReal(null); }}>
                    Cancelar
                  </Button>
                </div>
              </div>
            ) : agenda.grabacion_url ? (
              <div className="space-y-1.5">
                <a href={agenda.grabacion_url} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">{agenda.grabacion_url}</a>
                <div className="flex gap-2">
                  {puedeEditar && (
                    <Button size="sm" variant="outline" onClick={() => { setEditandoGrabacion(true); setGrabacionInput(agenda.grabacion_url ?? ""); }}>
                      Editar URL
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => window.open(agenda.grabacion_url!, "_blank")}>
                    <ExternalLink size={12} /> Ver grabación
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <span className="text-black-45">No hay grabación registrada</span>
                {puedeEditar && (
                  <Button size="sm" variant="outline" onClick={() => setEditandoGrabacion(true)}>
                    <Plus size={12} /> Agregar URL
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Google Calendar — Sincronización */}
          <div className="rounded border border-black-10 p-3 text-xs space-y-2">
            <div className="font-medium text-black-65 flex items-center gap-1.5">
              <CalendarClock size={12} /> Google Calendar
            </div>
            {agenda.calendar_sync_status === "SYNCED" && agenda.calendar_event_id ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Badge variant="success">Sincronizado</Badge>
                  {agenda.calendar_html_link ? (
                    <a
                      href={agenda.calendar_html_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline flex items-center gap-1"
                    >
                      Ver en Calendar <ExternalLink size={10} />
                    </a>
                  ) : (
                    <span className="text-black-45 text-[10px]">Enlace de Google Calendar no disponible</span>
                  )}
                  {agenda.calendar_meet_link && (
                    <a
                      href={agenda.calendar_meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline flex items-center gap-1"
                    >
                      Abrir Google Meet <ExternalLink size={10} />
                    </a>
                  )}
                  {puedeEditar && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => syncCalendarMut.mutate(agenda.id)}
                      disabled={syncCalendarMut.isPending}
                    >
                      <RefreshCw size={12} className={syncCalendarMut.isPending ? "animate-spin" : ""} /> Actualizar
                    </Button>
                  )}
                </div>
              </div>
            ) : agenda.calendar_sync_status === "ERROR" ? (
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="danger">Error de sincronización</Badge>
                  {puedeEditar && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => retrySyncMut.mutate(agenda.id)}
                      disabled={retrySyncMut.isPending}
                    >
                      <RefreshCw size={12} className={retrySyncMut.isPending ? "animate-spin" : ""} /> Reintentar
                    </Button>
                  )}
                </div>
                {agenda.calendar_sync_error && (
                  <div className="text-[10px] text-danger bg-danger-5 px-2 py-1 rounded">
                    {agenda.calendar_sync_error}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-black-45">No sincronizado</span>
                {puedeEditar && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => syncCalendarMut.mutate(agenda.id)}
                    disabled={syncCalendarMut.isPending || agenda.estado === "CANCELADA"}
                  >
                    <CalendarClock size={12} /> {syncCalendarMut.isPending ? "Sincronizando..." : "Crear en Google Calendar"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Actas */}
          <div className="rounded border border-black-10 p-3 text-xs space-y-2">
            <div className="font-medium text-black-65 flex items-center gap-1.5">
              <FileText size={12} /> Acta de Atención
            </div>
            {agenda.acta_estado === "FINALIZADA" ? (
              <div className="flex items-center gap-2">
                <Badge variant="success">FINALIZADA</Badge>
                <Button size="sm" variant="outline" onClick={() => onVerActa(agenda)}>
                  Ver acta
                </Button>
                {agenda.acta_nombre && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(`/api/gestion/agendas/${agenda.id}/acta/pdf`, "_blank")}
                  >
                    <Download size={12} /> Descargar PDF
                  </Button>
                )}
              </div>
            ) : agenda.acta_estado === "BORRADOR" ? (
              <div className="flex items-center gap-2">
                <Badge variant="warning">BORRADOR</Badge>
                <Button size="sm" variant="outline" onClick={() => onVerActa(agenda)}>
                  Continuar acta
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-black-45">Sin acta</span>
                <Button size="sm" variant="outline" onClick={() => onVerActa(agenda)}>
                  Generar acta
                </Button>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-2 border-t border-black-10">
            {puedeEditar && transiciones.map((t) => {
              const Icon = t.icon;
              return (
                <Button
                  key={t.next}
                  variant={t.variant}
                  size="sm"
                  disabled={estadoMut.isPending}
                  onClick={() => estadoMut.mutate({ id: agenda.id, estado: t.next })}
                >
                  <Icon size={14} /> {t.label}
                </Button>
              );
            })}
            {puedeEditar && (
              <Button variant="outline" size="sm" onClick={() => { onCerrar(); onEditar(agenda); }}>
                Editar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AgendasPage() {
  const { user } = useAuth();
  const puedeCrear = authService.hasPermiso(user, "Agendas", "crear");
  const puedeExportar = authService.hasPermiso(user, "Agendas", "exportar");
  const puedeAdministrar = authService.hasPermiso(user, "Agendas", "administrar");

  // Google Calendar OAuth
  const { data: gcStatusData } = useGoogleCalendarStatus();
  const { data: gcInfoData } = useGoogleCalendarInfo();
  const connectMut = useGoogleCalendarConnect();
  const disconnectMut = useGoogleCalendarDisconnect();
  const gcStatus = gcStatusData?.data;
  const gcInfo = gcInfoData?.data;

  // Manejar redirect de OAuth callback
  const [oauthMsg, setOauthMsg] = useState<string | null>(null);
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const gc = params.get("google_calendar");
    if (gc === "connected") {
      setOauthMsg("Google Calendar conectado correctamente.");
      window.history.replaceState({}, "", window.location.pathname);
    } else if (gc === "error") {
      setOauthMsg(`Error al conectar: ${params.get("message") ?? "desconocido"}`);
      window.history.replaceState({}, "", window.location.pathname);
    }
  }, []);

  const handleConnect = async () => {
    try {
      const res = await connectMut.mutateAsync();
      window.location.href = res.data.authUrl;
    } catch {
      setOauthMsg("Error al iniciar conexión con Google Calendar.");
    }
  };

  const [filtros] = useState<Record<string, string>>({
    desde: new Date().toISOString().split("T")[0],
    hasta: "",
    estado: "",
    tipo: "",
  });
  const [misAgendas, setMisAgendas] = useState(!puedeAdministrar);

  const queryFiltros = useMemo(() => ({
    ...filtros,
    ...(misAgendas ? { misAgendas: "true" } : {}),
  }), [filtros, misAgendas]);

  const { data: kpisData } = useAgendaKpis();
  const { data: listData } = useAgendaLista(queryFiltros);
  const crear = useAgendaCrear();
  const editar = useAgendaActualizar();
  const exportarMut = useAgendaExportar();
  const [errorExport, setErrorExport] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [editando, setEditando] = useState<Agenda | null>(null);
  const [verDetalle, setVerDetalle] = useState<Agenda | null>(null);
  const [verActa, setVerActa] = useState<Agenda | null>(null);

  const kpis = kpisData?.data ?? { total: 0, pendientes: 0, activas: 0, finalizadas: 0, canceladas: 0 };
  const agendas = useMemo(() => (listData?.data ?? []).map((a) => ({
    ...a,
    fecha: extractDate(a.fecha),
    hora_inicio: extractTime(a.hora_inicio),
    hora_fin: extractTime(a.hora_fin),
  })), [listData]);

  const descargarExcel = async () => {
    setErrorExport(null);
    try {
      const filtrosExport: Record<string, string | undefined> = {};
      if (misAgendas) filtrosExport.asesorId = user?.id;
      const res = await exportarMut.mutateAsync(filtrosExport);
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = res.nombre;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e: any) {
      setErrorExport(e?.message ?? "Error al exportar");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-black-85">Agendas</h2>
        <div className="flex items-center gap-2">
          {puedeExportar && (
            <Button
              size="sm"
              variant="ghost"
              onClick={descargarExcel}
              disabled={exportarMut.isPending}
            >
              <Download size={14} /> {exportarMut.isPending ? "Exportando..." : "Descargar Excel"}
            </Button>
          )}
          <Button
            variant={misAgendas ? "primary" : "ghost"}
            size="sm"
            onClick={() => setMisAgendas(!misAgendas)}
          >
            Mis Agendas
          </Button>
          {puedeCrear && (
            <Button size="sm" onClick={() => { setEditando(null); setShowForm(true); }}>
              <Plus size={14} /> Nueva Agenda
            </Button>
          )}
        </div>
      </div>
      {errorExport && (
        <div className="text-xs text-danger bg-danger-5 px-3 py-2 rounded">
          {errorExport}
        </div>
      )}
      {oauthMsg && (
        <div className={`text-xs px-3 py-2 rounded ${oauthMsg.startsWith("Error") ? "text-danger bg-danger-5" : "text-success bg-success-5"}`}>
          {oauthMsg}
        </div>
      )}

      {/* Google Calendar — Estado de conexión */}
      {gcStatus && (
        <div className="flex items-center gap-3 rounded border border-black-10 px-4 py-2.5 text-xs">
          <CalendarClock size={14} className="text-black-45" />
          <span className="font-medium text-black-65">Google Calendar</span>
          {gcStatus.connected ? (
            <Badge variant="success">Conectado</Badge>
          ) : (
            <Badge variant="warning">No conectado</Badge>
          )}
          {gcInfo && gcStatus.connected && (
            <span className="text-[10px] text-black-45">
              Calendario: {gcInfo.summary ?? gcInfo.calendarId} · TZ: {gcInfo.timezone}
            </span>
          )}
          {gcStatus.configured ? (
            gcStatus.connected ? (
              <Button
                size="sm"
                variant="outline"
                onClick={() => disconnectMut.mutate()}
                disabled={disconnectMut.isPending}
              >
                Desconectar
              </Button>
            ) : (
              <Button
                size="sm"
                variant="primary"
                onClick={handleConnect}
                disabled={connectMut.isPending}
              >
                Conectar cuenta central
              </Button>
            )
          ) : (
            <span className="text-[10px] text-black-45">
              (Configurar GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET en el backend)
            </span>
          )}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <KpiCard icon={<CalendarClock size={16} />} value={String(kpis.total)} label="Total" />
        <KpiCard icon={<Clock size={16} />} value={String(kpis.pendientes)} label="Pendientes" />
        <KpiCard icon={<PlayCircle size={16} />} value={String(kpis.activas)} label="Activas" />
        <KpiCard icon={<CheckCircle2 size={16} />} value={String(kpis.finalizadas)} label="Finalizadas" />
        <KpiCard icon={<XCircle size={16} />} value={String(kpis.canceladas)} label="Canceladas" />
      </div>

      <Card>
        <CardHeader title="Calendario — 09:00 a 23:00" icon={<CalendarClock size={16} />} />
        <CardBody>
          <CalendarView agendas={agendas} onVerDetalle={setVerDetalle} />
        </CardBody>
      </Card>

      {showForm && (
        <FormularioAgenda
          initial={editando ?? undefined}
          onCancelar={() => { setShowForm(false); setEditando(null); }}
          onGuardar={(input) => {
            if (editando) {
              editar.mutate({ id: editando.id, input }, { onSuccess: () => { setShowForm(false); setEditando(null); } });
            } else {
              crear.mutate(input, { onSuccess: () => { setShowForm(false); setEditando(null); } });
            }
          }}
        />
      )}

      {verDetalle && (
        <DetalleAgenda
          agenda={verDetalle}
          onCerrar={() => setVerDetalle(null)}
          onEditar={(a) => { setEditando(a); setShowForm(true); }}
          onVerActa={(a) => setVerActa(a)}
        />
      )}

      {verActa && (
        <ActaForm agenda={verActa} onCerrar={() => setVerActa(null)} />
      )}
    </div>
  );
}
