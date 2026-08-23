import { useEffect, useRef, useState, useCallback } from "react";
import { Search, CheckCircle2, AlertCircle, Loader2, Link2 } from "lucide-react";
import { localbiService } from "@/modules/localbi/services/LocalbiService";

interface Props {
  tipo: "email" | "whatsapp";
  valor: string;
  dominioExplicito?: string | null;
  ticketId: string;
  onResolved?: (data: {
    dominio: string | null;
    unidad: string | null;
    localbi_id: string | null;
    estado: string;
  }) => void;
}

interface EstadoIdentificacion {
  estado: string;
  dominios: { dominio: string; origen: string | null }[];
  dominioSeleccionado: string | null;
  origen: string | null;
  cliente: {
    unidadNegocio: string;
    nombre: string;
    localbi_id: string | null;
    totalLocales: number;
  } | null;
  mensaje?: string;
  valorNormalizado: string;
}

const ORIGEN_LABELS: Record<string, string> = {
  ZENDESK_EXPLICITO: "Zendesk",
  HISTORIAL: "Historial del contacto",
  MANUAL: "Vinculaci\u00f3n manual",
  WHATSAPP_HISTORICO: "WhatsApp",
  AUTO: "Autom\u00e1tico",
  CONFLICTO: "Conflicto",
};

