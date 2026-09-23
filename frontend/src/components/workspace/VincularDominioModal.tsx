import { useState, useCallback, useRef, useEffect } from "react";
import { X, Loader2, Check, Link2, Search } from "lucide-react";
import { localbiService } from "@/modules/localbi/services/LocalbiService";
import { registrarIdentificacion } from "@/modules/atenciones/services/atencionesOperativaService";
import { normalizeDomain, isValidDomainFormat } from "@/domain/normalizacion";

interface Props {
  tipo: "email" | "whatsapp";
  valor: string;
  ticketId: string;
  dominiosHistoricos?: { dominio: string; origen: string | null }[];
  onClose: () => void;
  onVinculado: (dominio: string, info?: { unidadNegocio?: string | null; nombre?: string | null; localbi_id?: string | null }) => void;
}


/**
 * Modal "Vincular dominio" — asocia un dominio a ESTA atención.
 *
 * Permite:
 *   1. Seleccionar un dominio histórico del contacto (si existe).
 *   2. Buscar un dominio (homologación LocalBI opcional).
 *   3. Escribir un dominio manualmente.
 *   4. Guardar aunque LocalBI no lo conozca (si pasa la validación de formato).
 *
 * Al confirmar persiste en DOS lugares:
 *   - POST /contactos/dominio (relación contacto ↔ dominio)
 *   - POST /atenciones/:id/operativa/identificacion (snapshot de la atención)
 */
