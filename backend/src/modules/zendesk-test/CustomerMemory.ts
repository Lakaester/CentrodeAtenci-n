/**
 * CustomerMemory — Entidad persistente Cliente COPE
 * Almacena y recupera información del cliente independientemente de Zendesk.
 * Persiste en data/clientes_cope.json
 */
import * as fs from "fs";
import * as path from "path";

const DB_PATH = path.join(__dirname, "..", "..", "..", "data", "clientes_cope.json");

interface ClienteCope {
  id: string;
  nombre: string;
  correoPrincipal: string;
  correosSecundarios: string[];
  telefonos: string[];
  empresa: string | null;
  pais: string | null;
  dominios: string[];
  categorias: string[];
  subcategorias: string[];
  totalTickets: number;
  primerContacto: string;
  ultimoContacto: string;
  ultimoTicket: string | null;
  fechaCreacion: string;
  fechaActualizacion: string;
  activo: boolean;
}

let store = new Map<string, ClienteCope>();
let loaded = false;

function ensureDir(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function cargar(): void {
  if (loaded) return;
  loaded = true;
  try {
    ensureDir();
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, "utf-8");
      const data: ClienteCope[] = JSON.parse(raw);
      store = new Map(data.map((c) => [c.id, c]));
      console.log(`[CustomerMemory] Cargados ${store.size} clientes`);
    }
  } catch (err) {
    console.error("[CustomerMemory] Error al cargar:", err);
  }
}

function guardar(): void {
  try {
    ensureDir();
    const data = [...store.values()];
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[CustomerMemory] Error al guardar:", err);
  }
}