export function PanelIdentificacion({ tipo, valor, dominioExplicito, ticketId, onResolved }: Props) {
  const [cargandoInicial, setCargandoInicial] = useState(false);
  const [buscandoManual, setBuscandoManual] = useState(false);
  const cargando = cargandoInicial || buscandoManual;

  const [error, setError] = useState<string | null>(null);
  const [resultado, setResultado] = useState<EstadoIdentificacion | null>(null);
  const [inputDominio, setInputDominio] = useState("");
  const [resultadoBusqueda, setResultadoBusqueda] = useState<EstadoIdentificacion | null>(null);
  const [confirmando, setConfirmando] = useState(false);

  const abortRef = useRef<AbortController | null>(null);
  const ticketIdRef = useRef<string | null>(null);
  const keyBusquedaRef = useRef<string>("");
  const onResolvedRef = useRef(onResolved);
  onResolvedRef.current = onResolved;

  const resolver = useCallback(
    async (dominioBuscado?: string) => {
      abortRef.current?.abort();
      const abort = new AbortController();
      abortRef.current = abort;

      const esBusquedaAutomatica = !dominioBuscado;
      if (esBusquedaAutomatica) {
        setCargandoInicial(true);
      }
      setError(null);
      if (esBusquedaAutomatica) setResultado(null);
      setResultadoBusqueda(null);

      try {
        const data = await localbiService.resolverContacto(tipo, valor, {
          dominioExplicito: dominioBuscado ?? dominioExplicito ?? null,
        });
        if (abort.signal.aborted) return;

        if (!data) {
          setError("No se obtuvo respuesta del servidor.");
          return;
        }

        const estado: EstadoIdentificacion = {
          estado: data.estado,
          dominios: data.dominios ?? [],
          dominioSeleccionado: data.dominioSeleccionado,
          origen: data.origen,
          cliente: data.cliente ?? null,
          mensaje: data.mensaje,
          valorNormalizado: data.valor_normalizado ?? valor,
        };

        setResultado(estado);
        if (dominioBuscado) setResultadoBusqueda(estado);

        onResolvedRef.current?.({
          dominio: data.dominioSeleccionado ?? null,
          unidad: data.cliente?.unidadNegocio ?? null,
          localbi_id: data.cliente?.localbi_id ?? null,
          estado: data.estado,
        });
      } catch (e: any) {
        if (abort.signal.aborted) return;
        setError(e?.response?.data?.error ?? e?.message ?? "Error al resolver la identidad del contacto.");
      } finally {
        if (esBusquedaAutomatica) setCargandoInicial(false);
      }
    },
    [tipo, valor, dominioExplicito]
  );

  useEffect(() => {
    if (ticketId !== ticketIdRef.current) {
      ticketIdRef.current = ticketId;
      keyBusquedaRef.current = "";
      setResultado(null);
      setResultadoBusqueda(null);
      setError(null);
      setInputDominio("");
      setConfirmando(false);
    }

    const key = `${ticketId}:${tipo}:${valor}:${dominioExplicito ?? ""}`;
    if (key === keyBusquedaRef.current) return;
    keyBusquedaRef.current = key;

    if (valor) resolver();
    return () => { abortRef.current?.abort(); };
  }, [ticketId, tipo, valor, dominioExplicito, resolver]);

  const buscarDominio = async () => {
    if (!inputDominio.trim()) return;
    setBuscandoManual(true);
    try {
      await resolver(inputDominio.trim());
    } finally {
      setBuscandoManual(false);
    }
  };

  const confirmarVinculacion = async (dominio: string) => {
    setConfirmando(true);
    try {
      await localbiService.vincularContacto(tipo, valor, dominio, resultadoBusqueda?.origen ?? "MANUAL");
      setResultado(resultadoBusqueda);
      setResultadoBusqueda(null);
      setInputDominio("");
      onResolvedRef.current?.({
        dominio,
        unidad: resultadoBusqueda?.cliente?.unidadNegocio ?? null,
        localbi_id: resultadoBusqueda?.cliente?.localbi_id ?? null,
        estado: resultadoBusqueda?.estado ?? "IDENTIFICADO_AUTO",
      });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo vincular el dominio. Intenta nuevamente.");
    } finally {
      setConfirmando(false);
    }
  };

  const estado = resultadoBusqueda?.estado ?? resultado?.estado;
  const dominio = resultadoBusqueda?.dominioSeleccionado ?? resultado?.dominioSeleccionado;
  const origen = resultadoBusqueda?.origen ?? resultado?.origen;
  const cliente = resultadoBusqueda?.cliente ?? resultado?.cliente;
  const dominios = resultadoBusqueda?.dominios ?? resultado?.dominios;
  const mensaje = resultadoBusqueda?.mensaje ?? resultado?.mensaje;

  return (
    <div className="space-y-1.5">
      <div className="flex items-center gap-1.5 text-[9px] text-black-45">
        <span className="font-medium text-black-65">{tipo === "email" ? "Email" : "WhatsApp"}:</span>
        <span className="truncate font-mono">{valor || "\u2014"}</span>
      </div>

      {cargando && (
        <div className="flex items-center gap-1.5 text-[9px] text-black-45">
          <Loader2 size={10} className="animate-spin" />
          <span>{buscandoManual ? "Buscando dominio\u2026" : "Validando dominio\u2026"}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 rounded bg-danger-5 px-1.5 py-0.5 text-[8px] text-danger">
          <AlertCircle size={9} />
          <span>{error}</span>
        </div>
      )}

      {estado === "IDENTIFICADO_AUTO" && dominio && !resultadoBusqueda && (
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="font-medium text-black-65">Dominio:</span>
            <span className="font-mono text-black-85">{dominio}</span>
          </div>
          <p className="inline-flex items-center gap-1 rounded bg-success-5 px-1.5 py-0.5 text-[8px] font-medium text-success">
            <CheckCircle2 size={9} /> Identificado autom\u00e1ticamente
          </p>
          {origen && (
            <div className="flex items-center gap-1.5 text-[8px] text-black-35">
              <span>Origen:</span>
              <span>{ORIGEN_LABELS[origen] ?? origen}</span>
            </div>
          )}
          {cliente && (
            <div className="flex items-center gap-1.5 text-[8px] text-black-35">
              <span>Unidad:</span>
              <span className="font-medium text-black-65">{cliente.nombre || cliente.unidadNegocio}</span>
            </div>
          )}
        </div>
      )}

      {estado === "REQUIERE_SELECCION" && !resultadoBusqueda && (
        <div className="space-y-1.5">
          <p className="text-[9px] text-warning-65">Este contacto tiene varios dominios vinculados. Selecciona uno:</p>
          <div className="space-y-0.5">
            {(dominios ?? []).map((d) => (
              <button
                key={d.dominio}
                type="button"
                onClick={() => setResultadoBusqueda({
                  estado: "IDENTIFICADO_AUTO",
                  dominios: dominios ?? [],
                  dominioSeleccionado: d.dominio,
                  origen: d.origen,
                  cliente: null,
                  valorNormalizado: resultado?.valorNormalizado ?? valor,
                })}
                className="flex w-full items-center gap-1.5 rounded border border-black-10 px-1.5 py-0.5 text-left text-[9px] font-mono text-black-85 hover:bg-light"
              >
                <Link2 size={9} className="shrink-0 text-primary" />
                <span className="truncate">{d.dominio}</span>
                {d.origen && <span className="ml-auto shrink-0 text-[7px] text-black-35">{d.origen}</span>}
              </button>
            ))}
          </div>
        </div>
      )}

      {estado === "DOMINIO_NO_HOMOLOGADO" && !resultadoBusqueda && (
        <div className="space-y-1">
          {dominio && (
            <div className="flex items-center gap-1.5 text-[9px]">
              <span className="font-medium text-black-65">Dominio:</span>
              <span className="font-mono text-black-85">{dominio}</span>
            </div>
          )}
          <p className="text-[8px] text-warning-65">No se encontr\u00f3 el dominio en LocalBI.</p>
        </div>
      )}

      {estado === "DOMINIO_INVALIDO" && (
        <div className="space-y-1">
          {dominio && (
            <div className="flex items-center gap-1.5 text-[9px]">
              <span className="font-medium text-black-65">Dominio:</span>
              <span className="font-mono text-danger">{dominio}</span>
            </div>
          )}
          <p className="text-[8px] text-danger">El dominio ingresado no tiene un formato v\u00e1lido.</p>
        </div>
      )}

      {estado === "LOCALBI_NO_DISPONIBLE" && (
        <p className="text-[8px] text-warning-65">No se pudo validar el dominio en este momento.</p>
      )}

      {mensaje && !["DOMINIO_NO_HOMOLOGADO", "DOMINIO_INVALIDO", "LOCALBI_NO_DISPONIBLE"].includes(estado ?? "") && (
        <p className="text-[8px] text-black-45">{mensaje}</p>
      )}

      {(estado === "SIN_IDENTIFICAR" || estado === "DOMINIO_NO_HOMOLOGADO" || estado === "REQUIERE_SELECCION") && (
        <div className="space-y-1">
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={inputDominio}
              onChange={(e) => setInputDominio(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") buscarDominio(); }}
              placeholder="Escribe el dominio..."
              className="h-6 flex-1 rounded border border-black-10 bg-white px-1.5 text-[9px] font-mono placeholder:text-black-25 focus:border-primary focus:outline-none"
            />
            <button
              type="button"
              onClick={buscarDominio}
              disabled={buscandoManual || !inputDominio.trim()}
              className="inline-flex h-6 items-center gap-1 rounded bg-primary px-2 text-[8px] font-medium text-white hover:bg-primary-85 disabled:opacity-50"
            >
              {buscandoManual ? <Loader2 size={9} className="animate-spin" /> : <Search size={9} />}
              Buscar
            </button>
          </div>
        </div>
      )}

      {resultadoBusqueda && resultadoBusqueda.estado === "HOMOLOGADO" && resultadoBusqueda.cliente && (
        <div className="space-y-1 rounded border border-success bg-success-5 p-1.5">
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="font-medium text-black-65">Dominio:</span>
            <span className="font-mono text-black-85">{resultadoBusqueda.dominioSeleccionado}</span>
          </div>
          <p className="inline-flex items-center gap-1 text-[8px] font-medium text-success">
            <CheckCircle2 size={9} /> Dominio homologado
          </p>
          <div className="text-[8px] text-black-45">
            <p>Unidad: <span className="font-medium text-black-65">{resultadoBusqueda.cliente.nombre}</span></p>
            {resultadoBusqueda.cliente.localbi_id && (
              <p>LocalBI ID: <span className="font-mono">{resultadoBusqueda.cliente.localbi_id}</span></p>
            )}
          </div>
          <button
            type="button"
            onClick={() => confirmarVinculacion(resultadoBusqueda.dominioSeleccionado!)}
            disabled={confirmando}
            className="inline-flex items-center gap-1 rounded bg-success px-2 py-0.5 text-[8px] font-medium text-white hover:bg-success-85 disabled:opacity-50"
          >
            {confirmando ? <Loader2 size={8} className="animate-spin" /> : <CheckCircle2 size={8} />}
            Confirmar vinculaci\u00f3n
          </button>
        </div>
      )}

      {resultadoBusqueda && resultadoBusqueda.estado === "IDENTIFICADO_AUTO" && resultadoBusqueda.dominioSeleccionado && (
        <div className="space-y-1 rounded border border-success bg-success-5 p-1.5">
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="font-medium text-black-65">Dominio:</span>
            <span className="font-mono text-black-85">{resultadoBusqueda.dominioSeleccionado}</span>
          </div>
          <p className="inline-flex items-center gap-1 text-[8px] font-medium text-success">
            <CheckCircle2 size={9} /> Dominio homologado
          </p>
          <button
            type="button"
            onClick={() => confirmarVinculacion(resultadoBusqueda.dominioSeleccionado!)}
            disabled={confirmando}
            className="inline-flex items-center gap-1 rounded bg-success px-2 py-0.5 text-[8px] font-medium text-white hover:bg-success-85 disabled:opacity-50"
          >
            {confirmando ? <Loader2 size={8} className="animate-spin" /> : <CheckCircle2 size={8} />}
            Confirmar vinculaci\u00f3n
          </button>
        </div>
      )}

      {resultadoBusqueda && resultadoBusqueda.estado === "DOMINIO_NO_HOMOLOGADO" && resultadoBusqueda.dominioSeleccionado && (
        <div className="space-y-1 rounded border border-warning bg-warning-5 p-1.5">
          <div className="flex items-center gap-1.5 text-[9px]">
            <span className="font-medium text-black-65">Dominio:</span>
            <span className="font-mono text-black-85">{resultadoBusqueda.dominioSeleccionado}</span>
          </div>
          <p className="text-[8px] text-warning-65">No homologado en LocalBI.</p>
          <button
            type="button"
            onClick={() => confirmarVinculacion(resultadoBusqueda.dominioSeleccionado!)}
            disabled={confirmando}
            className="inline-flex items-center gap-1 rounded bg-primary px-2 py-0.5 text-[8px] font-medium text-white hover:bg-primary-85 disabled:opacity-50"
          >
            {confirmando ? <Loader2 size={8} className="animate-spin" /> : <Link2 size={8} />}
            Asignar dominio manualmente
          </button>
        </div>
      )}

      {resultadoBusqueda && resultadoBusqueda.estado === "REQUIERE_SELECCION" && resultadoBusqueda.dominios.length > 0 && (
        <div className="space-y-1">
          <p className="text-[8px] text-warning-65">Selecciona un dominio de los candidatos:</p>
          <div className="space-y-0.5">
            {resultadoBusqueda.dominios.map((d) => (
              <button
                key={d.dominio}
                type="button"
                onClick={() => {
                  setResultadoBusqueda({
                    ...resultadoBusqueda,
                    estado: "IDENTIFICADO_AUTO",
                    dominioSeleccionado: d.dominio,
                    origen: d.origen,
                  });
                }}
                className="flex w-full items-center gap-1.5 rounded border border-black-10 px-1.5 py-0.5 text-left text-[9px] font-mono text-black-85 hover:bg-light"
              >
                <Link2 size={9} className="shrink-0 text-primary" />
                <span className="truncate">{d.dominio}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
