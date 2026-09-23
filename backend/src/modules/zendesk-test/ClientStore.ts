import * as fs from "fs";
import * as path from "path";
import { normalizeDomain } from "../../domain/contacto/normalizacion";

const DB_PATH = path.join(__dirname, "..", "..", "..", "data", "clientes.json");

interface ClienteData {
  email: string;
  dominios: string[];
  primerContacto: string;
  ultimoContacto: string;
  totalTickets: number;
}

let store = new Map<string, ClienteData>();
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
      const data: ClienteData[] = JSON.parse(raw);
      store = new Map(data.map((c) => [c.email.toLowerCase(), c]));
      console.log(`[ClientStore] Cargados ${store.size} clientes desde ${DB_PATH}`);
    }
  } catch (err) {
    console.error("[ClientStore] Error al cargar:", err);
  }
}

function guardar(): void {
  try {
    ensureDir();
    const data = [...store.values()];
    fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
  } catch (err) {
    console.error("[ClientStore] Error al guardar:", err);
  }
}

export const ClientStore = {
  obtener(email: string): { dominios: string[]; primerContacto: string; ultimoContacto: string; totalTickets: number } | null {
    cargar();
    const r = store.get(email.toLowerCase());
    if (!r) return null;
    return { dominios: r.dominios, primerContacto: r.primerContacto, ultimoContacto: r.ultimoContacto, totalTickets: r.totalTickets };
  },

  registrar(email: string, dominio: string): void {
    const d = normalizeDomain(dominio);
    if (!email || !d) return;
    cargar();
    const key = email.toLowerCase();
    const existing = store.get(key);
    if (existing) {
      if (!existing.dominios.includes(d)) existing.dominios.push(d);
      existing.ultimoContacto = new Date().toISOString();
      existing.totalTickets++;
    } else {
      store.set(key, {
        email: key,
        dominios: [d],
        primerContacto: new Date().toISOString(),
        ultimoContacto: new Date().toISOString(),
        totalTickets: 1,
      });
    }
    guardar();
  },

  agregarDominio(email: string, dominio: string): void {
    const d = normalizeDomain(dominio);
    if (!email || !d) return;
    cargar();
    const key = email.toLowerCase();
    const existing = store.get(key);
    if (existing) {
      if (!existing.dominios.includes(d)) existing.dominios.push(d);
    } else {
      store.set(key, {
        email: key,
        dominios: [d],
        primerContacto: new Date().toISOString(),
        ultimoContacto: new Date().toISOString(),
        totalTickets: 0,
      });
    }
    guardar();
  },

  eliminarDominio(email: string, dominio: string): void {
    cargar();
    const r = store.get(email.toLowerCase());
    if (r) {
      r.dominios = r.dominios.filter((d) => normalizeDomain(d) !== normalizeDomain(dominio));
      guardar();
    }
  },

  listar(): { email: string; dominios: string[] }[] {
    cargar();
    return [...store.values()].map((c) => ({ email: c.email, dominios: c.dominios }));
  },
};