function generarId(): string {
  return `cli_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
}

export const CustomerMemory = {
  /** Buscar cliente por correo */
  buscarPorCorreo(correo: string): ClienteCope | null {
    cargar();
    const q = correo.toLowerCase();
    for (const c of store.values()) {
      if (c.correoPrincipal.toLowerCase() === q) return c;
      if (c.correosSecundarios.some((s) => s.toLowerCase() === q)) return c;
    }
    return null;
  },

  /** Buscar cliente por dominio */
  buscarPorDominio(dominio: string): ClienteCope | null {
    cargar();
    const q = dominio.toLowerCase();
    for (const c of store.values()) {
      if (c.dominios.some((d) => d.toLowerCase() === q)) return c;
    }
    return null;
  },

  /** Buscar cliente por teléfono */
  buscarPorTelefono(telefono: string): ClienteCope | null {
    cargar();
    const q = telefono.replace(/\D/g, "");
    for (const c of store.values()) {
      if (c.telefonos.some((t) => t.replace(/\D/g, "") === q)) return c;
    }
    return null;
  },

  /** Obtener o crear cliente automáticamente */
  obtenerOCrear(correo: string, nombre: string): ClienteCope {
    cargar();
    let cliente = this.buscarPorCorreo(correo);
    if (cliente) return cliente;

    // Check by domain if email has one
    const domainPart = correo.split("@")[1];
    if (domainPart) {
      const porDominio = this.buscarPorDominio(domainPart);
      if (porDominio) {
        // Suggest linking but for now, create separate
        console.log(`[CustomerMemory] Domain ${domainPart} belongs to ${porDominio.nombre}, creating new client`);
      }
    }

    const ahora = new Date().toISOString();
    const id = generarId();
    cliente = {
      id,
      nombre,
      correoPrincipal: correo,
      correosSecundarios: [],
      telefonos: [],
      empresa: null,
      pais: null,
      dominios: [],
      categorias: [],
      subcategorias: [],
      totalTickets: 0,
      primerContacto: ahora,
      ultimoContacto: ahora,
      ultimoTicket: null,
      fechaCreacion: ahora,
      fechaActualizacion: ahora,
      activo: true,
    };
    store.set(id, cliente);
    guardar();
    console.log(`[CustomerMemory] Nuevo cliente creado: ${nombre} <${correo}>`);
    return cliente;
  },

  /** Actualizar datos del cliente */
  actualizar(id: string, datos: Partial<ClienteCope>): void {
    cargar();
    const cliente = store.get(id);
    if (!cliente) return;
    Object.assign(cliente, datos, { fechaActualizacion: new Date().toISOString() });
    guardar();
  },

  /** Vincular dominio a un cliente */
  vincularDominio(correo: string, dominio: string): void {
    cargar();
    const cliente = this.buscarPorCorreo(correo) ?? this.obtenerOCrear(correo, correo.split("@")[0] || "Sin nombre");
    if (!cliente.dominios.includes(dominio)) {
      cliente.dominios.push(dominio);
      cliente.fechaActualizacion = new Date().toISOString();
      guardar();
      console.log(`[CustomerMemory] Dominio ${dominio} vinculado a ${cliente.nombre}`);
    }
  },

  /** Registrar categoría usada */
  registrarCategoria(correo: string, categoria: string, subcategoria: string): void {
    cargar();
    const cliente = this.buscarPorCorreo(correo);
    if (!cliente) return;
    if (!cliente.categorias.includes(categoria)) cliente.categorias.push(categoria);
    if (!cliente.subcategorias.includes(subcategoria)) cliente.subcategorias.push(subcategoria);
    cliente.fechaActualizacion = new Date().toISOString();
    guardar();
  },

  /** Registrar ticket resuelto */
  registrarResolucion(correo: string, ticketId: string): void {
    cargar();
    const cliente = this.buscarPorCorreo(correo) ?? this.obtenerOCrear(correo, correo.split("@")[0] || "Sin nombre");
    cliente.totalTickets++;
    cliente.ultimoTicket = ticketId;
    cliente.ultimoContacto = new Date().toISOString();
    cliente.fechaActualizacion = new Date().toISOString();
    guardar();
  },

  /** Obtener datos completos del cliente para el frontend */
  obtenerParaFrontend(correo: string, ticketId?: string): Record<string, unknown> | null {
    cargar();
    const cliente = this.buscarPorCorreo(correo);
    if (!cliente) return null;
    return {
      id: cliente.id,
      nombre: cliente.nombre,
      correoPrincipal: cliente.correoPrincipal,
      correosSecundarios: cliente.correosSecundarios,
      empresa: cliente.empresa,
      pais: cliente.pais,
      dominios: cliente.dominios,
      categorias: cliente.categorias,
      subcategorias: cliente.subcategorias,
      totalTickets: cliente.totalTickets,
      primerContacto: cliente.primerContacto,
      ultimoContacto: cliente.ultimoContacto,
      ultimoTicket: cliente.ultimoTicket ?? ticketId ?? null,
      fechaCreacion: cliente.fechaCreacion,
    };
  },

  /** Vincular correo secundario */
  vincularCorreo(correoPrincipal: string, correoSecundario: string): void {
    cargar();
    const cliente = this.buscarPorCorreo(correoPrincipal);
    if (!cliente) return;
    const q = correoSecundario.toLowerCase();
    if (!cliente.correosSecundarios.some((s) => s.toLowerCase() === q)) {
      cliente.correosSecundarios.push(correoSecundario);
      cliente.fechaActualizacion = new Date().toISOString();
      guardar();
    }
  },

  /** Sugerir vinculación por dominio */
  sugerirVinculacion(correo: string): { sugerencia: boolean; clienteExistente?: { id: string; nombre: string; dominios: string[] } } {
    cargar();
    const domainPart = correo.split("@")[1];
    if (!domainPart) return { sugerencia: false };
    const existente = this.buscarPorDominio(domainPart);
    if (existente && existente.correoPrincipal.toLowerCase() !== correo.toLowerCase()) {
      return {
        sugerencia: true,
        clienteExistente: { id: existente.id, nombre: existente.nombre, dominios: existente.dominios },
      };
    }
    return { sugerencia: false };
  },
};
