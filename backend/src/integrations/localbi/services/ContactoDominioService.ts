/**
 * ContactoDominioService — lógica de vinculación contacto ↔ dominios.
 */
import {
  contactoDominioRepository,
  normalizarIdentidad,
  type ContactoTipo,
} from "../../../repositories/contactoDominio.repository";

export interface ContactoDominioResultado {
  tipo: ContactoTipo;
  valor_normalizado: string;
  dominios: string[];
}

export const contactoDominioService = {
  /** Dominios activos de un contacto (email o whatsapp). */
  async obtenerDominios(tipo: ContactoTipo, valor: string): Promise<ContactoDominioResultado> {
    const dominios = await contactoDominioRepository.obtenerDominios(tipo, valor);
    return { tipo, valor_normalizado: normalizarIdentidad(tipo, valor), dominios };
  },

  /** Vincula un dominio a un contacto (múltiples dominios permitidos). */
  async vincularDominio(tipo: ContactoTipo, valor: string, dominio: string, usuario: string | null): Promise<ContactoDominioResultado> {
    await contactoDominioRepository.vincularDominio(tipo, valor, dominio, usuario);
    return this.obtenerDominios(tipo, valor);
  },

  /** Desactiva un dominio de un contacto. */
  async desvincularDominio(tipo: ContactoTipo, valor: string, dominio: string): Promise<ContactoDominioResultado> {
    await contactoDominioRepository.desvincularDominio(tipo, valor, dominio);
    return this.obtenerDominios(tipo, valor);
  },
};
