import { useState } from "react";
import { CheckCircle2, Clock3, MessageSquareText } from "lucide-react";
import { Button, Input, Select, Textarea } from "@/components/ui";
import type { SeguimientoCaso, SeguimientoEstado, SeguimientoGestionInput } from "@/modules/clientes-seguimiento/types";
import {
  ESTADO_UI,
  aFechaHoraLocal,
  ahoraLocalInput,
  estadosPermitidos,
  fmtFechaHora,
} from "@/modules/clientes-seguimiento/utils";

function mananaLocal(): string {
  const base = ahoraLocalInput().slice(0, 10);
  const d = new Date(`${base}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + 1);
  return `${d.toISOString().slice(0, 10)}T09:00`;
}

export function GestionForm({
  caso,
  onSubmit,
  loading,
  error,
}: {
  caso: SeguimientoCaso;
  onSubmit: (input: SeguimientoGestionInput) => Promise<unknown>;
  loading: boolean;
  error: string | null;
}) {
  const [contactoAt, setContactoAt] = useState(ahoraLocalInput());
  const [resumen, setResumen] = useState("");
  const [estadoNuevo, setEstadoNuevo] = useState<SeguimientoEstado>(estadosPermitidos(caso.estado)[0]);
  const [proximo, setProximo] = useState(caso.proximoContactoAt ? caso.proximoContactoAt.replace(" ", "T").slice(0, 16) : mananaLocal());
  const [localError, setLocalError] = useState<string | null>(null);
  const [guardado, setGuardado] = useState(false);

  const opciones = estadosPermitidos(caso.estado);
  const esReapertura = caso.estado === "finalizado";

  async function guardar() {
    setLocalError(null);
    setGuardado(false);

    const texto = resumen.trim();
    if (texto.length < 10) {
      setLocalError("El resumen debe tener al menos 10 caracteres.");
      return;
    }
    if (estadoNuevo === "con_pendientes" && !proximo) {
      setLocalError("Indica la fecha y hora del próximo contacto.");
      return;
    }

    try {
      await onSubmit({
        contactoAt: aFechaHoraLocal(contactoAt),
        proximoContactoAt: estadoNuevo === "con_pendientes" ? aFechaHoraLocal(proximo) : null,
        resumen: texto,
        estadoNuevo,
      });
      setResumen("");
      setGuardado(true);
      setContactoAt(ahoraLocalInput());
    } catch {
      // El error llega por la prop `error` desde la mutación.
    }
  }

  return (
    <div className="space-y-5">
      {caso.resumenContacto && (
        <div className="rounded-xl border border-black-10 bg-black-5/50 px-4 py-3">
          <p className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-black-45">
            <MessageSquareText size={12} /> Último contacto
          </p>
          <p className="mt-1 text-sm text-black-85">{caso.resumenContacto}</p>
          <p className="mt-1 text-[11px] text-black-45">
            {fmtFechaHora(caso.contactoAt)}
            {caso.proximoContactoAt ? ` · próximo ${fmtFechaHora(caso.proximoContactoAt)}` : ""}
          </p>
        </div>
      )}

      {esReapertura && (
        <div className="rounded-xl border border-warning/30 bg-warning-5 px-4 py-3 text-xs text-warning">
          Este caso está finalizado. Al registrar un contacto se reabrirá como <b>Con pendientes</b>.
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-black-65">
            <Clock3 size={13} /> Hora de contacto *
          </label>
          <Input
            type="datetime-local"
            value={contactoAt}
            max={ahoraLocalInput()}
            onChange={(e) => {
              setContactoAt(e.target.value);
              setGuardado(false);
            }}
          />
          <p className="mt-1 text-[11px] text-black-25">Registra el momento real del contacto.</p>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-black-65">Estado *</label>
          <Select
            value={estadoNuevo}
            onChange={(e) => {
              setEstadoNuevo(e.target.value as SeguimientoEstado);
              setGuardado(false);
            }}
            options={opciones.map((e) => ({
              value: e,
              label: e === "con_pendientes" && esReapertura ? "Reabrir con pendientes" : ESTADO_UI[e].label,
            }))}
          />
        </div>
      </div>

      <div>
        <label className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-black-65">
          <MessageSquareText size={13} /> Resumen del contacto *
        </label>
        <Textarea
          rows={5}
          maxLength={2000}
          value={resumen}
          onChange={(e) => {
            setResumen(e.target.value);
            setGuardado(false);
          }}
          placeholder="¿Con quién se habló, qué se acordó y qué queda pendiente?"
        />
        <div className="mt-1 flex items-center justify-between text-[11px] text-black-25">
          <span>Mínimo 10 caracteres. Se guarda en la bitácora del caso.</span>
          <span className={resumen.trim().length < 10 ? "text-danger" : ""}>{resumen.length} / 2000</span>
        </div>
      </div>

      {estadoNuevo === "con_pendientes" && (
        <div className="max-w-sm">
          <label className="mb-1.5 block text-xs font-medium text-black-65">Próximo contacto *</label>
          <Input
            type="datetime-local"
            value={proximo}
            min={contactoAt}
            onChange={(e) => {
              setProximo(e.target.value);
              setGuardado(false);
            }}
          />
          <p className="mt-1 text-[11px] text-black-25">
            Si la fecha vence, el caso aparecerá como pendiente vencido en el backlog.
          </p>
        </div>
      )}

      {(localError || error) && (
        <div className="rounded-lg border border-danger/30 bg-danger-5 px-3 py-2 text-xs text-danger">
          {localError ?? error}
        </div>
      )}

      {guardado && (
        <div className="flex items-center gap-2 rounded-lg border border-success/30 bg-success-5 px-3 py-2 text-xs text-success">
          <CheckCircle2 size={14} /> Contacto registrado. El caso y la bitácora se actualizaron.
        </div>
      )}

      <div className="flex items-center justify-end gap-2 border-t border-black-5 pt-4">
        <Button variant="primary" onClick={guardar} loading={loading}>
          Guardar gestión
        </Button>
      </div>
    </div>
  );
}