export function VincularDominioModal({ tipo, valor, ticketId, dominiosHistoricos, onClose, onVinculado }: Props) {
  const [input, setInput] = useState("");
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [propuesta, setPropuesta] = useState<{
    dominio: string;
    homologado: boolean;
    cliente: { unidadNegocio: string; nombre: string; localbi_id: string | null } | null;
  } | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Limpiar propuesta al cambiar input.
  useEffect(() => { setPropuesta(null); setError(null); }, [input]);

  const historicos = (dominiosHistoricos ?? []).filter((d) => d.dominio);

  const buscar = useCallback(async () => {
    const d = normalizeDomain(input);
    if (!isValidDomainFormat(d)) {
      setError("Ingresa un dominio con formato válido (ej: ejemplo.restaurant.pe).");
      setPropuesta(null);
      return;
    }
    abortRef.current?.abort();
    setBuscando(true);
    setError(null);
    try {
      const data = await localbiService.resolverContacto(tipo, valor, { dominioExplicito: d });
      if (data?.estado === "DOMINIO_INVALIDO") {
        setError("El dominio ingresado no tiene un formato válido.");
        setPropuesta(null);
        return;
      }
      // Aceptar el dominio aunque LocalBI no lo conozca (NO bloquear).
      const homologado = data?.estado === "IDENTIFICADO_AUTO" || data?.estado === "HOMOLOGADO";
      setPropuesta({
        dominio: d,
        homologado,
        cliente: data?.cliente
          ? { unidadNegocio: data.cliente.unidadNegocio, nombre: data.cliente.nombre, localbi_id: data.cliente.localbi_id ?? null }
          : null,
      });
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo validar el dominio.");
    } finally {
      setBuscando(false);
    }
  }, [input, tipo, valor]);

  const seleccionar = (d: string) => {
    setInput(d);
    setPropuesta({ dominio: normalizeDomain(d), homologado: true, cliente: null });
  };

  const confirmar = async () => {
    const d = propuesta?.dominio || normalizeDomain(input);
    if (!isValidDomainFormat(d)) {
      setError("Ingresa un dominio válido.");
      return;
    }
    setGuardando(true);
    setError(null);
    try {
      // 1) Relación contacto ↔ dominio (contacto_dominio).
      await localbiService.vincularContacto(tipo, valor, d, "MANUAL");
      // 2) Snapshot en la atención (atencion.dominio_identificado).
      await registrarIdentificacion(ticketId, { dominio: d, tipoIdentificacion: "MANUAL" });

      // Resolver la unidad exacta para que el Panel Operativo la use de inmediato
      // (sin recargar ni re-derivar por búsqueda genérica de subdominio).
      let info: { unidadNegocio?: string | null; nombre?: string | null; localbi_id?: string | null } | undefined;
      if (propuesta?.cliente) {
        info = {
          unidadNegocio: propuesta.cliente.unidadNegocio,
          nombre: propuesta.cliente.nombre,
          localbi_id: propuesta.cliente.localbi_id,
        };
      } else {
        try {
          const data = await localbiService.resolverContacto(tipo, valor, { dominioExplicito: d });
          if (data?.cliente) {
            info = {
              unidadNegocio: data.cliente.unidadNegocio,
              nombre: data.cliente.nombre,
              localbi_id: data.cliente.localbi_id ?? null,
            };
          }
        } catch {
          // Si no se pudo homologar la unidad, se vincula igualmente (dato manual).
        }
      }

      onVinculado(d, info);
      onClose();
    } catch (e: any) {
      setError(e?.response?.data?.error ?? "No se pudo vincular el dominio. Intenta nuevamente.");
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black-65/40 p-4">
      <div className="flex max-h-[85%] w-[520px] max-w-full flex-col overflow-hidden rounded-lg border border-black-10 bg-white shadow-lg">
        <div className="flex shrink-0 items-center justify-between border-b border-black-10 px-4 py-3">
          <h3 className="flex items-center gap-2 text-xs font-semibold text-black-85">
            <Link2 size={14} className="text-primary" /> Vincular dominio
          </h3>
          <button type="button" onClick={onClose} className="text-black-45 hover:text-black-65"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {/* Contacto */}
          <div className="mb-3 rounded border border-black-5 bg-light px-3 py-2 text-[10px] text-black-65">
            <p><span className="text-black-25">Contacto: </span>{valor || "—"}</p>
            <p><span className="text-black-25">Tipo: </span>{tipo === "email" ? "Email" : "WhatsApp"}</p>
          </div>

          {/* Dominios históricos */}
          {historicos.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-[9px] font-medium text-black-45">Dominios del historial del contacto</p>
              <div className="space-y-0.5">
                {historicos.map((d) => (
                  <button
                    key={d.dominio}
                    type="button"
                    onClick={() => seleccionar(d.dominio)}
                    className="flex w-full items-center gap-1.5 rounded border border-black-10 px-1.5 py-1 text-left text-[9px] font-mono text-black-85 hover:bg-light"
                  >
                    <Link2 size={9} className="shrink-0 text-primary" />
                    <span className="truncate">{d.dominio}</span>
                    {d.origen && <span className="ml-auto shrink-0 text-[7px] text-black-35">{d.origen}</span>}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input + buscar */}
          <div className="mb-2">
            <label className="mb-1 block text-[9px] font-medium text-black-45">Dominio</label>
            <div className="flex gap-1.5">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") buscar(); }}
                placeholder="ejemplo.restaurant.pe"
                className="h-7 flex-1 rounded border border-black-10 bg-white px-2 font-mono text-[10px] focus:border-primary focus:outline-none"
              />
              <button
                type="button"
                onClick={buscar}
                disabled={buscando || !input.trim()}
                className="inline-flex h-7 items-center gap-1 rounded bg-primary px-2.5 text-[9px] font-medium text-white hover:bg-primary-85 disabled:opacity-50"
              >
                {buscando ? <Loader2 size={10} className="animate-spin" /> : <Search size={10} />}
                Buscar
              </button>
            </div>
          </div>

          {/* Propuesta de homologación */}
          {propuesta && (
            <div className={`mb-2 space-y-1 rounded border p-2 ${propuesta.homologado ? "border-success bg-success-5" : "border-warning bg-warning-5"}`}>
              <div className="flex items-center gap-1.5 text-[9px]">
                <span className="font-medium text-black-65">Dominio:</span>
                <span className="font-mono text-black-85">{propuesta.dominio}</span>
              </div>
              {propuesta.homologado ? (
                <p className="flex items-center gap-1 text-[8px] font-medium text-success">
                  <Check size={9} /> Dominio válido
                  {propuesta.cliente ? ` · ${propuesta.cliente.nombre}` : ""}
                </p>
              ) : (
                <p className="text-[8px] text-warning-65">
                  Dominio no encontrado en LocalBI, pero tiene formato válido. Podrás vincularlo igualmente.
                </p>
              )}
            </div>
          )}

          {error && <p className="mb-2 text-[9px] text-danger">{error}</p>}
          <p className="text-[8px] text-black-35">
            La vinculación se registra en la relación contacto↔dominio y en el registro operativo de esta atención.
          </p>
        </div>

        <div className="flex shrink-0 justify-end gap-2 border-t border-black-10 px-4 py-2">
          <button type="button" onClick={onClose} className="rounded border border-black-10 px-3 py-1 text-[9px] text-black-45 hover:bg-light">
            Cancelar
          </button>
          <button
            type="button"
            onClick={confirmar}
            disabled={guardando || !normalizeDomain(input)}
            className="inline-flex items-center gap-1 rounded bg-primary px-3 py-1 text-[9px] font-medium text-white hover:bg-primary-85 disabled:opacity-50"
          >
            {guardando ? <Loader2 size={10} className="animate-spin" /> : <Link2 size={10} />}
            Confirmar vinculación
          </button>
        </div>
      </div>
    </div>
  );
}