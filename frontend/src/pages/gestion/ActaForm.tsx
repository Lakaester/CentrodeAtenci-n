import { useState, type ComponentProps } from "react";
import { Plus, Trash2, X, CheckCircle2, Clock, FileText, Save, Download } from "lucide-react";
import {
  useAgendaGuardarActa,
  type Agenda, type ActaContenido, type ActaParticipante, type ActaAcuerdo,
} from "@/modules/gestion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea } from "@/components/ui/Input";

const TIPO_LABEL: Record<string, string> = { REUNION: "Reunión", CAPACITACION: "Capacitación" };
const ESTADO_BADGE: Record<string, "warning" | "primary" | "success" | "danger"> = {
  PENDIENTE: "warning", ACTIVA: "primary", FINALIZADA: "success", CANCELADA: "danger",
};
const ACTA_TIPOS_CASO = ["Consulta", "Soporte técnico", "Capacitación", "Incidente", "Reclamo", "Queja", "Solicitud", "Migración", "Otro"];
const ACTA_RESULTADOS = ["Realizada", "Realizada con pendientes", "Requiere seguimiento", "No realizada"];

/** Wrappers locales que añaden label/help a los controles base (los ui/* no soportan label). */
function CampoTexto({ label, help, ...rest }: { label?: string; help?: string } & ComponentProps<typeof Input>) {
  return (
    <div className="w-full">
      {label ? <label className="mb-0.5 block text-[10px] font-medium text-black-45">{label}</label> : null}
      <Input {...rest} />
      {help ? <p className="mt-0.5 text-[9px] text-black-45">{help}</p> : null}
    </div>
  );
}

function CampoSelect({ label, ...rest }: { label?: string } & ComponentProps<typeof Select>) {
  return (
    <div className="w-full">
      {label ? <label className="mb-0.5 block text-[10px] font-medium text-black-45">{label}</label> : null}
      <Select {...rest} />
    </div>
  );
}

function CampoArea({ label, help, ...rest }: { label?: string; help?: string } & ComponentProps<typeof Textarea>) {
  return (
    <div className="w-full">
      {label ? <label className="mb-0.5 block text-[10px] font-medium text-black-45">{label}</label> : null}
      <Textarea {...rest} />
      {help ? <p className="mt-0.5 text-[9px] text-black-45">{help}</p> : null}
    </div>
  );
}

function fmtHora(v: string | null | undefined): string {
  if (!v) return "—";
  if (v.includes("T")) { const m = v.match(/T(\d{2}):(\d{2})/); return m ? `${m[1]}:${m[2]}` : v; }
  return v.substring(0, 5);
}
function fmtFecha(v: string | null | undefined): string {
  if (!v) return "—";
  const d = new Date(v + "T00:00:00");
  return d.toLocaleDateString("es-PE", { day: "2-digit", month: "2-digit", year: "numeric" });
}
function fmtDuracion(min: number | null | undefined): string {
  if (min == null) return "—";
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}h ${m}min` : `${m} min`;
}

function crearActaVacia(agenda: Agenda): ActaContenido {
  return {
    participantes: [
      { nombre: agenda.asesor_nombre, empresa: "Restaurant.pe", cargo: "Asesor", participacion: "Principal" },
      ...(agenda.cliente_nombre ? [{ nombre: agenda.cliente_nombre, empresa: "", cargo: "", participacion: "" }] : []),
    ],
    tipo_caso: "",
    motivo: "",
    desarrollo: "",
    diagnostico: "",
    gestion: "",
    solucion: "",
    acuerdos: [],
    resultado_acta: "",
    requiere_seguimiento: false,
    seguimiento_fecha: "",
    seguimiento_detalle: "",
    observaciones: "",
    evidencias: [],
  };
}

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded border border-black-10 p-3 text-xs space-y-2">
      <div className="font-medium text-black-65 flex items-center gap-1.5">{icon} {title}</div>
      {children}
    </div>
  );
}

export function ActaForm({ agenda, onCerrar }: { agenda: Agenda; onCerrar: () => void }) {
  const guardarMut = useAgendaGuardarActa();
  const [contenido, setContenido] = useState<ActaContenido>(
    agenda.acta_contenido ?? crearActaVacia(agenda)
  );
  const [estado, setEstado] = useState<"BORRADOR" | "FINALIZADA">(
    agenda.acta_estado === "FINALIZADA" ? "FINALIZADA" : "BORRADOR"
  );

  const set = <K extends keyof ActaContenido>(key: K, value: ActaContenido[K]) => {
    setContenido((c) => ({ ...c, [key]: value }));
  };

  const guardar = (estadoFinal: "BORRADOR" | "FINALIZADA") => {
    guardarMut.mutate(
      { id: agenda.id, contenido, estado: estadoFinal },
      { onSuccess: () => { if (estadoFinal === "FINALIZADA") setEstado("FINALIZADA"); } }
    );
  };

  const agregarParticipante = () => {
    set("participantes", [...contenido.participantes, { nombre: "", empresa: "", cargo: "", participacion: "" }]);
  };
  const eliminarParticipante = (idx: number) => {
    set("participantes", contenido.participantes.filter((_, i) => i !== idx));
  };
  const actualizarParticipante = (idx: number, campo: keyof ActaParticipante, valor: string) => {
    const nuevos = [...contenido.participantes];
    nuevos[idx] = { ...nuevos[idx], [campo]: valor };
    set("participantes", nuevos);
  };

  const agregarAcuerdo = () => {
    set("acuerdos", [...contenido.acuerdos, { id: crypto.randomUUID(), descripcion: "", responsable: "Restaurant.pe" as const, fecha_limite: "", estado: "Pendiente" as const }]);
  };
  const eliminarAcuerdo = (id: string) => {
    set("acuerdos", contenido.acuerdos.filter((a) => a.id !== id));
  };
  const actualizarAcuerdo = (id: string, campo: keyof ActaAcuerdo, valor: string) => {
    set("acuerdos", contenido.acuerdos.map((a) => a.id === id ? { ...a, [campo]: valor } : a));
  };

  const noFinalizado = estado !== "FINALIZADA";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 overflow-y-auto py-8">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl my-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-black-10 px-5 py-4">
          <div>
            <h3 className="text-sm font-semibold text-black-85">Acta de Atención</h3>
            <p className="text-[10px] text-black-45 mt-0.5">Complete la información de la atención y genere el acta.</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={estado === "FINALIZADA" ? "success" : "warning"}>{estado}</Badge>
            <button onClick={onCerrar} className="text-black-45 hover:text-black-85"><X size={18} /></button>
          </div>
        </div>

        <div className="px-5 py-4 space-y-5 max-h-[75vh] overflow-y-auto">
          {/* Resumen de la Agenda */}
          <div className="rounded border border-black-10 bg-light/50 p-3 text-[10px] space-y-1">
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              <div><span className="text-black-45">Agenda:</span> <span className="font-medium font-mono">{agenda.ticket}</span></div>
              <div><span className="text-black-45">Estado:</span> <Badge variant={ESTADO_BADGE[agenda.estado]}>{agenda.estado}</Badge></div>
              <div><span className="text-black-45">Fecha:</span> <span className="font-medium">{fmtFecha(agenda.fecha)}</span></div>
              <div><span className="text-black-45">Tipo:</span> <span className="font-medium">{TIPO_LABEL[agenda.tipo]}</span></div>
              <div><span className="text-black-45">Asesor:</span> <span className="font-medium">{agenda.asesor_nombre}</span></div>
              <div><span className="text-black-45">Cliente:</span> <span className="font-medium">{agenda.cliente_nombre || "—"}</span></div>
              <div><span className="text-black-45">Dominio:</span> <span className="font-medium">{agenda.dominio || "—"}</span></div>
              <div><span className="text-black-45">Horario:</span> <span className="font-medium">{fmtHora(agenda.hora_inicio)} – {fmtHora(agenda.hora_fin)}</span></div>
              <div><span className="text-black-45">Hora real:</span> <span className="font-medium">{agenda.hora_inicio_real ? `${fmtHora(agenda.hora_inicio_real)} – ${fmtHora(agenda.hora_fin_real!)}` : "—"}</span></div>
              <div><span className="text-black-45">Duración:</span> <span className="font-medium">{fmtDuracion(agenda.duracion_real_min)}</span></div>
              <div><span className="text-black-45">N.º de Acta:</span> <span className="font-medium font-mono">ACTA-{agenda.ticket}</span></div>
              {agenda.grabacion_url && (
                <div className="col-span-2"><span className="text-black-45">Grabación:</span> <a href={agenda.grabacion_url} target="_blank" rel="noopener noreferrer" className="text-primary underline">Ver grabación</a></div>
              )}
            </div>
          </div>

          {/* 1. PARTICIPANTES */}
          <Section icon={<CheckCircle2 size={12} />} title="Participantes">
            <div className="space-y-2">
              {contenido.participantes.map((p, idx) => (
                <div key={idx} className="grid grid-cols-[1fr_1fr_1fr_100px_28px] gap-2 items-end">
                  <CampoTexto label="Nombre" value={p.nombre} onChange={(e) => actualizarParticipante(idx, "nombre", e.target.value)} disabled={noFinalizado} />
                  <CampoTexto label="Empresa / Área" value={p.empresa} onChange={(e) => actualizarParticipante(idx, "empresa", e.target.value)} disabled={noFinalizado} />
                  <CampoTexto label="Cargo / Rol" value={p.cargo} onChange={(e) => actualizarParticipante(idx, "cargo", e.target.value)} disabled={noFinalizado} />
                  <CampoTexto label="Participación" value={p.participacion} onChange={(e) => actualizarParticipante(idx, "participacion", e.target.value)} disabled={noFinalizado} />
                  {!noFinalizado && (
                    <button onClick={() => eliminarParticipante(idx)} className="text-danger hover:text-danger-85 p-1 mb-0.5"><Trash2 size={14} /></button>
                  )}
                </div>
              ))}
              {!noFinalizado && (
                <Button variant="ghost" size="sm" onClick={agregarParticipante}><Plus size={12} /> Agregar participante</Button>
              )}
            </div>
          </Section>

          {/* 2. MOTIVO DE LA ATENCIÓN */}
          <Section icon={<Clock size={12} />} title="Motivo de la atención">
            <div className="space-y-2">
              <CampoSelect label="Tipo de caso" value={contenido.tipo_caso} onChange={(e) => set("tipo_caso", e.target.value)} disabled={noFinalizado}
                options={ACTA_TIPOS_CASO.map((t) => ({ value: t, label: t }))} placeholder="Seleccionar..." />
              {agenda.descripcion && (
                <div className="text-[10px] text-black-45 bg-light rounded p-2">
                  <strong>Descripción de Agenda:</strong> {agenda.descripcion}
                </div>
              )}
              <CampoArea label="Descripción del motivo de la atención" value={contenido.motivo} onChange={(e) => set("motivo", e.target.value)} rows={3} disabled={noFinalizado} />
            </div>
          </Section>

          {/* 3. DESARROLLO */}
          <Section icon={<FileText size={12} />} title="Desarrollo de la atención">
            <CampoArea label="Temas tratados y hechos relevantes" help="Describa objetivamente los principales temas tratados durante la atención." value={contenido.desarrollo} onChange={(e) => set("desarrollo", e.target.value)} rows={4} disabled={noFinalizado} />
          </Section>

          {/* 4. DIAGNÓSTICO Y GESTIÓN */}
          <Section icon={<CheckCircle2 size={12} />} title="Diagnóstico y gestión realizada">
            <div className="space-y-2">
              <CampoArea label="Diagnóstico / análisis" value={contenido.diagnostico} onChange={(e) => set("diagnostico", e.target.value)} rows={3} disabled={noFinalizado} />
              <CampoArea label="Gestión realizada" value={contenido.gestion} onChange={(e) => set("gestion", e.target.value)} rows={3} disabled={noFinalizado} />
              <CampoArea label="Solución brindada" value={contenido.solucion} onChange={(e) => set("solucion", e.target.value)} rows={3} disabled={noFinalizado} />
            </div>
          </Section>

          {/* 5. ACUERDOS Y COMPROMISOS */}
          <Section icon={<CheckCircle2 size={12} />} title="Acuerdos y compromisos">
            <div className="overflow-x-auto">
              <table className="w-full text-[10px] border-collapse">
                <thead>
                  <tr className="bg-light text-left">
                    <th className="p-1.5 font-medium text-black-65 w-8">#</th>
                    <th className="p-1.5 font-medium text-black-65">Compromiso / acuerdo</th>
                    <th className="p-1.5 font-medium text-black-65 w-28">Responsable</th>
                    <th className="p-1.5 font-medium text-black-65 w-24">Fecha límite</th>
                    <th className="p-1.5 font-medium text-black-65 w-24">Estado</th>
                    {!noFinalizado && <th className="p-1.5 w-8" />}
                  </tr>
                </thead>
                <tbody>
                  {contenido.acuerdos.length === 0 && (
                    <tr><td colSpan={6} className="p-3 text-center text-black-45">Sin acuerdos registrados</td></tr>
                  )}
                  {contenido.acuerdos.map((a, idx) => (
                    <tr key={a.id} className="border-t border-black-5">
                      <td className="p-1.5 text-black-45">{idx + 1}</td>
                      <td className="p-1"><Input value={a.descripcion} onChange={(e) => actualizarAcuerdo(a.id, "descripcion", e.target.value)} disabled={noFinalizado} /></td>
                      <td className="p-1">
                        <Select value={a.responsable} onChange={(e) => actualizarAcuerdo(a.id, "responsable", e.target.value)} disabled={noFinalizado}
                          options={[{ value: "Restaurant.pe", label: "Restaurant.pe" }, { value: "Cliente", label: "Cliente" }]} />
                      </td>
                      <td className="p-1"><Input type="date" value={a.fecha_limite} onChange={(e) => actualizarAcuerdo(a.id, "fecha_limite", e.target.value)} disabled={noFinalizado} /></td>
                      <td className="p-1">
                        <Select value={a.estado} onChange={(e) => actualizarAcuerdo(a.id, "estado", e.target.value)} disabled={noFinalizado}
                          options={[{ value: "Pendiente", label: "Pendiente" }, { value: "En proceso", label: "En proceso" }, { value: "Completado", label: "Completado" }]} />
                      </td>
                      {!noFinalizado && (
                        <td className="p-1"><button onClick={() => eliminarAcuerdo(a.id)} className="text-danger hover:text-danger-85"><Trash2 size={12} /></button></td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!noFinalizado && (
              <Button variant="ghost" size="sm" onClick={agregarAcuerdo}><Plus size={12} /> Agregar compromiso</Button>
            )}
          </Section>

          {/* 6. RESULTADO Y SEGUIMIENTO */}
          <Section icon={<CheckCircle2 size={12} />} title="Resultado y seguimiento">
            <div className="space-y-2">
              <CampoSelect label="Resultado de la atención" value={contenido.resultado_acta} onChange={(e) => set("resultado_acta", e.target.value)} disabled={noFinalizado}
                options={ACTA_RESULTADOS.map((r) => ({ value: r, label: r }))} placeholder="Seleccionar..." />
              <div className="flex items-center gap-3">
                <label className="text-[10px] font-medium text-black-45">¿Requiere seguimiento?</label>
                <label className="flex items-center gap-1 text-[10px]"><input type="radio" name="seguimiento" checked={!contenido.requiere_seguimiento} onChange={() => set("requiere_seguimiento", false)} disabled={noFinalizado} /> No</label>
                <label className="flex items-center gap-1 text-[10px]"><input type="radio" name="seguimiento" checked={contenido.requiere_seguimiento} onChange={() => set("requiere_seguimiento", true)} disabled={noFinalizado} /> Sí</label>
              </div>
              {contenido.requiere_seguimiento && (
                <div className="space-y-2">
                  <CampoTexto label="Fecha estimada de seguimiento" type="date" value={contenido.seguimiento_fecha} onChange={(e) => set("seguimiento_fecha", e.target.value)} disabled={noFinalizado} />
                  <CampoArea label="Detalle del seguimiento" value={contenido.seguimiento_detalle} onChange={(e) => set("seguimiento_detalle", e.target.value)} rows={3} disabled={noFinalizado} />
                </div>
              )}
            </div>
          </Section>

          {/* 7. EVIDENCIAS Y ANEXOS */}
          <Section icon={<FileText size={12} />} title="Evidencias y anexos">
            <div className="rounded bg-light p-3 text-[10px] text-black-45">
              <p><strong className="text-black-65">Pendiente:</strong> Infraestructura de upload no implementada. Los archivos adjuntos se habilitarán en una futura fase.</p>
            </div>
          </Section>

          {/* 8. OBSERVACIONES FINALES */}
          <Section icon={<FileText size={12} />} title="Observaciones finales">
            <CampoArea label="Observaciones finales" value={contenido.observaciones} onChange={(e) => set("observaciones", e.target.value)} rows={4} disabled={noFinalizado} />
          </Section>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 border-t border-black-10 px-5 py-3">
          <Button variant="ghost" size="sm" onClick={onCerrar}>Cerrar</Button>
          {noFinalizado ? (
            <>
              <Button variant="outline" size="sm" onClick={() => guardar("BORRADOR")} disabled={guardarMut.isPending}>
                <Save size={12} /> {guardarMut.isPending ? "Guardando..." : "Guardar borrador"}
              </Button>
              <Button variant="success" size="sm" onClick={() => guardar("FINALIZADA")} disabled={guardarMut.isPending}>
                <CheckCircle2 size={12} /> Generar acta
              </Button>
            </>
          ) : agenda.acta_nombre ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => window.open(`/api/gestion/agendas/${agenda.id}/acta/pdf`, "_blank")}
            >
              <Download size={12} /> Descargar PDF
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
